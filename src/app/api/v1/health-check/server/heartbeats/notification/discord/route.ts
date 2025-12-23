import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dayjs from "dayjs";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { API_URL } from "@services/api-url";
import { HeartbeatResponse } from "@api/v1/health-check/server/heartbeats/route";
import { logger } from "@/helpers/logger";

const WEBHOOK_DISCORD =
  process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_HEARTBEAT_BOT ?? "";
const DISCORD_ALERT_USER = "<@692372441699319900>";

// --- Configuration & Assets ---

const STATUS_THEMES = {
  HEALTHY: {
    color: 0x2ecc71, // Emerald Green
    title: "All Systems Operational",
    icon: "✅",
    // รูปหุ่นยนต์ทำงานปกติ หรือ Server สีเขียว
    image:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56L2dpZg/3o7abKhOpu0NwenH3O/giphy.gif",
  },
  DEGRADED: {
    color: 0xf1c40f, // Sunflower Yellow
    title: "System Degraded",
    icon: "⚠️",
    // รูปหุ่นยนต์กำลังซ่อมแซม หรือกราฟสีเหลือง
    image:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56L2dpZg/l0HlHFRbmaZtBRhXG/giphy.gif",
  },
  CRITICAL: {
    color: 0xe74c3c, // Alizarin Red
    title: "Critical System Failure",
    icon: "🚨",
    // รูปไฟไหม้ หรือ Error ตัวใหญ่
    image:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56L2dpZg/13d2jHlSlFQyo0/giphy.gif",
  },
};

// --- Utility Functions ---

const formatDate = (raw?: string) => {
  if (!raw) return "-";
  try {
    // Format: 23 Dec 2025 | 14:30
    return dayjs(raw.replace(/\.(\d{3})\d+/, ".$1")).format(
      "DD MMM YYYY | HH:mm"
    );
  } catch {
    return raw;
  }
};

const calculateHealth = (online: number, total: number) => {
  return total === 0 ? 100 : Math.round((online / total) * 100);
};

const getProgressBar = (percentage: number) => {
  const blocks = 10;
  const filled = Math.round((percentage / 100) * blocks);
  // ใช้ Character ที่ดูเรียบเนียนขึ้น
  return `[${"▓".repeat(filled)}${"░".repeat(blocks - filled)}] ${percentage}%`;
};

// --- Core Logic ---

const analyzeHeartbeats = (items: HeartbeatResponse[]) => {
  const total = items.length;
  const onlineItems = items.filter(
    (i) => String(i.Status).toLowerCase() === "online"
  );
  const offlineItems = items.filter(
    (i) => String(i.Status).toLowerCase() !== "online"
  );

  return {
    total,
    onlineCount: onlineItems.length,
    offlineCount: offlineItems.length,
    offlineItems,
    healthScore: calculateHealth(onlineItems.length, total),
  };
};

const buildEmbeds = (stats: ReturnType<typeof analyzeHeartbeats>) => {
  const isCritical = stats.offlineCount > 0;
  const isDegraded = stats.healthScore < 100 && !isCritical;

  // Select Theme based on status
  const theme = isCritical
    ? STATUS_THEMES.CRITICAL
    : isDegraded
    ? STATUS_THEMES.DEGRADED
    : STATUS_THEMES.HEALTHY;

  const summaryEmbed = {
    title: `${theme.icon} ${theme.title}`,
    // ใช้ Blockquote และ Markdown เพื่อความสวยงาม
    description: `>>> **Bot Monitor Report**\nRequested on: \`${dayjs().format(
      "DD MMM YYYY HH:mm:ss"
    )}\`\nEnvironment: \`Production\``,
    color: theme.color,
    thumbnail: {
      url: "https://img2.pic.in.th/pic/Google-Gemini.th.jpg",
    }, // Logo บริษัทเล็กๆ มุมขวาบน
    image: { url: theme.image }, // รูปใหญ่ด้านล่าง
    fields: [
      {
        name: "🤖 Total Bots",
        value: `\` ${stats.total} \` Jobs`,
        inline: true,
      },
      {
        name: "✅ Online",
        value: `\` ${stats.onlineCount} \` Active`,
        inline: true,
      },
      {
        name: "💀 Offline",
        value: `\` ${stats.offlineCount} \` Issues`,
        inline: true,
      },
      {
        name: "📊 System Health",
        value: `\`\`\`ini\n${getProgressBar(stats.healthScore)}\n\`\`\``, // ใช้ Code block เพื่อให้ Progress bar เท่ากันทุกบรรทัด
        inline: false,
      },
    ],
    footer: {
      text: "🚀 SchoolBright Bot Monitor System",
      icon_url:
        "https://play-lh.googleusercontent.com/5tMDW7qOj174fR8MVrUOC1xBRx6a8jYg97yYzMw0JwlcS13gazRD8J3HmumEhFi3aQ",
    },
    timestamp: new Date().toISOString(),
  };

  const embeds: any[] = [summaryEmbed];

  // ถ้ามี Error ให้เพิ่ม Embed แยก เพื่อไม่ให้แย่งซีนกัน และอ่านง่าย
  if (isCritical) {
    const offlineList = stats.offlineItems
      .slice(0, 15) // Limit เพื่อไม่ให้ข้อความยาวเกิน limit ของ Discord
      .map(
        (i) =>
          `❌ **${i.JobName}**\n   └── 🕒 Last Check: \`${formatDate(
            i.LastUpdatedTime
          )}\``
      )
      .join("\n");

    embeds.push({
      title: `🚨 Detected ${stats.offlineCount} Offline Services`,
      description: offlineList || "No specific data available.",
      color: STATUS_THEMES.CRITICAL.color,
      fields: [
        {
          name: "🛠️ Action Required",
          value:
            "Please restart the service or check the server logs immediately.",
          inline: false,
        },
      ],
    });
  }

  return embeds;
};

async function sendDiscordNotification(embeds: any[], hasErrors: boolean) {
  if (!WEBHOOK_DISCORD) return;

  const content = hasErrors
    ? `# 🔥 CRITICAL ALERT!\nAttention: ${DISCORD_ALERT_USER}, systems are down!`
    : undefined;

  try {
    await axios.post(
      WEBHOOK_DISCORD,
      {
        username: "Narino Bot",
        avatar_url: "https://img2.pic.in.th/pic/Google-Gemini.th.jpg",
        content,
        embeds,
      },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    logger.error("Discord Webhook Failed", error?.message);
  }
}

// --- API Handler ---

export async function GET(request: NextRequest) {
  const apiUrl = `${API_URL.SB_HELPER_URL}/api/v1/health-check/server/heartbeats/`;

  try {
    const { data } = await axios.get(apiUrl, {
      headers: { accept: "application/json" },
    });
    const heartbeats: HeartbeatResponse[] = data?.data || [];

    const stats = analyzeHeartbeats(heartbeats);
    const embeds = buildEmbeds(stats);

    await sendDiscordNotification(embeds, stats.offlineCount > 0);

    return NextResponse.json(
      successResponse({ data: heartbeats, status: 200 })
    );
  } catch (error: any) {
    logger.error("Health Check Failed", error.message);
    return NextResponse.json(
      errorResponse({
        message_en: "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        status: 500,
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
