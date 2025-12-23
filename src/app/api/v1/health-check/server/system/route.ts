import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th"; // Import locale ภาษาไทย
import { successResponse, errorResponse } from "@/helpers/api/response";
import { logger } from "@/helpers/logger";
import { checkLoginService } from "./helper/mobile/login.service";
import { checkVerificationService } from "./helper/mobile/verification.service";
import { checkServerStatusService } from "./helper/mobile/server-status.service";
import { checkFacialScanService } from "./helper/hardware/facial-scan.service";
import { checkNotificationService } from "./helper/mobile/notification.service";
import { checkFlagPoleAttendanceService } from "./helper/mobile/attendance-student.service";
import { checkFlagPoleScanService } from "./helper/mobile/attendance-scan.service";
import { HealthCheckResult } from "./helper/health-check.type";

// ตั้งค่าภาษาไทยให้กับ dayjs
dayjs.locale("th");

// --- ⚙️ Configuration ---

const DISCORD_CONFIG = {
  WEBHOOK_URL:
    process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_DAILY_MONITOR_SERVER ?? "",
  ALERT_USER_ID: "<@692372441699319900>", // ID ของคุณดีน (หรือผู้ดูแลระบบ)
  BOT_NAME: "SB System Monitor", // ชื่อบอทภาษาไทย หรือชื่อที่ทีมคุ้นเคย
  AVATAR_URL:
    "https://play-lh.googleusercontent.com/5tMDW7qOj174fR8MVrUOC1xBRx6a8jYg97yYzMw0JwlcS13gazRD8J3HmumEhFi3aQ", // โลโก้บริษัท
};

const THEMES = {
  HEALTHY: {
    color: 0x2ecc71, // สีเขียว (ปกติ)
    title: "ระบบทำงานปกติสมบูรณ์",
    icon: "✅",
    // GIF: หน้าจอ HUD สีเขียว สื่อถึงความเสถียร
    image: "https://img2.pic.in.th/pic/Google-Gemini.th.jpg",
  },
  CRITICAL: {
    color: 0xed4245, // สีแดง (วิกฤต)
    title: "ตรวจพบความผิดปกติของระบบ",
    icon: "🚨",
    // GIF: หน้าจอ Glitch/Error สื่อถึงปัญหา
    image: "https://img5.pic.in.th/file/secure-sv1/Bad_job.md.jpg",
  },
};

// --- 🛠️ Utility Functions ---

