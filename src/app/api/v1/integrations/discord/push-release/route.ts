import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { discordIdUser } from "@/helpers/api/discord-id-user";

// --- 1. Configuration & Types ---

type RepoConfig = {
  name: string;
  mentionRole: string;
  webhookEnvKey: string;
};

// Centralized Configuration
const REPO_MAP: Record<string, RepoConfig> = {
  "Jabjai-Corporation/sb-web-system": {
    name: "School Bright System",
    mentionRole: discordIdUser.TeamSupport,
    webhookEnvKey: "NEXT_PUBLIC_WEBHOOK_DISCORD_SYSTEM_SERVER",
  },
  "Jabjai-Corporation/sb-web-mark_activity": {
    name: "Mark Activity Module",
    mentionRole: discordIdUser.TeamSupport,
    webhookEnvKey: "NEXT_PUBLIC_WEBHOOK_DISCORD_MARKACTIVITY_SERVER",
  },
  "Jabjai-Corporation/sb-web-academic": {
    name: "Academic Module",
    mentionRole: discordIdUser.TeamSupport,
    webhookEnvKey: "NEXT_PUBLIC_WEBHOOK_DISCORD_ACADEMIC_SERVER",
  },
  "Jabjai-Corporation/sb-web-accounting-system": {
    name: "Accounting System",
    mentionRole: discordIdUser.TeamSupport,
    webhookEnvKey: "NEXT_PUBLIC_WEBHOOK_DISCORD_ACCOUNTING_SERVER",
  },
  "Jabjai-Corporation/sb-api-mobile": {
    name: "School Bright API Mobile",
    mentionRole: discordIdUser.TeamSupport,
    webhookEnvKey: "NEXT_PUBLIC_WEBHOOK_DISCORD_SBAPI_SERVER",
  },
  "Jabjai-Corporation/sb-web-canteen": {
    name: "Canteen Shop",
    mentionRole: discordIdUser.TeamSupport,
    webhookEnvKey: "NEXT_PUBLIC_WEBHOOK_DISCORD_CANTEEN_SERVER",
  },
};

type EnvStyle = {
  label: string;
  color: number;
  emoji: string;
  description: string;
};

// --- 2. Helper Functions ---

const getEnvironmentStyle = (branch: string): EnvStyle => {
  if (branch === "release/production") {
    return {
      label: "Production Server",
      color: 0x2ecc71, // Green
      emoji: "🚀",
      description: "Live version available to all users.",
    };
  } else if (branch === "release/beta") {
    return {
      label: "Beta Server",
      color: 0xf39c12, // Orange
      emoji: "🧪",
      description: "Pre-release version for QA/UAT.",
    };
  } else if (branch === "release/development") {
    return {
      label: "Development Server",
      color: 0x3498db, // Blue
      emoji: "🛠️",
      description: "Latest changes for internal testing.",
    };
  }
  return {
    label: "Unknown Environment",
    color: 0x95a5a6, // Grey
    emoji: "📦",
    description: "Unknown deployment target.",
  };
};

const formatCommitMessages = (commits: any[]): string => {
  if (!commits || commits.length === 0) return "_No commit details provided._";
  const maxCommits = 8;
  const list = commits.slice(0, maxCommits).map((c) => {
    const message = c.message.split("\n")[0];
    const author = c.author?.name || "Unknown";
    return `> • [\`${c.id.substring(0, 7)}\`](${
      c.url
    }) - ${message} (**${author}**)`;
  });
  if (commits.length > maxCommits) {
    list.push(`> ...and ${commits.length - maxCommits} more commits.`);
  }
  return list.join("\n");
};

const getFileStats = (commits: any[]) => {
  let added = 0,
    modified = 0,
    removed = 0;
  commits.forEach((c) => {
    added += c.added?.length || 0;
    modified += c.modified?.length || 0;
    removed += c.removed?.length || 0;
  });
  return `📝 Files: \`+${added}\` \`~${modified}\` \`-${removed}\``;
};

// --- 3. Main Handler with Debugging Logic ---

