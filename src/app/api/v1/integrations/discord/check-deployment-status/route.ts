import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const event = req.headers.get("x-github-event");

  // ถ้าไม่มี deployment_status หรือ deployment ใน payload ให้หยุด
  if (!payload.deployment_status || !payload.deployment) {
    return NextResponse.json({
      message: "Missing deployment_status or deployment in payload",
      status: 400,
    });
  }

  try {
    const repoName = payload.repository.full_name;
    const environment = payload.deployment?.environment || "unknown";
    const state = payload.deployment_status?.state || "unknown";
    const creator = payload.deployment?.creator?.login || "unknown";
    const targetUrl = payload.deployment_status?.target_url || null;

    const colorMap: Record<string, number> = {
      success: 0x2ecc71,
      failure: 0xe74c3c,
      in_progress: 0xf1c40f,
      queued: 0x3498db,
    };

    const color = colorMap[state] || 0x95a5a6;

    // Discord user IDs for mentions
    const discordIdUser = {
      Light: "<@692371893826879568>",
      Joe: "<@252888614214893579>",
      Krishnan: "<@1143863276698042428>",
      Tuk: "<@1207973995297404978>",
    };

    let mentionUser = "<@692371893826879568>"; // default
    let discordWebhook =
      process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER;

    if (
      repoName === "Jabjai-Corporation/robodocs-api-main" ||
      repoName === "Jabjai-Corporation/robodocs-web-main"
    ) {
      mentionUser = discordIdUser.Light;
      discordWebhook = process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_ROBODOCS_SERVER;
    } else if (repoName === "Jabjai-Corporation/sb-web-mark_activity") {
      mentionUser = discordIdUser.Light;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_MARKACTIVITY_SERVER;
    } else if (repoName === "Jabjai-Corporation/sb-web-system") {
      mentionUser = discordIdUser.Joe;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER;
    } else if (repoName === "Jabjai-Corporation/sb-web-academic") {
      mentionUser = discordIdUser.Krishnan;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER || "";
    } else if (repoName === "Jabjai-Corporation/sb-web-accounting-system") {
      mentionUser = discordIdUser.Tuk;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_ACCOUNTING_SERVER || "";
    } else if (repoName === "Jabjai-Corporation/sb-api-mobile") {
      mentionUser = discordIdUser.Joe;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER || "";
    } else {
      mentionUser = "<@692371893826879568>";
      discordWebhook = "";
    }

    if (!discordWebhook || !discordWebhook.startsWith("http")) {
      return NextResponse.json({
        message: "Invalid Discord webhook URL",
        status: 500,
      });
    }

    // --- เพิ่มการอ่านข้อมูล check_run จาก payload และแสดงสถานะจริง ---
    const statusEmojiMap: Record<string, string> = {
      success: "✅",
      failure: "❌",
      in_progress: "🟡",
      queued: "🕒",
      neutral: "⚪️",
      cancelled: "🚫",
      timed_out: "⏰",
      action_required: "⚠️",
      unknown: "❓",
    };

    // อ่านข้อมูล job จาก check_run (ถ้ามี)
    const jobName = payload.check_run?.name || "ไม่ทราบชื่อ Job";
    const jobStatus = payload.check_run?.status || "unknown";
    const jobConclusion = payload.check_run?.conclusion;

    const statusIcon = jobConclusion
      ? statusEmojiMap[jobConclusion] || "ℹ️"
      : statusEmojiMap[jobStatus] || "⏳";

    const statusText = `${statusIcon} \`${(jobConclusion || jobStatus).toUpperCase()}\``;

    const discordPayload = {
      content: `📡 **[Deployment Status]** มีอัปเดตสถานะใหม่จากระบบ Deploy`,
      embeds: [
        {
          title: `📦 ${repoName} (${environment})`,
          ...(targetUrl ? { url: targetUrl } : {}),
          color,
          fields: [
            {
              name: "🟡 Status",
              value: statusText,
              inline: true,
            },
            {
              name: "🔨 Job Name",
              value: jobName,
              inline: true,
            },
            {
              name: "👤 Deployer",
              value: creator,
              inline: true,
            },
          ],
          footer: {
            text: "GitHub Actions - Deployment",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await axios.post(discordWebhook, discordPayload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Discord response:", response.data);

    return NextResponse.json({
      message: "Deployment status sent to Discord",
      status: response.status,
    });
  } catch (err: any) {
    return NextResponse.json({
      message: err.message || "Internal Server Error",
      status: err.response?.status || 500,
    });
  }
}
