import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { discordIdUser } from "@/helpers/api/discord-id-user";

type RepoConfig = {
  mention: string;
  webhookEnv: keyof NodeJS.ProcessEnv;
};

const DEFAULT_MENTION = "<@692371893826879568>";
const DEFAULT_WEBHOOK_ENV = "NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER";

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

const buildCurlCommand = (
  webhook: string,
  title: string,
  url: string,
  author: string
) => {
  const curlHeader = `--header 'Content-Type: application/json'`;
  const curlData = `--data '{
    "content": "📣 **เปิด Pull Request ใหม่!**\\n📝 **${title}**\\n🔗 ${url}\\n👤 โดย: ${author}\\n\\n📌 กรุณาตรวจสอบและ Review ทันที 👀"
  }'`;

  return `curl --location ${curlHeader} '${webhook}' ${curlData}`;
};

const buildDiscordPayload = (
  mention: string,
  pr: any,
  repoName: string,
  fromBranch: string,
  toBranch: string
) => ({
  content: `${mention} 📣 **มี Pull Request ใหม่เข้ามาแล้ว! (New Pull Request Incoming!)**`,
  embeds: [
    {
      title: `#${pr.number} ${pr.title}`,
      url: pr.html_url,
      color: 0x00ccff,
      fields: [
        { name: "🧑‍💻 ผู้เปิด (Author)", value: pr.user.login, inline: true },
        {
          name: "📁 Repository (ที่เก็บโค้ด)",
          value: `\`${repoName}\``,
          inline: true,
        },
        {
          name: "🌿 จากสาขา (From Branch) → ไปยัง (To Branch)",
          value: `\`${fromBranch}\` → \`${toBranch}\``,
          inline: false,
        },
      ],
      footer: {
        text: "ระบบแจ้งเตือน GitHub PR • SchoolBright (GitHub PR Notifier • SchoolBright)",
      },
      timestamp: new Date().toISOString(),
    },
  ],
});

function resolveRepoConfig(repoName: string): RepoConfig {
  return (
    REPOSITORY_CONFIG[repoName] ?? {
      mention: DEFAULT_MENTION,
      webhookEnv: DEFAULT_WEBHOOK_ENV,
    }
  );
}

export async function POST(req: NextRequest) {
  const event = req.headers.get("x-github-event");

  if (event !== "pull_request") {
    return NextResponse.json({
      message: "Not a pull_request event",
      status: 200,
    });
  }

  const payload = await req.json();

  try {
    const pr = payload?.pull_request;
    if (!pr) {
      return NextResponse.json({
        message: "Invalid payload: missing pull_request",
        status: 400,
      });
    }

    const repoName: string | undefined = payload?.repository?.full_name;
    if (!repoName) {
      return NextResponse.json({
        message: "Invalid payload: missing repository",
        status: 400,
      });
    }

    const { mention, webhookEnv } = resolveRepoConfig(repoName);
    const webhookUrl = process.env[webhookEnv];

    if (!webhookUrl) {
      return NextResponse.json({
        message: `Webhook not configured for repository: ${repoName}`,
        status: 500,
      });
    }

    const fromBranch = pr.head?.ref ?? "unknown";
    const toBranch = pr.base?.ref ?? "unknown";

    const discordPayload = buildDiscordPayload(
      mention,
      pr,
      repoName,
      fromBranch,
      toBranch
    );

    const response = await axios.post(webhookUrl, discordPayload, {
      headers: { "Content-Type": "application/json" },
    });

    return NextResponse.json({
      message: "Notification sent to Discord",
      status: response.status,
      curl: buildCurlCommand(webhookUrl, pr.title, pr.html_url, pr.user.login),
    });
  } catch (err: any) {
    return NextResponse.json({
      message: err.message || "Internal Server Error",
      status: err.response?.status || 500,
    });
  }
}
