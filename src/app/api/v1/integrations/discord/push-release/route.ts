import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const event = req.headers.get("x-github-event");
  let mentionUser = "";

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
    const discordIdUser = {
      Light: "<@1343873740055777353>",
      Joe: "<@692371893826879568>",
      TeamSupport: "<@&1344169581345902704>",
    };
    if (!payload.ref?.startsWith("refs/heads/release/")) {
      return NextResponse.json({
        message: "Not a release branch",
        status: 200,
      });
    }
    const pusher = payload.pusher.name;
    const compareUrl =
      typeof payload.compare === "string" && payload.compare.startsWith("http")
        ? payload.compare
        : undefined;
    const commits = payload.commits || [];

    const commitMessages = commits
      .map((commit: any, index: number) => {
        return `> \u2022 [${commit.id.substring(0, 7)}](${commit.url}) - ${
          commit.message
        } (by ${commit.author?.name || "unknown"})`;
      })
      .join("\n");

    let discordWebhook = "";

    if (repoName === "Jabjai-Corporation/sb-web-system") {
      mentionUser = discordIdUser.TeamSupport;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_SYSTEM_SERVER || "";
    } else if (repoName === "Jabjai-Corporation/sb-web-mark_activity") {
      mentionUser = discordIdUser.Light;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_MARKACTIVITY_SERVER || "";
    } else if (repoName === "Jabjai-Corporation/sb-web-system") {
      mentionUser = discordIdUser.Joe;
      discordWebhook =
        process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER || "";
    } else {
      discordWebhook = "";
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
          description: `อัปเดตบนเซิฟเวอร์ \`${branch}\`${
            compareUrl ? ` ([ดู diff](${compareUrl}))` : ""
          }`,
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