export async function POST(req: NextRequest) {
  // 1. Event Validation
  const event = req.headers.get("x-github-event");
  if (event !== "push") {
    return NextResponse.json(
      {
        status: "ignored",
        reason: "Invalid Event Type",
        debug: { received: event, expected: "push" },
      },
      { status: 200 }
    ); // 200 to stop GitHub retries
  }

  let payload;
  try {
    payload = await req.json();
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        reason: "Invalid JSON Payload",
        debug: { error: String(error) },
      },
      { status: 400 }
    );
  }

  const repoFullName = payload.repository?.full_name;
  const ref = payload.ref || "";
  const branchName = ref.replace("refs/heads/", "");

  // 2. Branch Validation
  if (!ref.startsWith("refs/heads/release/")) {
    return NextResponse.json(
      {
        status: "ignored",
        reason: "Branch Filtering",
        debug: {
          ref: ref,
          message:
            "Only branches starting with 'refs/heads/release/' are processed.",
        },
      },
      { status: 200 }
    );
  }

  // 3. Configuration Validation
  const repoConfig = REPO_MAP[repoFullName];
  if (!repoConfig) {
    return NextResponse.json(
      {
        status: "error", // Use error status to alert the dev that config is missing
        reason: "Repository Not Configured",
        debug: {
          receivedRepo: repoFullName,
          availableRepos: Object.keys(REPO_MAP),
          action: "Add this repo to REPO_MAP in the code.",
        },
      },
      { status: 404 }
    );
  }

  // 4. Environment Variable Validation
  const webhookUrl = process.env[repoConfig.webhookEnvKey];
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return NextResponse.json(
      {
        status: "error",
        reason: "Missing or Invalid Discord Webhook URL",
        debug: {
          envKey: repoConfig.webhookEnvKey,
          envValue: webhookUrl ? "Invalid Format" : "Missing/Undefined",
          repo: repoFullName,
        },
      },
      { status: 500 }
    );
  }

  try {
    // 5. Payload Construction
    const envStyle = getEnvironmentStyle(branchName);
    const commits = payload.commits || [];
    const pusherName = payload.pusher?.name || "Unknown";
    const compareUrl = payload.compare;
    const commitLog = formatCommitMessages(commits);
    const fileStats = getFileStats(commits);

    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: "📄 View Changelog (Diff)",
            url: compareUrl,
            emoji: { name: "📜" },
          },
          {
            type: 2,
            style: 5,
            label: "📂 Open Repository",
            url: payload.repository.html_url,
            emoji: { name: "🔗" },
          },
        ],
      },
    ];

    const embed = {
      title: `${envStyle.emoji} Deployed: ${repoConfig.name}`,
      description: `**Target:** \`${envStyle.label}\`\n${envStyle.description}\n\n${fileStats}`,
      url: compareUrl,
      color: envStyle.color,
      thumbnail: {
        url:
          payload.repository.owner?.avatar_url ||
          "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
      },
      fields: [
        { name: "📋 Change Log", value: commitLog, inline: false },
        { name: "🌿 Branch", value: `\`${branchName}\``, inline: true },
        { name: "👮 By", value: `**${pusherName}**`, inline: true },
        {
          name: "⏱️ Time",
          value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
          inline: true,
        },
      ],
      footer: {
        text: "School Bright • Release Management System",
        icon_url: "https://schoolbright.co/assets/img/logo-sb.png",
      },
      timestamp: new Date().toISOString(),
    };

    const discordPayload = {
      content: `${repoConfig.mentionRole} 📢 **New Update Available!**`,
      embeds: [embed],
      components: components,
    };

    // 6. External Request execution
    const response = await axios.post(webhookUrl, discordPayload, {
      headers: { "Content-Type": "application/json" },
    });

    // Success Response with Debug Info
    return NextResponse.json(
      {
        status: "success",
        message: "Notification sent to Discord",
        debug: {
          repo: repoFullName,
          branch: branchName,
          envKey: repoConfig.webhookEnvKey,
          discordStatus: response.status,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Webhook Execution Error:", err);

    // Detailed Error Response
    return NextResponse.json(
      {
        status: "error",
        reason: "Internal Server Error during execution",
        debug: {
          message: err.message,
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
          responseFromDiscord: err.response?.data || "No response data",
        },
      },
      { status: 500 }
    );
  }
}
