import { NextRequest, NextResponse } from "next/server";
import axios from "axios"
import { discordIdUser } from "@/helpers/api/discord-id-user";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const event = req.headers.get("x-github-event");
  let mentionUser = "";
  let releaseServer = "";

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
    const pusher = payload.pusher.name;
    const commits = payload.commits || [];

    const commitMessages = commits
      .map((commit: any, index: number) => {
        return `${index + 1}.- ${commit.message} (by ${
          commit.author?.name || "unknown"
        })`;
      })
      .join("\n");

    let discordWebhook = "";

    if (repoName === "Jabjai-Corporation/sb-web-system") {
      mentionUser = discordIdUser.TeamSupport;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_SYSTEM_SERVER || "";
    } else if (repoName === "Jabjai-Corporation/sb-web-mark_activity") {
      mentionUser = discordIdUser.TeamSupport;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_MARKACTIVITY_SERVER || "";
    } else if (repoName === "Jabjai-Corporation/sb-web-academic") {
      mentionUser = discordIdUser.TeamSupport;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_ACADEMIC_SERVER || "";
    } else if (repoName === "Jabjai-Corporation/sb-web-accounting-system") {
      mentionUser = discordIdUser.TeamSupport;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_ACCOUNTING_SERVER || "";
    } else if (repoName === "Jabjai-Corporation/sb-api-mobile") {
      mentionUser = discordIdUser.TeamSupport;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_SBAPI_SERVER || "";
    } else {
      discordWebhook = "";
    }

    switch (branch) {
      case "release/development":
        releaseServer = "Development Server (เซิฟเดฟ)";
        break;
      case "release/beta":
        releaseServer = "Beta Server (เซิฟเบต้า)";
        break;
      case "release/production":
        releaseServer = "Production Server (เซิฟโปรดักชั่น)";
        break;
      default:
        releaseServer = "Unknown Server";
        break;
    }

    if (!discordWebhook || !discordWebhook.startsWith("http")) {
      return NextResponse.json({
        message: "Invalid Discord webhook URL",
        status: 500,
      });
    }

    const discordPayload = {
      content: `${mentionUser} ระบบได้รับการอัปเดตแล้ว 🎉`,
      embeds: [
        {
          title: `📦 Release: ${repoName}`,
          description: `อัปเดตบนเซิฟเวอร์ \`${releaseServer}\``,
          color: 0x2ecc71,
          fields: [
            {
              name: "📌 สิ่งที่อัพเดท",
              value:
                commits.length > 0
                  ? commitMessages
                  : "_ไม่มี commit message ที่สามารถแสดงได้_",
            },
          ],
          footer: {
            text: `โดย ${pusher}`,
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
