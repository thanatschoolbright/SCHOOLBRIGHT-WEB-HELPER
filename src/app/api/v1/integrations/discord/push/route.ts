import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const RepoConfig: Record<
  string,
  {
    name: string;
    description: string;
    icon_url: string;
    color: number;
    webhooks: Record<string, string>;
  }
> = {
  "my-org/my-repo": {
    name: "My Repo",
    description: "Repository for My Project",
    icon_url:
      "https://raw.githubusercontent.com/my-org/my-repo/main/assets/icon.png",
    color: 0x7289da,
    webhooks: {
      "release/development":
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_RELEASE_DEVELOPMENT_SERVER ||
        "",
      "release/beta":
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_RELEASE_BETA_SERVER || "",
      "release/production":
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_RELEASE_PRODUCTION_SERVER || "",
      default:
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER || "",
    },
  },
  // Add more repos as needed
};

function summarizeCommit(commit: any): string {
  const shortId = commit.id.substring(0, 7);
  const message = commit.message.split("\n")[0];
  const author = commit.author?.name || "unknown";
  return `> • [${shortId}](${commit.url}) - ${message} (by ${author})`;
}

function buildCommitTimeline(commits: any[]): string {
  return commits
    .map((commit) => {
      const date = new Date(commit.timestamp).toLocaleString();
      return `> • ${commit.message.split("\n")[0]} (${date})`;
    })
    .join("\n");
}

function buildDiscordPayload(
  repoName: string,
  branch: string,
  payload: any,
  repoConfig: (typeof RepoConfig)[string],
  compareUrl?: string
) {
  const pusher = payload.pusher.name;
  const commits = payload.commits || [];
  const before = payload.before?.substring(0, 7) || "-";
  const after = payload.after?.substring(0, 7) || "-";

  const commitMessages = commits.length
    ? commits.map(summarizeCommit).join("\n")
    : "ไม่มี commit message ที่สามารถแสดงได้";

  const timeline = commits.length ? buildCommitTimeline(commits) : "";

  return {
    content: `🚀 **[Push Event]** ระบบได้รับการอัปเดตใหม่แล้ว!`,
    embeds: [
      {
        title: `${repoConfig.name} (${branch})`,
        url: compareUrl,
        description: repoConfig.description,
        color: repoConfig.color,
        thumbnail: {
          url: repoConfig.icon_url,
        },
        image: {
          url: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
        },
        fields: [
          {
            name: "📌 Branch",
            value: `\`${branch}\`: \`${before}\` → \`${after}\``,
            inline: true,
          },
          {
            name: "📝 Commits",
            value: commitMessages,
            inline: false,
          },
          ...(timeline
            ? [
                {
                  name: "⏰ Timeline",
                  value: timeline,
                  inline: false,
                },
              ]
            : []),
        ],
        footer: {
          text: `Pushed by ${pusher}`,
          icon_url: "https://cdn-icons-png.flaticon.com/512/25/25231.png",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const event = req.headers.get("x-github-event");

  if (event !== "push") {
    return NextResponse.json({
      message: "Not a push event",
      status: 200,
    });
  }

  console.log("Received push event:", payload);

  try {
    const repoName = payload.repository.full_name;
    const branch = payload.ref.replace("refs/heads/", "");
    if (!payload.ref?.startsWith("refs/heads/release/")) {
      return NextResponse.json({
        message: "Not a release branch",
        status: 200,
      });
    }

    const repoConfig = RepoConfig[repoName];
    if (!repoConfig) {
      return NextResponse.json({
        message: `No configuration found for repo: ${repoName}`,
        status: 500,
      });
    }

    const discordWebhook =
      repoConfig.webhooks[branch] || repoConfig.webhooks["default"];

    if (!discordWebhook || !discordWebhook.startsWith("http")) {
      return NextResponse.json({
        message: "Invalid Discord webhook URL",
        status: 500,
      });
    }

    const compareUrl =
      typeof payload.compare === "string" && payload.compare.startsWith("http")
        ? payload.compare
        : undefined;

    const discordPayload = buildDiscordPayload(
      repoName,
      branch,
      payload,
      repoConfig,
      compareUrl
    );

    const response = await axios.post(discordWebhook, discordPayload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Discord response:", response.data);

    return NextResponse.json({
      message: "Push notification sent to Discord",
      status: response.status,
    });
  } catch (err: any) {
    return NextResponse.json({
      message: err.message || "Internal Server Error",
      status: err.response?.status || 500,
    });
  }
}
