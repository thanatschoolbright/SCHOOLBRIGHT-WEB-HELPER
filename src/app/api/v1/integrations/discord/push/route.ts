import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// --- Configuration: Organization Level ---

type OrgConfig = {
  webhooks: Record<string, string>; // Maps branch names to ENV variable keys
};

// Define configuration by Organization Name
const ORG_CONFIG: Record<string, OrgConfig> = {
  "Jabjai-Corporation": {
    webhooks: {
      "release/development":
        "NEXT_PUBLIC_WEBHOOK_DISCORD_RELEASE_DEVELOPMENT_SERVER",
      "release/beta": "NEXT_PUBLIC_WEBHOOK_DISCORD_RELEASE_BETA_SERVER",
      "release/production":
        "NEXT_PUBLIC_WEBHOOK_DISCORD_RELEASE_PRODUCTION_SERVER",
      default: "NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER",
    },
  },
};

// --- Styles & Helpers ---

type BranchStyle = {
  label: string;
  color: number;
  emoji: string;
  description: string;
};

const getBranchStyle = (branch: string): BranchStyle => {
  if (branch.includes("production")) {
    return {
      label: "Production Environment",
      color: 0x2ecc71, // Green
      emoji: "[PROD]",
      description: "Stable version deployed to live users.",
    };
  } else if (branch.includes("beta")) {
    return {
      label: "Beta Environment",
      color: 0xf39c12, // Orange
      emoji: "[BETA]",
      description: "New features deployed for UAT/Testing.",
    };
  } else if (branch.includes("development")) {
    return {
      label: "Development",
      color: 0x3498db, // Blue
      emoji: "[DEV]",
      description: "Daily build / Work in progress.",
    };
  }
  return {
    label: branch,
    color: 0x95a5a6, // Grey
    emoji: "[PKG]",
    description: "Repository update.",
  };
};

const getFileSummary = (commits: any[]) => {
  const allModified = new Set<string>();

  commits.forEach((c) => {
    c.modified?.forEach((f: string) => allModified.add(f));
    c.added?.forEach((f: string) => allModified.add(f));
    c.removed?.forEach((f: string) => allModified.add(f));
  });

  const files = Array.from(allModified);
  if (files.length === 0) return "No specific files listed.";

  const topFiles = files
    .slice(0, 5)
    .map((f) => `- \`${f}\``)
    .join("\n");
  const remaining = files.length - 5;

  return remaining > 0
    ? `${topFiles}\n...and ${remaining} more files.`
    : topFiles;
};

const formatCommitList = (commits: any[]) => {
  if (!commits || commits.length === 0) return "_No commit details._";

  return commits
    .map((c) => {
      const msg = c.message.split("\n")[0];
      return `> [\`${c.id.substring(0, 7)}\`](${c.url}) ${msg} - **${
        c.author.name
      }**`;
    })
    .join("\n");
};

// --- Main Builder Function ---

