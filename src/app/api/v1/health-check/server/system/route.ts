import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th"; // Import locale ภาษาไทย
import { successResponse, errorResponse } from "@/helpers/api/response";
import { logger } from "@/helpers/logger";

// Import Services
import { checkLoginService } from "./helper/mobile/login.service";
import { checkVerificationService } from "./helper/mobile/verification.service";
import { checkServerStatusService } from "./helper/mobile/server-status.service";
import { checkFacialScanService } from "./helper/hardware/facial-scan.service";
import { checkNotificationService } from "./helper/mobile/notification.service";
import { checkFlagPoleAttendanceService } from "./helper/mobile/attendance-student.service";
import { checkFlagPoleScanService } from "./helper/mobile/attendance-scan.service";
import { HealthCheckResult } from "./helper/health-check.type";
import { checkGetSchoolListService } from "./helper/mobile/get-school-list.service";

// ตั้งค่าภาษาไทยให้กับ dayjs
dayjs.locale("th");

// --- ⚙️ Configuration ---

const DISCORD_CONFIG = {
  WEBHOOK_URL:
    process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_DAILY_MONITOR_SERVER ?? "",
  ALERT_USER_ID: "<@692372441699319900>", // ID ผู้ดูแลระบบ
  BOT_NAME: "SB System Monitor",
  AVATAR_URL:
    "https://play-lh.googleusercontent.com/5tMDW7qOj174fR8MVrUOC1xBRx6a8jYg97yYzMw0JwlcS13gazRD8J3HmumEhFi3aQ",
};

const THEMES = {
  HEALTHY: {
    color: 0x2ecc71, // สีเขียว
    title: "ระบบทำงานปกติสมบูรณ์",
    icon: "✅",
    image: "https://img2.pic.in.th/pic/Google-Gemini.th.jpg",
  },
  CRITICAL: {
    color: 0xed4245, // สีแดง
    title: "ตรวจพบความผิดปกติของระบบ",
    icon: "🚨",
    image: "https://img5.pic.in.th/file/secure-sv1/Bad_job.md.jpg",
  },
};

// --- 🛠️ Utility Functions ---

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

  // 1. Main Dashboard Embed
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

  // 2. Failed Services Embed
  if (isCritical) {
    const errorFields = stats.failed.map((service) => ({
      name: `❌ ${service.name_th} (${service.module})`,
      value: `**สถานะ:** \`${service.status}\`\n**จุดเชื่อมต่อ:** \`${service.service}\`\n**คำสั่งตรวจสอบ (cURL):**\n\`\`\`bash\n${service.curl}\n\`\`\``,
      inline: false,
    }));

    embeds.push({
      title: `🚨 พบปัญหาจำนวน ${stats.failed.length} รายการ`,
      description: "กรุณาตรวจสอบระบบดังต่อไปนี้โดยด่วน",
      color: 0xed4245,
      fields: errorFields,
    });
  }

  // 3. Operational Services List
  if (stats.passed.length > 0) {
    const passedList = stats.passed
      .map((s) => `✅ **${s.name_th}**`)
      .join("\n");

    embeds.push({
      title: "✨ ระบบที่ทำงานปกติ",
      description: passedList,
      color: 0x2ecc71,
    });
  }

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

// --- 🏁 Main Handler & Logic ---

async function executeHealthChecks(): Promise<HealthCheckResult[]> {
  // 1. ยิง Login Service ก่อนเป็นอันดับแรก (Await) เพื่อเอา Token
  const loginResult = await checkLoginService();

  // 2. ดึง Token ออกมาจาก Response ของ Login
  let freshToken = "";

  // ตรวจสอบว่า Login สำเร็จและมี Token กลับมาหรือไม่
  // หมายเหตุ: เช็ค field 'token' ตาม Response JSON ตัวอย่างที่คุณให้มา
  if (loginResult.status === "200" && loginResult.response?.token) {
    freshToken = loginResult.response.token;
  } else {
    // ถ้า Login ไม่ผ่าน ให้ Log เตือน (Service อื่นจะใช้ Fallback หรือ Fail)
    console.warn(
      "⚠️ Login Service Failed or Token missing. Using fallback/env token if available."
    );
  }

  // 3. ยิง Service ที่เหลือ โดยส่ง freshToken เข้าไปด้วย (สำหรับตัวที่ต้องการ Auth)
  const otherServicesResults = await Promise.all([
    // กลุ่มที่ต้องใช้ Token (ส่ง freshToken เข้าไป)
    checkVerificationService(freshToken),
    checkNotificationService(freshToken),
    checkFlagPoleAttendanceService(freshToken),
    checkFlagPoleScanService(freshToken),

    // กลุ่มที่ไม่ต้องใช้ Token หรือใช้ Key แยกต่างหาก
    checkServerStatusService(), // Public API
    checkFacialScanService(), // Hardware API (ใช้ schoolId/UserCode ใน Body)
    checkGetSchoolListService(), // Mobile API (Get School List)
  ]);

  // 4. รวมผลลัพธ์ทั้งหมดกลับไป (เอา Login ไว้ตัวแรกสุด)
  return [loginResult, ...otherServicesResults];
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
