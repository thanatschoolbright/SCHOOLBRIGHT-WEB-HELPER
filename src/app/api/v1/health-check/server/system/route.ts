import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";
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
import { checkGetSchoolListService } from "./helper/mobile/get-school-list.service";
import { checkProfileService } from "./helper/mobile/check-profile.service";
import { checkRefreshTokenService } from "./helper/mobile/refresh-token.service";
import { checkEmailVerificationService } from "./helper/mobile/check-verify-email.service";
import { checkSystemApiUrlsService } from "./helper/mobile/api-url-check.service";
import { checkStudentLeaveTypeService } from "./helper/mobile/check-student-leave-type.service";
import { checkStudentLeaveInfoService } from "./helper/mobile/leave-system/check-student-leave-info.service";
import { checkProvinceService } from "./helper/mobile/leave-system/check-province.service";
import { checkDistrictService } from "./helper/mobile/leave-system/check-district.service";
import { checkAmphurService } from "./helper/mobile/leave-system/check-amphur.service";
import { checkLeaveUploadService } from "./helper/mobile/leave-system/check-leave-upload.service";
import { checkFindClassroomService } from "./helper/mobile/leave-system/check-find-classroom.service";
import { checkSubmitLeaveService } from "./helper/mobile/leave-system/check-submit-leave.service";

dayjs.locale("th");

const DISCORD_CONFIG = {
  WEBHOOK_URL:
    process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_DAILY_MONITOR_SERVER ?? "",
  ALERT_USER_ID: "<@692372441699319900>",
  BOT_NAME: "SB System Monitor",
  AVATAR_URL:
    "https://play-lh.googleusercontent.com/5tMDW7qOj174fR8MVrUOC1xBRx6a8jYg97yYzMw0JwlcS13gazRD8J3HmumEhFi3aQ",
};

const THEMES = {
  HEALTHY: {
    color: 0x2ecc71,
    title: "ระบบทำงานปกติสมบูรณ์",
    icon: "✅",
    image: "https://img2.pic.in.th/pic/Google-Gemini.th.jpg",
  },
  CRITICAL: {
    color: 0xed4245,
    title: "ตรวจพบความผิดปกติของระบบ",
    icon: "🚨",
    image: "https://img5.pic.in.th/file/secure-sv1/Bad_job.md.jpg",
  },
};

const getProgressBar = (percentage: number) => {
  const blocks = 10;
  const filled = Math.round((percentage / 100) * blocks);
  const empty = blocks - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${percentage}%`;
};

const analyzeResults = (results: HealthCheckResult[]) => {
  const total = results.length;
  const passed = results.filter((r) => r.status === "200");
  const failed = results.filter((r) => r.status !== "200");
  const healthScore =
    total === 0 ? 0 : Math.round((passed.length / total) * 100);

  return { total, passed, failed, healthScore };
};

const buildDiscordPayload = (stats: ReturnType<typeof analyzeResults>) => {
  const isCritical = stats.failed.length > 0;
  const theme = isCritical ? THEMES.CRITICAL : THEMES.HEALTHY;

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

async function executeHealthChecks(): Promise<HealthCheckResult[]> {
  const loginResult = await checkLoginService();
  let freshToken = "";

  if (loginResult.status === "200" && loginResult.response?.token) {
    freshToken = loginResult.response.token;
  } else {
    console.warn(
      "⚠️ Login Service Failed or Token missing. Using fallback/env token if available."
    );
  }

  const otherServicesResults = await Promise.all([
    checkVerificationService(freshToken),
    checkNotificationService(freshToken),
    checkFlagPoleAttendanceService(freshToken),
    checkFlagPoleScanService(freshToken),
    checkServerStatusService(),
    checkFacialScanService(),
    checkGetSchoolListService(),
    checkProfileService(freshToken),
    checkRefreshTokenService(freshToken),
    checkEmailVerificationService(freshToken),
    checkSystemApiUrlsService(freshToken),
    checkStudentLeaveTypeService(freshToken),
    checkStudentLeaveInfoService(freshToken),
    checkProvinceService(freshToken),
    checkDistrictService(freshToken),
    checkAmphurService(freshToken),
    checkLeaveUploadService(freshToken),
    checkFindClassroomService(freshToken),
    checkSubmitLeaveService(freshToken),
  ]);

  return [loginResult, ...otherServicesResults];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const shouldNotifyDiscord = body.mode === "discord";

    const healthCheckResults = await executeHealthChecks();

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