const buildDiscordPayload = (
  repoData: any,
  branch: string,
  payload: any,
  webhookUrl: string,
) => {
  const pusher = payload.pusher.name;
  const commits = payload.commits || [];
  const compareUrl = payload.compare;

  const style = getBranchStyle(branch);
  const fileSummary = getFileSummary(commits);
  const commitLog = formatCommitList(commits);

  const iconUrl =
    repoData.owner?.avatar_url ||
    "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
  const repoDescription = repoData.description || "No description provided.";

  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "View Changes (Diff)",
          url: compareUrl,
        },
        {
          type: 2,
          style: 5,
          label: "Open Repository",
          url: repoData.html_url,
        },
      ],
    },
  ];

  const embed = {
    title: `${style.emoji} Deployed: ${repoData.name}`,
    description: `**${style.description}**\n${repoDescription}`,
    url: compareUrl,
    color: style.color,
    author: {
      name: `${pusher} deployed updates`,
      icon_url: payload.sender?.avatar_url,
      url: payload.sender?.html_url,
    },
    thumbnail: {
      url: iconUrl,
    },
    fields: [
      {
        name: "Environment / Branch",
        value: `\`${style.label}\` (\`${branch}\`)`,
        inline: false,
      },
      {
        name: "What's New? (Changelog)",
        value: commitLog,
        inline: false,
      },
      {
        name: "Impacted Files",
        value: fileSummary,
        inline: false,
      },
      {
        name: "Deployed At",
        value: `<t:${Math.floor(Date.now() / 1000)}:f> (<t:${Math.floor(
          Date.now() / 1000,
        )}:R>)`,
        inline: false,
      },
    ],
    footer: {
      text: `${repoData.full_name} - Auto-Deployment System`,
      icon_url:
        "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
    },
    timestamp: new Date().toISOString(),
  };

  return {
    content: `[INFO] Update Alert: New code arrived in **${repoData.name}** (${style.label})!`,
    embeds: [embed],
    components: components,
  };
};

// --- API Handler (Enhanced Debugging) ---

export async function POST(req: NextRequest) {
  const event = req.headers.get("x-github-event");

  // 1. Validate Event Type
  if (event !== "push") {
    return NextResponse.json(
      {
        status: "ignored",
        reason: "Event type mismatch",
        details: {
          received_event: event,
          expected_event: "push",
        },
      },
      { status: 200 },
    );
  }

  const payload = await req.json();

  try {
    const repository = payload.repository;
    if (!repository) {
      return NextResponse.json(
        {
          status: "error",
          reason: "Invalid payload structure",
          details: "Missing 'repository' object in JSON payload",
        },
        { status: 400 },
      );
    }

    const [orgName, repoName] = repository.full_name.split("/");
    const ref = payload.ref || "";
    const branchName = ref.replace("refs/heads/", "");

    // 2. Validate Organization Configuration
    const orgConfig = ORG_CONFIG[orgName];
    if (!orgConfig) {
      return NextResponse.json(
        {
          status: "ignored",
          reason: "Organization not configured",
          details: {
            received_org: orgName,
            known_orgs: Object.keys(ORG_CONFIG),
          },
        },
        { status: 200 },
      );
    }

    // 3. Validate Branch (Must start with release/)
    if (!ref.startsWith("refs/heads/release/")) {
      return NextResponse.json(
        {
          status: "ignored",
          reason: "Branch filter mismatch",
          details: {
            received_ref: ref,
            branch_name: branchName,
            requirement: "Ref must start with 'refs/heads/release/'",
          },
        },
        { status: 200 },
      );
    }

    // 4. Resolve Webhook URL
    const envKey =
      orgConfig.webhooks[branchName] || orgConfig.webhooks["default"];
    const webhookUrl = process.env[envKey];

    if (!webhookUrl) {
      console.error(
        `[Webhook Error] URL missing for EnvKey: ${envKey} | Org: ${orgName}`,
      );
      return NextResponse.json(
        {
          status: "error",
          reason: "Server configuration error",
          details: {
            env_variable_key: envKey,
            message:
              "The environment variable for this webhook is missing or empty.",
          },
        },
        { status: 500 },
      );
    }

    // 5. Send Notification
    const discordPayload = buildDiscordPayload(
      repository,
      branchName,
      payload,
      webhookUrl,
    );

    const response = await axios.post(webhookUrl, discordPayload, {
      headers: { "Content-Type": "application/json" },
    });

    // 6. Success Response
    return NextResponse.json(
      {
        status: "success",
        message: "Notification sent to Discord",
        details: {
          repository: repository.full_name,
          branch: branchName,
          target_env: envKey,
          discord_response_status: response.status,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      {
        status: "error",
        reason: "Internal Server Error",
        details: {
          error_message: err.message || "Unknown error",
          // Only show stack trace in development if needed
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        },
      },
      { status: 500 },
    );
  }
}
