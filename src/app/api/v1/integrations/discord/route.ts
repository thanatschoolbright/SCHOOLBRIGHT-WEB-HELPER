import { discordIdUser } from "@/helpers/api/discord-id-user";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// --- Configuration Types ---
type RepoConfig = {
  mention: string;
  webhookEnv: keyof NodeJS.ProcessEnv;
};

type ActionStyle = {
  emoji: string;
  title: string;
  description: string;
  color: number;
};

// --- Constants & Config ---
const DEFAULT_MENTION = "<@692371893826879568>"; // Default fallback user
const DEFAULT_WEBHOOK_ENV = "NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER";

// Map repositories to specific Discord users and Webhook URLs
const REPOSITORY_CONFIG: Record<string, RepoConfig> = {
  "Jabjai-Corporation/robodocs-api-main": {
    mention: discordIdUser.Light,
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_ROBODOCS_SERVER",
  },
  "Jabjai-Corporation/robodocs-web-main": {
    mention: discordIdUser.Light,
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_ROBODOCS_SERVER",
  },
  "Jabjai-Corporation/sb-web-mark_activity": {
    mention: discordIdUser.Light,
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_MARKACTIVITY_SERVER",
  },
  "Jabjai-Corporation/sb-web-system": {
    mention: discordIdUser.Joe,
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER",
  },
  "Jabjai-Corporation/sb-web-academic": {
    mention: discordIdUser.Krishnan,
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER",
  },
  "Jabjai-Corporation/sb-web-accounting-system": {
    mention: discordIdUser.Tuk,
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_ACCOUNTING_SERVER",
  },
  "Jabjai-Corporation/sb-api-mobile": {
    mention: discordIdUser.Joe,
    webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER",
  },
};

// --- Style Definitions ---
const ACTION_STYLES: Record<string, ActionStyle> = {
  opened: {
    emoji: "[OPEN]",
    title: "New Code Incoming!",
    description: "A new Pull Request has been opened. Ready for review.",
    color: 0x2ecc71, // Green
  },
  reopened: {
    emoji: "[REOPEN]",
    title: "PR Reopened",
    description: "This Pull Request has been reactivated.",
    color: 0xe67e22, // Orange
  },
  closed_merged: {
    emoji: "[MERGED]",
    title: "Merged & Deployed",
    description: "Code has been successfully merged into the base branch.",
    color: 0x9b59b6, // Purple
  },
  closed_rejected: {
    emoji: "[CLOSED]",
    title: "PR Closed",
    description: "This Pull Request was closed without merging.",
    color: 0xe74c3c, // Red
  },
  ready_for_review: {
    emoji: "[READY]",
    title: "Ready for Review",
    description: "Draft status removed. Team, please take a look!",
    color: 0x3498db, // Blue
  },
  draft: {
    emoji: "[DRAFT]",
    title: "Work in Progress (Draft)",
    description: "Developer is still working. Do not review yet.",
    color: 0xf1c40f, // Yellow
  },
  default: {
    emoji: "[INFO]",
    title: "Pull Request Update",
    description: "There is new activity on this Pull Request.",
    color: 0x95a5a6, // Grey
  },
};

// --- Helper Functions ---

/**
 * Determines the visual style of the Embed based on PR state and action.
 */
const resolveActionStyle = (
  action: string,
  isDraft: boolean,
  merged: boolean,
): ActionStyle => {
  if (action === "closed") {
    return merged ? ACTION_STYLES.closed_merged : ACTION_STYLES.closed_rejected;
  }
  if (isDraft) return ACTION_STYLES.draft;

  return ACTION_STYLES[action] || ACTION_STYLES.default;
};

/**
 * Formats the body text to prevent Discord overflow.
 */
const formatBodyPreview = (body: string | null): string => {
  if (!body) return "_No description provided._";
  const limit = 300;
  const sanitized = body.replace(/\r\n/g, "\n").trim();
  return sanitized.length > limit
    ? `${sanitized.substring(0, limit)}...\n(Click title to read more)`
    : sanitized;
};

/**
 * Formats the list of requested reviewers.
 */
const formatReviewers = (reviewers: any[]): string => {
  if (!reviewers || reviewers.length === 0) return "None assigned";
  return reviewers.map((r) => `**[${r.login}](${r.html_url})**`).join(", ");
};

/**
 * Formats file statistics (Additions/Deletions).
 */
const formatStats = (
  additions: number,
  deletions: number,
  files: number,
): string => {
  return `\`${files} files\` - \`+${additions}\` (+) / \`-${deletions}\` (-)`;
};

