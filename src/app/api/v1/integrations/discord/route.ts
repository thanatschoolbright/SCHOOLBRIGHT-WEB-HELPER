import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const event = req.headers.get("x-github-event");

  if (event !== "pull_request" || payload.action !== "opened") {
    return NextResponse.json({
      message: "Not a pull_request opened event",
      status: 200,
    });
  }

  console.log("Received pull_request opened event:", payload);

  try {
    const pr = payload.pull_request;
    const title = pr.title;
    const url = pr.html_url;
    const author = pr.user.login;

    const repoName = payload.repository.full_name;
    const fromBranch = pr.head.ref;
    const toBranch = pr.base.ref;

    const discordWebhook =
      process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER;
    const curlHeader = `--header 'Content-Type: application/json'`;
    const curlData = `--data '{
      "content": "📣 **เปิด Pull Request ใหม่!**\\n📝 **${title}**\\n🔗 ${url}\\n👤 โดย: ${author}\\n\\n📌 กรุณาตรวจสอบและ Review ทันที 👀"
    }'`;
    const curlCommand = `curl --location ${curlHeader} '${discordWebhook}' ${curlData}`;

    const discordPayload = {
      content: `<@692371893826879568> 📣 **มี Pull Request ใหม่เข้ามาแล้ว!**`,
      embeds: [
        {
          title: `#${pr.number} ${title}`,
          url: url,
          color: 0x00ccff,
          fields: [
            { name: "🧑‍💻 ผู้เปิด", value: author, inline: true },
            { name: "📁 Repository", value: `\`${repoName}\``, inline: true },
            {
              name: "🌿 จาก → ไป",
              value: `\`${fromBranch}\` → \`${toBranch}\``,
              inline: false,
            },
          ],
          footer: {
            text: "ระบบแจ้งเตือน GitHub PR • SchoolBright",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await axios.post(discordWebhook!, discordPayload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Discord response:", response.data);

    return NextResponse.json({
      message: "Notification sent to Discord",
      status: response.status,
      curl: curlCommand,
    });
  } catch (err: any) {
    return NextResponse.json({
      message: err.message || "Internal Server Error",
      status: err.response?.status || 500,
    });
  }
}