// สร้าง Progress Bar สวยๆ
const getProgressBar = (percentage: number) => {
  const blocks = 10;
  const filled = Math.round((percentage / 100) * blocks);
  const empty = blocks - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${percentage}%`;
};

// --- 🧠 Analysis Logic ---

const analyzeResults = (results: HealthCheckResult[]) => {
  const total = results.length;
  const passed = results.filter((r) => r.status === "200");
  const failed = results.filter((r) => r.status !== "200");
  const healthScore =
    total === 0 ? 0 : Math.round((passed.length / total) * 100);

  return { total, passed, failed, healthScore };
};

// --- 🎨 Embed Builder ---

const buildDiscordPayload = (stats: ReturnType<typeof analyzeResults>) => {
  const isCritical = stats.failed.length > 0;
  const theme = isCritical ? THEMES.CRITICAL : THEMES.HEALTHY;

  // 1. Main Dashboard Embed (ส่วนสรุปภาพรวม)
  const mainEmbed = {
    title: `${theme.icon} ${theme.title}`,
    description: `> **รายงานสถานะระบบประจำวัน**\n> 📅 วันที่: \`${dayjs().format(
      "D MMMM YYYY"
    )}\`\n> 🕒 เวลา: \`${dayjs().format("HH:mm น.")}\``,
    color: theme.color,
    thumbnail: { url: DISCORD_CONFIG.AVATAR_URL },
    image: { url: theme.image },
    fields: [
      {
        name: "📊 **ความสมบูรณ์ของระบบ**",
        value: `\`\`\`ini\n${getProgressBar(stats.healthScore)}\n\`\`\``,
        inline: false,
      },
      {
        name: "✅ **ทำงานปกติ**",
        value: `\` ${stats.passed.length} \` ระบบ`,
        inline: true,
      },
      {
        name: "❌ **พบปัญหา**",
        value: `\` ${stats.failed.length} \` ระบบ`,
        inline: true,
      },
      {
        name: "🤖 **ตรวจสอบทั้งหมด**",
        value: `\` ${stats.total} \` รายการ`,
        inline: true,
      },
    ],
    footer: {
      text: "ระบบตรวจสอบสถานะอัตโนมัติ SchoolBright",
      icon_url: DISCORD_CONFIG.AVATAR_URL,
    },
    timestamp: new Date().toISOString(),
  };

  const embeds: any[] = [mainEmbed];

  // 2. Failed Services Embed (แสดงเฉพาะเมื่อมี Error - ส่วนสำคัญที่ต้องแก้)
  if (isCritical) {
    const errorFields = stats.failed.map((service) => ({
      name: `❌ ${service.name_th} (${service.module})`,
      // แปลงข้อมูลเทคนิคเป็นรูปแบบที่ก๊อปปี้ไปส่งต่อให้ Dev ได้ง่าย
      value: `**สถานะ:** \`${service.status}\`\n**จุดเชื่อมต่อ:** \`${service.service}\`\n**คำสั่งตรวจสอบ (cURL):**\n\`\`\`bash\n${service.curl}\n\`\`\``,
      inline: false,
    }));

    embeds.push({
      title: `🚨 พบปัญหาจำนวน ${stats.failed.length} รายการ`,
      description: "กรุณาตรวจสอบระบบดังต่อไปนี้โดยด่วน",
      color: 0xed4245, // สีแดง
      fields: errorFields,
    });
  }

  // 3. Operational Services List (แสดงรายชื่อที่ผ่านแบบย่อ - ให้สบายใจว่าเช็คแล้ว)
  if (stats.passed.length > 0) {
    // จัดกลุ่มชื่อ Service ให้ดูง่าย
    const passedList = stats.passed
      .map((s) => `✅ **${s.name_th}**`)
      .join("\n");

    embeds.push({
      title: "✨ ระบบที่ทำงานปกติ",
      description: passedList,
      color: 0x2ecc71, // สีเขียว
    });
  }

  // Content สำหรับ Tag คน (เฉพาะตอนพัง เพื่อไม่ให้รบกวนบ่อยเกินไป)
  const content = isCritical
    ? `# 🔥 แจ้งเตือนวิกฤต!\nเรียน ${DISCORD_CONFIG.ALERT_USER_ID} พบความผิดปกติของระบบ กรุณาตรวจสอบด่วน!`
    : undefined;

  return {
    username: DISCORD_CONFIG.BOT_NAME,
    avatar_url: DISCORD_CONFIG.AVATAR_URL,
    content,
    embeds,
  };
};

// --- 🚀 Sender ---

async function sendDiscordNotification(results: HealthCheckResult[]) {
  if (!DISCORD_CONFIG.WEBHOOK_URL) {
    logger.error("Discord Webhook URL is missing");
    return;
  }

  const stats = analyzeResults(results);
  const payload = buildDiscordPayload(stats);

  try {
    await axios.post(DISCORD_CONFIG.WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Failed to send Discord webhook", error?.message ?? error);
  }
}

// --- 🏁 Main Handler ---

async function executeHealthChecks(): Promise<HealthCheckResult[]> {
  return Promise.all([
    checkLoginService(),
    checkVerificationService(),
    checkServerStatusService(),
    checkFacialScanService(),
    checkNotificationService(),
    checkFlagPoleAttendanceService(),
    checkFlagPoleScanService(),
  ]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const shouldNotifyDiscord = body.mode === "discord";

    // 1. เริ่มการตรวจสอบระบบ (Health Check)
    const healthCheckResults = await executeHealthChecks();

    // 2. ส่งผลไปยัง Discord หากมีการร้องขอ
    if (shouldNotifyDiscord) {
      await sendDiscordNotification(healthCheckResults);
    }

    return NextResponse.json(successResponse({ data: healthCheckResults }), {
      status: 200,
    });
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        status: 500,
        error: null,
      }),
      { status: 500 }
    );
  }
}
