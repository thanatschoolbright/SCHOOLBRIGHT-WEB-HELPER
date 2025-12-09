import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// --- 1. Configuration & Constants ---

type RepoConfig = {
  webhookEnv: string;
  mentionUserId: string;
  friendlyName: string;
};

// Map Repo to Discord Config
const REPO_DIRECTORY: Record<string, RepoConfig> = {
  "Jabjai-Corporation/robodocs-api-main": {
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_ROBODOCS_SERVER",
    mentionUserId: "692371893826879568", // Light
    friendlyName: "RoboDocs API",
  },
  "Jabjai-Corporation/sb-web-system": {
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_SYSTEM_SERVER",
    mentionUserId: "252888614214893579", // Joe
    friendlyName: "School Bright System",
  },
  "Jabjai-Corporation/sb-web-academic": {
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_ACADEMIC_SERVER",
    mentionUserId: "1143863276698042428", // Krishnan
    friendlyName: "Academic Module",
  },
  "Jabjai-Corporation/sb-web-accounting-system": {
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_ACCOUNTING_SERVER",
    mentionUserId: "1207973995297404978", // Tuk
    friendlyName: "Accounting System",
  },
  // Default Fallback
  default: {
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_CHECK_STATUS_DEPLOY_BOT",
    mentionUserId: "692371893826879568",
    friendlyName: "Unknown Repository",
  },
};

// --- 2. Tracking Logic (The "Delivery" Metaphor) ---

type DeliveryState = {
  statusLabel: string;
  description: string;
  color: number;
  icon: string;
  stepper: string;
};

const getDeliveryStatus = (state: string, env: string): DeliveryState => {
  const envName = env.toUpperCase();

  switch (state) {
    case "queued":
    case "pending":
      return {
        statusLabel: "Order Received",
        description: "Package is being prepared for shipment. Standing by.",
        color: 0x95a5a6, // Gray
        icon: "📦",
        stepper: "**[📦 Prepared]** ┄┄ ⚪ Transit ┄┄ ⚪ Delivered",
      };
    case "in_progress":
      return {
        statusLabel: "In Transit",
        description: `Shipment is on the way to **${envName}**.`,
        color: 0xf39c12, // Orange/Yellow
        icon: "🚚",
        stepper: "✅ Prepared ┄┄ **[🚚 Transit]** ┄┄ ⚪ Delivered",
      };
    case "success":
      return {
        statusLabel: "Delivered",
        description: `Package successfully arrived at **${envName}**. Deployment complete.`,
        color: 0x2ecc71, // Green
        icon: "🎁",
        stepper: "✅ Prepared ┄┄ ✅ Transit ┄┄ **[🎁 Delivered]**",
      };
    case "failure":
    case "error":
      return {
        statusLabel: "Delivery Exception",
        description: "Shipment encountered an error and returned to sender.",
        color: 0xe74c3c, // Red
        icon: "🚨",
        stepper: "✅ Prepared ┄┄ ❌ **[Crashed]** ┄┄ ⚪ Delivered",
      };
    default:
      return {
        statusLabel: "Status Update",
        description: `Current status: ${state}`,
        color: 0x3498db, // Blue
        icon: "📡",
        stepper: "⚪ Unknown Status",
      };
  }
};

// --- 3. Payload Builder ---

const buildTrackingPayload = (
  repoName: string,
  config: RepoConfig,
  payload: any
) => {
  const deployment = payload.deployment;
  const status = payload.deployment_status;

  // Extract Data
  const state = status.state;
  const environment = deployment.environment;
  const creator = deployment.creator.login;
  const targetUrl = status.target_url || status.log_url;
  const trackingId = deployment.id;
  const commitSha = deployment.sha.substring(0, 7);
  const deliveryInfo = getDeliveryStatus(state, environment);

  // Components (Buttons)
  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "📄 View Waybill (Logs)",
          url: targetUrl || deployment.repository_url,
          emoji: { name: "🧾" },
        },
        {
          type: 2,
          style: 5,
          label: "📍 Track Shipment",
          url:
            deployment.html_url || `https://github.com/${repoName}/deployments`,
          emoji: { name: "🗺️" },
        },
      ],
    },
  ];

  const embed = {
    title: `${deliveryInfo.icon} Shipment Update: #${trackingId}`,
    description: `${deliveryInfo.stepper}\n\n**${deliveryInfo.statusLabel}**: ${deliveryInfo.description}`,
    url: targetUrl,
    color: deliveryInfo.color,
    fields: [
      {
        name: "📦 Package (Commit)",
        value: `\`${commitSha}\``,
        inline: true,
      },
      {
        name: "📍 Destination",
        value: `\`${environment.toUpperCase()}\``,
        inline: true,
      },
      {
        name: "👮 Courier (By)",
        value: creator,
        inline: true,
      },
      {
        name: "⏱️ Timestamp",
        value: `<t:${Math.floor(Date.now() / 1000)}:R>`, // Relative time
        inline: true,
      },
    ],
    footer: {
      text: `${config.friendlyName} • Logistics & Deployment`,
      icon_url: "https://cdn-icons-png.flaticon.com/512/2830/2830305.png", // Box icon
    },
    timestamp: new Date().toISOString(),
  };

  return {
    content: `<@${config.mentionUserId}> 🔔 **Tracking Alert:** Update for **${repoName}**`,
    embeds: [embed],
    components: components,
  };
};

// --- 4. Main Handler ---

export async function POST(req: NextRequest) {
  const event = req.headers.get("x-github-event");

  // Allow both deployment_status and logic that handles check_run if passed
  if (event !== "deployment_status") {
    return NextResponse.json(
      {
        status: "ignored",
        reason: "Event type mismatch",
        details: { expected: "deployment_status", received: event },
      },
      { status: 200 }
    );
  }

  const payload = await req.json();

  if (!payload.deployment_status || !payload.deployment) {
    return NextResponse.json(
      {
        status: "error",
        reason: "Invalid payload",
        details: "Missing deployment or deployment_status object",
      },
      { status: 400 }
    );
  }

  try {
    const repoFullName = payload.repository.full_name;

    // Config Resolution
    const config = REPO_DIRECTORY[repoFullName] || REPO_DIRECTORY["default"];
    const webhookUrl = process.env[config.webhookEnv];

    if (!webhookUrl) {
      return NextResponse.json(
        {
          status: "error",
          reason: "Configuration Error",
          details: `Webhook URL not found for env: ${config.webhookEnv}`,
        },
        { status: 500 }
      );
    }

    // Build Payload
    const discordPayload = buildTrackingPayload(repoFullName, config, payload);

    // Send
    const response = await axios.post(webhookUrl, discordPayload, {
      headers: { "Content-Type": "application/json" },
    });

    return NextResponse.json({
      status: "success",
      message: "Tracking update sent to Discord",
      details: {
        repo: repoFullName,
        env: payload.deployment.environment,
        state: payload.deployment_status.state,
        discord_status: response.status,
      },
    });
  } catch (err: any) {
    console.error("Deployment Webhook Error:", err);
    return NextResponse.json(
      {
        status: "error",
        reason: "Internal Server Error",
        details: {
          message: err.message,
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}
