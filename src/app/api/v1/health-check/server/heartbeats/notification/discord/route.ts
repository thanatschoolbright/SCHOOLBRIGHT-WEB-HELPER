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

/**
 * ส่ง payload ไปยัง Discord webhook
 * - ไม่โยน error ให้ caller (log แล้ว return null) เพื่อไม่ให้กระทบ flow หลัก
 */
async function sendDiscordWebhook(payload: {
  content?: string;
  username?: string;
  embeds?: any[];
}) {
  try {
    return await axios.post(WEBHOOK_DISCORD, payload, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    logger.error("Failed to send Discord webhook", err?.message ?? err);
    return null;
  }
}

/**
 * คำนวณสถิติพื้นฐานจากรายการ heartbeat
 * - แยก jobs ที่ deprecated (ไม่สนใจในการคำนวณ health)
 */
function summarize(items: HeartbeatResponse[]) {
  const total = items.length;
  const deprecatedNames = new Set(["KPaymentCheckChargeApp", "Job_TShop_Bot"]);

  const deprecatedCount = items.filter((i) =>
    deprecatedNames.has(i.JobName)
  ).length;
  // รายการชื่อ job ที่ถูกทำเครื่องหมายว่า deprecated (ไม่ซ้ำ)
  const deprecatedList = Array.from(
    new Set(
      items.filter((i) => deprecatedNames.has(i.JobName)).map((i) => i.JobName)
    )
  );
  const activeTotal = Math.max(0, total - deprecatedCount);
  const onlineActive = items.filter(
    (i) =>
      !deprecatedNames.has(i.JobName) &&
      String(i.Status).toLowerCase() === "online"
  ).length;

  // คืนค่า: offlineItems จะเป็นเฉพาะ jobs ที่ offline และยังไม่ถูกยกเลิก (เพื่อไม่ให้นับ deprecated เป็น offline)
  return {
    total,
    deprecatedCount,
    deprecatedList,
    activeTotal,
    onlineActive,
    offlineItems: items.filter(
      (i) =>
        String(i.Status).toLowerCase() !== "online" &&
        !deprecatedNames.has(i.JobName)
    ),
    deprecatedNames,
  };
}

// Small utility: render a progress bar string
function makeProgress(p: number) {
  const totalBlocks = 10;
  const filled = Math.round((p / 100) * totalBlocks);
  const empty = totalBlocks - filled;
  return `${"▰".repeat(filled)}${"▱".repeat(empty)} ${p}%`;
}

// ฟอร์แมตวันที่เป็น DD/MM/YYYY HH:mm (รองรับ microseconds)
function formatDate(raw?: string) {
  if (!raw) return "-";
  try {
    const normalized = raw.replace(/\.(\d{3})\d+/, ".$1");
    return dayjs(normalized).format("DD/MM/YYYY HH:mm");
  } catch (e) {
    return raw;
  }
}

// แปลงสถานะเป็นข้อความภาษาไทย
function translateStatus(raw?: string) {
  if (!raw) return raw ?? "-";
  const v = String(raw).toLowerCase();
  if (v === "online") return "ออนไลน์";
  if (v === "offline") return "ออฟไลน์";
  return raw;
}

/**
 * สร้าง array ของ Discord embeds (summary + offline details)
 * - ตกแต่งชื่อ job บางตัวเป็น (ยกเลิกการใช้งานแล้ว)
 */
function buildHeartbeatEmbeds(items: HeartbeatResponse[]) {
  // Delegate: compute summary once, then build embeds from the summary object
  const s = summarize(items);
  return buildEmbedsFromSummary(s);
}

/**
 * สร้าง embeds จาก summary object เพื่อให้โค้ดอ่านง่ายและแยกความรับผิดชอบ
 */
/**
 * สร้าง embeds จาก summary object เพื่อให้โค้ดอ่านง่ายและแยกความรับผิดชอบ
 */
function buildEmbedsFromSummary(s: ReturnType<typeof summarize>) {
  const pct =
    s.activeTotal === 0
      ? 100
      : Math.round((s.onlineActive / s.activeTotal) * 100);

  // Determine status color and mood
  let color = 0x2ecc71; // Green (Excellent)
  let moodIcon = "🟢";
  let moodTitle = "All Systems Operational";
  let moodImage =
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56L2dpZg/3o7abKhOpu0NwenH3O/giphy.gif"; // Happy robot/system

  if (s.offlineItems.length > 0) {
    color = 0xff4d4f; // Red (Critical)
    moodIcon = "🔴";
    moodTitle = "System Critical Alert";
    moodImage =
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZ5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56dGZ5ZHR4aW56L2dpZg/13d2jHlSlFQyo0/giphy.gif"; // Alarm/Panic
  } else if (pct < 100) {
    color = 0xfaad14; // Orange (Warning)
    moodIcon = "jq";
    moodTitle = "System Degraded";
  }

  const summaryEmbed = {
    title: `${moodIcon} **${moodTitle}**`,
    description: `> *รายงานสถานะระบบประจำวัน* \n> 📅 **${dayjs().format(
      "DD MMMM YYYY"
    )}** | 🕒 **${dayjs().format("HH:mm")}**`,
    color,
    thumbnail: {
      url: "https://static.schoolbright.io/logo.png",
    },
    image: {
      url:
        s.offlineItems.length > 0
          ? "https://media1.tenor.com/m/0z9x9X5X5XAAAAAC/error.gif"
          : "https://media1.tenor.com/m/9X5X5X5X5XAAAAAC/check.gif", // Placeholder for dynamic image based on status if needed, or keep simple
    },
    fields: [
      {
        name: "🤖 **Total Bots**",
        value: `\`${s.total}\` Jobs`,
        inline: true,
      },
      {
        name: "✅ **Online**",
        value: `\`${s.onlineActive}\` Active`,
        inline: true,
      },
      {
        name: "💀 **Offline**",
        value: `\`${s.offlineItems.length}\` Issues`,
        inline: true,
      },
      {
        name: "📊 **System Health**",
        value: `${makeProgress(pct)}`,
        inline: false,
      },
      {
        name: "🗑️ **Deprecated**",
        value: `\`${s.deprecatedCount}\` Jobs`,
        inline: true,
      },
    ],
    footer: {
      text: "🚀 SchoolBright Bot Monitor | Powered by SB-Helper",
      icon_url: "https://static.schoolbright.io/logo.png",
    },
    timestamp: new Date().toISOString(),
  };

  const embeds: any[] = [summaryEmbed];

  if (s.offlineItems.length > 0) {
    const offlineList = s.offlineItems
      .slice(0, 15) // Show a bit more
      .map((i) => {
        const name = s.deprecatedNames.has(i.JobName)
          ? `~~${i.JobName}~~ (Deprecated)`
          : `**${i.JobName}**`;
        return `❌ ${name}\n└ 🕒 Last seen: ${formatDate(i.LastUpdatedTime)}`;
      })
      .join("\n\n");

    const offlineEmbed = {
      title: `🚨 **Offline Services Detected** (${s.offlineItems.length})`,
      description: offlineList || "No active offline services.",
      color: 0xff4d4f,
      footer: {
        text: "Please investigate immediately.",
      },
    };
    embeds.push(offlineEmbed);
  }

  return embeds;
}

/**
 * GET handler: ดึงข้อมูล heartbeat จาก SB helper, ส่งสรุปไปยัง Discord และตอบ JSON
 */
export async function GET(request: NextRequest) {
  const url = API_URL.SB_HELPER_URL;
  const endpoint = `/api/v1/health-check/server/heartbeats/`;
  const fullUrl = `${url}${endpoint}`;

  try {
    const response = await axios.get(fullUrl, {
      headers: { accept: "application/json" },
    });
    const result: HeartbeatResponse[] = response?.data?.data || [];

    try {
      const embeds = buildHeartbeatEmbeds(result);
      // ตัดสินใจข้อความแจ้งเตือน: ถ้ามี offline มากกว่า 0 ให้ส่งข้อความภาษาไทยพร้อม mention
      const s = summarize(result);
      let content: string | undefined;
      if (s.offlineItems.length > 0) {
        content = `🔥 เกิดข้อผิดพลาด บางอย่าง!!! รบกวนคุณดีน ช่วยตรวจสอบความผิดปกติดังกล่าว ขอบคุณ ${DISCORD_ALERT_USER}`;
      }

      await sendDiscordWebhook({
        content,
        username: "SB-Health-Check",
        embeds,
      });
    } catch (err: any) {
      logger.error("Failed to build/send heartbeat embed", err?.message ?? err);
    }

    return NextResponse.json(
      successResponse({ data: result, status: response.status }),
      { status: response.status }
    );
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        status: statusCode,
        error: error.response?.data || null,
      }),
      { status: statusCode }
    );
  }
}
