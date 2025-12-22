import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { logger } from "@/helpers/logger";
import { checkLoginService } from "./helper/mobile/login.service";
import { checkVerificationService } from "./helper/mobile/verification.service";
import { checkServerStatusService } from "./helper/mobile/server-status.service";
import { checkFacialScanService } from "./helper/hardware/facial-scan.service";
import { HealthCheckResult } from "./helper/health-check.type";
import { checkNotificationService } from "./helper/mobile/notification.service";
import { checkFlagPoleAttendanceService } from "./helper/mobile/attendance-student.service";
import { checkFlagPoleScanService } from "./helper/mobile/attendance-scan.service";

// Config
const DISCORD_CONFIG = {
  // ใช้ ENV ตามที่คุณระบุ
  WEBHOOK_URL:
    process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_DAILY_MONITOR_SERVER ?? "",
  // User ID ที่ต้องการ Tag เมื่อเกิดข้อผิดพลาด
  ALERT_USER_ID: "<@692372441699319900>",
  BOT_USERNAME: "SB System Monitor",
  // สีสำหรับ Embed (Decimals)
  COLOR_SUCCESS: 5763719, // สีเขียว
  COLOR_DANGER: 15548997, // สีแดง
};

// รวบรวมฟังก์ชันตรวจสอบทั้งหมด
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

// สร้าง Payload สำหรับ Discord Embed
function generateDiscordPayload(results: HealthCheckResult[]) {
  const failedServices = results.filter((r) => r.status !== "200");
  const hasError = failedServices.length > 0;

  // 1. กำหนดสีและข้อความหัวเรื่อง
  const color = hasError
    ? DISCORD_CONFIG.COLOR_DANGER
    : DISCORD_CONFIG.COLOR_SUCCESS;

  const title = hasError
    ? "🚨 System Alert: พบความผิดปกติของระบบ"
    : "✅ System Status: ระบบทำงานปกติ";

  const description = hasError
    ? `พบระบบที่มีปัญหาจำนวน **${failedServices.length}** รายการ กรุณาตรวจสอบทันที`
    : `ตรวจสอบทั้งหมด **${results.length}** ระบบ เรียบร้อยแล้ว`;

  // 2. สร้าง Fields สำหรับแต่ละ Service (ปรับให้เหลือ 1 บรรทัด)
  const fields = results.map((service) => {
    const isError = service.status !== "200";
    const icon = isError ? "❌" : "✅";

    // [แก้ไข] รวม Host และ Status ไว้ในบรรทัดเดียวกัน
    let value = `**Status:** ${service.status} | **Host:** ${service.service}`;

    // หาก Error ให้แนบ cURL ต่อท้าย (จำเป็นต้องขึ้นบรรทัดใหม่เพื่อให้ copy ได้)
    if (isError) {
      value += `\n\`\`\`bash\n${service.curl}\n\`\`\``;
    }

    return {
      name: `${icon} ${service.name_th} (${service.module})`,
      value: value,
      inline: false,
    };
  });

  // 3. ประกอบร่าง Embed Object
  const embed = {
    title: title,
    description: description,
    color: color,
    fields: fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: "School Bright Monitoring System",
    },
  };

  // 4. กรณีมี Error ให้ Tag User ด้วย
  const content = hasError
    ? `🔥 **Critical Alert!** ${DISCORD_CONFIG.ALERT_USER_ID} ระบบมีปัญหา โปรดตรวจสอบ!`
    : "📊 **Daily Health Check Report**";

  return {
    username: DISCORD_CONFIG.BOT_USERNAME,
    content: content,
    embeds: [embed],
  };
}

async function sendDiscordNotification(results: HealthCheckResult[]) {
  if (!DISCORD_CONFIG.WEBHOOK_URL) {
    logger.error("Discord Webhook URL is missing");
    return;
  }

  const payload = generateDiscordPayload(results);

  try {
    await axios.post(DISCORD_CONFIG.WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error("Failed to send Discord webhook", error?.message ?? error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const shouldNotifyDiscord = body.mode === "discord";

    // 1. รัน Health Checks ทั้งหมด
    const healthCheckResults = await executeHealthChecks();

    // 2. ส่ง Discord หากได้รับ Parameter mode=discord
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