/**
 * Builds the interactive buttons (Link to PR, Diff, Branch).
 */
const buildComponents = (
  repoName: string,
  prUrl: string,
  branchName: string,
) => {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "View Pull Request",
          url: prUrl,
        },
        {
          type: 2,
          style: 5,
          label: "Check Diff",
          url: `${prUrl}/files`,
        },
        {
          type: 2,
          style: 5,
          label: `Branch: ${branchName}`,
          url: `https://github.com/${repoName}/tree/${branchName}`,
        },
      ],
    },
  ];
};

/**
 * Constructs the main Discord JSON payload.
 */
const buildDiscordPayload = (
  repoConfig: RepoConfig,
  repoName: string,
  pr: any,
  action: string,
) => {
  const isDraft = pr.draft;
  const isMerged = pr.merged;
  const style = resolveActionStyle(action, isDraft, isMerged);

  // Clean up Discord mention ID
  const mentionId = repoConfig.mention.match(/<@!?(\d+)>/)?.[1];

  const embed = {
    title: `${style.emoji} #${pr.number}: ${pr.title}`,
    description: `**${style.title}**\n${
      style.description
    }\n\n${formatBodyPreview(pr.body)}`,
    url: pr.html_url,
    color: style.color,
    timestamp: new Date().toISOString(),
    author: {
      name: pr.user.login,
      url: pr.user.html_url,
      icon_url: pr.user.avatar_url,
    },
    thumbnail: {
      url: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
    },
    fields: [
      {
        name: "Repository",
        value: `\`${repoName}\``,
        inline: true,
      },
      {
        name: "Branch Flow",
        value: `\`${pr.head.ref}\` -> \`${pr.base.ref}\``,
        inline: true,
      },
      {
        name: "Statistics",
        value: formatStats(pr.additions, pr.deletions, pr.changed_files),
        inline: false,
      },
      {
        name: "Reviewers",
        value: formatReviewers(pr.requested_reviewers),
        inline: true,
      },
      {
        name: "Updated",
        value: `<t:${Math.floor(Date.now() / 1000)}:R>`, // Discord Relative Time
        inline: true,
      },
    ],
    footer: {
      text: "SchoolBright GitHub Bot - Engineering Team",
    },
  };

  const payload: any = {
    content: `${repoConfig.mention} **${repoName}**: New activity on PR #${pr.number}!`,
    embeds: [embed],
    components: buildComponents(repoName, pr.html_url, pr.head.ref),
  };

  // Only trigger a ping if a specific user ID is found
  if (mentionId) {
    payload.allowed_mentions = { users: [mentionId] };
  }

  return payload;
};

// Debounce cache to prevent double firing (GitHub sometimes sends duplicates)
const processedEvents: Record<number, number> = {};

// --- Main API Handler ---
export async function POST(req: NextRequest) {
  const eventType = req.headers.get("x-github-event");

  // Filter: We only care about Pull Requests
  if (eventType !== "pull_request") {
    return NextResponse.json({
      message: "Ignored: Not a pull_request event",
      status: 200,
    });
  }

  const payload = await req.json();

  try {
    const { action, pull_request: pr, repository } = payload;

    if (!pr || !repository) {
      return NextResponse.json({ message: "Invalid Payload", status: 400 });
    }

    // Debounce: Ignore duplicate events for the same PR within 10 seconds
    const now = Date.now();
    if (
      processedEvents[pr.number] &&
      now - processedEvents[pr.number] < 10000
    ) {
      return NextResponse.json({
        message: "Skipped: Duplicate event",
        status: 200,
      });
    }
    processedEvents[pr.number] = now;

    // Get Configuration
    const repoName = repository.full_name;
    const repoConfig = REPOSITORY_CONFIG[repoName] || {
      mention: DEFAULT_MENTION,
      webhookEnv: DEFAULT_WEBHOOK_ENV,
    };

    const webhookUrl = process.env[repoConfig.webhookEnv as string];

    if (!webhookUrl) {
      console.error(`Webhook URL missing for env: ${repoConfig.webhookEnv}`);
      return NextResponse.json({
        message: "Server Error: Webhook not configured",
        status: 500,
      });
    }

    // Build Discord Message
    const discordPayload = buildDiscordPayload(
      repoConfig,
      repoName,
      pr,
      action,
    );

    // Send to Discord
    const response = await axios.post(webhookUrl, discordPayload, {
      headers: { "Content-Type": "application/json" },
    });

    return NextResponse.json({
      message: "Notification sent to Discord successfully",
      discord_status: response.status,
    });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({
      message: error.message || "Internal Server Error",
      status: 500,
    });
  }
}
