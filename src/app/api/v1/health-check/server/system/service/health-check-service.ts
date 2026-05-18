import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { checkFacialScanService } from "../helper/hardware/facial-scan.service";
import { HealthCheckResult } from "../helper/health-check.type";
import { checkFlagPoleScanService } from "../helper/mobile/attendance-system/attendance-scan.service";
import { checkFlagPoleAttendanceService } from "../helper/mobile/attendance-system/attendance-student.service";
import { checkBroadcastHistoryService } from "../helper/mobile/broadcast-system/history.service";
import { checkAmphurService } from "../helper/mobile/leave-system/check-amphur.service";
import { checkDistrictService } from "../helper/mobile/leave-system/check-district.service";
import { checkFindClassroomService } from "../helper/mobile/leave-system/check-find-classroom.service";
import { checkLeaveUploadService } from "../helper/mobile/leave-system/check-leave-upload.service";
import { checkProvinceService } from "../helper/mobile/leave-system/check-province.service";
import { checkStudentLeaveInfoService } from "../helper/mobile/leave-system/check-student-leave-info.service";
import { checkStudentLeaveTypeService } from "../helper/mobile/leave-system/check-student-leave-type.service";
import { checkSubmitLeaveService } from "../helper/mobile/leave-system/check-submit-leave.service";
import { checkLoginService } from "../helper/mobile/login-system/login.service";
import { checkRefreshTokenService } from "../helper/mobile/login-system/refresh-token.service";
import { checkAcceptUnreadCountService } from "../helper/mobile/notification-system/accept-unread-count.service";
import { checkBannerService } from "../helper/mobile/notification-system/banner.service";
import { checkGeneralUnreadCountService } from "../helper/mobile/notification-system/general-unread-count.service";
import { checkNotificationUnreadCountService } from "../helper/mobile/notification-system/notification-system-unread-count.service";
import { checkNotificationTodayService } from "../helper/mobile/notification-system/notification-today.service";
import { checkNotificationService } from "../helper/mobile/notification-system/notification.service";
import { checkSystemBannerService } from "../helper/mobile/notification-system/system-banner.service";
import { checkSystemNotificationService } from "../helper/mobile/notification-system/system-notification.service";
import { checkGetSchoolListService } from "../helper/mobile/school-system/get-school-list.service";
import { checkSystemApiUrlsService } from "../helper/mobile/server-system/api-url-check.service";
import { checkServerStatusService } from "../helper/mobile/server-system/server-status.service";
import { checkServerStatusV2Service } from "../helper/mobile/server-system/server-status.v2.service";
import { checkPermissionService } from "../helper/mobile/user-system/check-permission.service";
import { checkProfileService } from "../helper/mobile/user-system/check-profile.service";
import { checkEmailVerificationService } from "../helper/mobile/user-system/check-verify-email.service";
import { checkVerificationService } from "../helper/mobile/user-system/verification.service";

dayjs.locale("th");

// ── Config ─────────────────────────────────────────────────────────────────
const DISCORD_CONFIG = {
  WEBHOOK_URL: process.env.WEBHOOK_DISCORD_DAILY_MONITOR_SERVER ?? "",
  ALERT_USER_ID: "<@1344189022561636445>",
  BOT_NAME: "SB System Monitor",
  AVATAR_URL:
    "https://play-lh.googleusercontent.com/5tMDW7qOj174fR8MVrUOC1xBRx6a8jYg97yYzMw0JwlcS13gazRD8J3HmumEhFi3aQ",
};

const THEMES = {
  HEALTHY: {
    color: 0x2ecc71,
    title: "✨ ระบบทำงานปกติสมบูรณ์ ✨",
    icon: "✅",
    image: "https://img2.pic.in.th/pic/Google-Gemini.th.jpg",
  },
  CRITICAL: {
    color: 0xed4245,
    title: "🚨 ตรวจพบความผิดปกติของระบบ 🚨",
    icon: "⚠️",
    image: "https://img5.pic.in.th/file/secure-sv1/Bad_job.md.jpg",
  },
};

const GROUP_LABELS: Record<string, string> = {
  "login-system": "🔑 ระบบเข้าสู่ระบบ",
  "user-system": "👤 ระบบผู้ใช้งาน",
  "attendance-system": "📝 ระบบการมาเรียน",
  "leave-system": "🏥 ระบบการลา",
  "server-system": "🖥️ ระบบเซิร์ฟเวอร์",
  "school-system": "🏫 ระบบโรงเรียน",
  "notification-system": "🔔 ระบบแจ้งเตือน",
  other: "🛠️ ระบบอื่นๆ",
};

// ── Types ───────────────────────────────────────────────────────────────────
interface GroupStat {
  passed: number;
  failed: number;
  items: HealthCheckResult[];
}

interface AnalyzeResultOutput {
  total: number;
  passed: HealthCheckResult[];
  failed: HealthCheckResult[];
  healthScore: number;
  groupedResults: Record<string, GroupStat>;
}

interface DiscordField {
  name: string;
  value: string;
  inline: boolean;
}

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  thumbnail?: { url: string };
  image?: { url: string };
  fields?: DiscordField[];
  footer?: { text: string; icon_url: string };
  timestamp?: string;
}

interface DiscordPayload {
  username: string;
  avatar_url: string;
  content?: string;
  embeds: DiscordEmbed[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// 📊 สร้าง progress bar สำหรับแสดงผลคะแนนสุขภาพระบบ
const buildProgressBar = (percentage: number): string => {
  const blocks = 10;
  const filled = Math.round((percentage / 100) * blocks);
  const empty = blocks - filled;
  const emoji =
    percentage === 100
      ? "🌟"
      : percentage > 80
      ? "🟢"
      : percentage > 50
      ? "🟡"
      : "🔴";
  return `${emoji} [${"■".repeat(filled)}${"□".repeat(empty)}] ${percentage}%`;
};

// 🎨 Emoji mapping ตาม module/group สำหรับ Mobile App API
const MODULE_EMOJI: Record<string, string> = {
  "login-system": "🔑",
  "user-system": "👤",
  "attendance-system": "📋",
  "leave-system": "🏥",
  "server-system": "🖥️",
  "school-system": "🏫",
  "notification-system": "🔔",
  other: "🔧",
};

// 📋 สร้าง per-group result fields แบบ numbered list พร้อม emoji
// แต่ละ field = 1 group, ไม่เกิน 1024 ตัวอักษร
const buildGroupResultFields = (stats: AnalyzeResultOutput): DiscordField[] => {
  return Object.entries(stats.groupedResults).map(([groupKey, data]) => {
    const groupEmoji = MODULE_EMOJI[groupKey] ?? MODULE_EMOJI.other;
    const groupName =
      GROUP_LABELS[groupKey] ?? GROUP_LABELS.other ?? "ระบบอื่นๆ";
    const statusIcon = data.failed === 0 ? "🟢" : "🔴";

    const lines = data.items.map((item, idx) => {
      const isOk = ["200", "404"].includes(item.status);
      const itemEmoji = isOk ? "✅" : "❌";
      return `${String(idx + 1).padStart(2, " ")}. ${itemEmoji} ${
        item.name_th
      }`;
    });

    // ตัด value ให้ไม่เกิน 1024 ตัวอักษร (Discord limit)
    let value = lines.join("\n");
    if (value.length > 1020) value = value.slice(0, 1017) + "...";

    return {
      name: `${groupEmoji} ${statusIcon} ${groupName.replace(
        /^.*? /,
        "",
      )} — ผ่าน ${data.passed}/${data.items.length}`,
      value: `\`\`\`\n${value}\n\`\`\``,
      inline: false,
    };
  });
};

// 📈 วิเคราะห์ผลการตรวจสอบและจัดกลุ่มตาม module
export const analyzeHealthResults = (
  results: HealthCheckResult[],
): AnalyzeResultOutput => {
  const total = results.length;
  const passed = results.filter((r) => ["200", "404"].includes(r.status));
  const failed = results.filter((r) => !["200", "404"].includes(r.status));
  const healthScore =
    total === 0 ? 0 : Math.round((passed.length / total) * 100);

  const groupedResults: Record<string, GroupStat> = {};
  results.forEach((r) => {
    const groupKey = r.group || "other";
    if (!groupedResults[groupKey]) {
      groupedResults[groupKey] = { passed: 0, failed: 0, items: [] };
    }
    groupedResults[groupKey].items.push(r);
    if (["200", "404"].includes(r.status)) {
      groupedResults[groupKey].passed++;
    } else {
      groupedResults[groupKey].failed++;
    }
  });

  return { total, passed, failed, healthScore, groupedResults };
};

// 🔨 สร้าง Discord embed payload จากผลการวิเคราะห์
const buildDiscordPayload = (stats: AnalyzeResultOutput): DiscordPayload => {
  const isCritical = stats.failed.length > 0;
  const selectedTheme = isCritical ? THEMES.CRITICAL : THEMES.HEALTHY;

  const groupFields = buildGroupResultFields(stats);

  const mainEmbed: DiscordEmbed = {
    title: `${selectedTheme.icon} ${selectedTheme.title}`,
    description: `> **รายงานสถานะ Mobile App API ประจำวัน**\n> 📅 วันที่: \`${dayjs().format(
      "DD/MM/YYYY",
    )}\`\n> 🕐 เวลา: \`${dayjs().format("HH:mm น.")}\`\n\n${
      stats.healthScore === 100
        ? "**ยอดเยี่ยม!** ✨ ระบบทั้งหมดทำงานได้ตามปกติ"
        : `**แจ้งเตือน!** ⚠️ พบ ${stats.failed.length} จุดที่ต้องตรวจสอบ`
    }`,
    color: selectedTheme.color,
    thumbnail: { url: DISCORD_CONFIG.AVATAR_URL },
    image: { url: selectedTheme.image },
    fields: [
      {
        name: "📊 คะแนนความสมบูรณ์ของระบบ",
        value: `\`\`\`ini\n${buildProgressBar(stats.healthScore)}\n\`\`\``,
        inline: false,
      },
      {
        name: "📈 สรุปผลการตรวจสอบ",
        value: `> ✅ ผ่าน **${stats.passed.length}** รายการ\n> ❌ ล้มเหลว **${stats.failed.length}** รายการ\n> 📦 ทั้งหมด **${stats.total}** รายการ`,
        inline: false,
      },
      ...groupFields,
    ],
    footer: {
      text: "ระบบตรวจสอบสถานะอัตโนมัติ SchoolBright | ทีม Monitoring",
      icon_url: DISCORD_CONFIG.AVATAR_URL,
    },
    timestamp: new Date().toISOString(),
  };

  const embeds: DiscordEmbed[] = [mainEmbed];

  if (isCritical) {
    Object.entries(stats.groupedResults).forEach(([groupKey, data]) => {
      if (data.failed === 0) return;
      const groupName =
        GROUP_LABELS[groupKey] ?? GROUP_LABELS.other ?? "ระบบอื่นๆ";
      const failedItems = data.items.filter(
        (item) => !["200", "404"].includes(item.status),
      );
      embeds.push({
        title: `💥 [ERROR] รายละเอียดปัญหา: ${groupName}`,
        description: `พบข้อผิดพลาดจำนวน ${data.failed} รายการในกลุ่มนี้`,
        color: 0xed4245,
        fields: failedItems.map(
          (item): DiscordField => ({
            name: `❌ [FAIL] ${item.name_th} (${item.module})`,
            value: `**สถานะ:** \`${item.status}\`\n**จุดเชื่อมต่อ:** \`${item.service}\`\n**คำสั่งตรวจสอบ:**\n\`\`\`bash\n${item.curl}\n\`\`\``,
            inline: false,
          }),
        ),
      });
    });

    return {
      username: DISCORD_CONFIG.BOT_NAME,
      avatar_url: DISCORD_CONFIG.AVATAR_URL,
      content: `# 🆘 แจ้งเตือนวิกฤต!\nเรียน ${DISCORD_CONFIG.ALERT_USER_ID} พบความผิดปกติของระบบจำนวน ${stats.failed.length} จุด กรุณาตรวจสอบด่วน! 🔥`,
      embeds,
    };
  }

  return {
    username: DISCORD_CONFIG.BOT_NAME,
    avatar_url: DISCORD_CONFIG.AVATAR_URL,
    embeds,
  };
};

// 📣 ส่ง Webhook แจ้งผลการตรวจสอบไปยัง Discord Channel — ส่งเฉพาะเมื่อมี API ล้มเหลวเท่านั้น
export const sendDiscordNotificationService = async (
  results: HealthCheckResult[],
): Promise<void> => {
  if (!DISCORD_CONFIG.WEBHOOK_URL) {
    console.error("❌ [health-check-service] Discord Webhook URL is missing");
    return;
  }

  const stats = analyzeHealthResults(results);

  // ถ้าทุก API ทำงานปกติ — log แล้วออก ไม่ยิง Webhook
  if (stats.failed.length === 0) {
    console.log(
      `✅ [health-check-service] ระบบปกติทั้งหมด ${stats.total} รายการ — ไม่ส่ง Discord`,
    );
    return;
  }

  const payload = buildDiscordPayload(stats);

  try {
    await axios.post(DISCORD_CONFIG.WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "❌ [health-check-service] Failed to send Discord webhook:",
      message,
    );
  }
};

// 🔍 รันการตรวจสอบสุขภาพระบบทุกจุดพร้อมกัน
export const executeHealthChecksService = async (): Promise<
  HealthCheckResult[]
> => {
  const loginResult = await checkLoginService();
  let freshToken = "";

  if (loginResult.status === "200" && loginResult.response?.token) {
    freshToken = String(loginResult.response.token);
  }

  const otherServicesResults = await Promise.all([
    checkVerificationService(freshToken),
    checkBroadcastHistoryService(freshToken),
    checkNotificationTodayService(freshToken),
    checkNotificationUnreadCountService(freshToken),
    checkGeneralUnreadCountService(freshToken),
    checkAcceptUnreadCountService(freshToken),
    checkNotificationService(freshToken),
    checkBannerService(freshToken),
    checkSystemBannerService(freshToken),
    checkSystemNotificationService(freshToken),
    checkFlagPoleAttendanceService(freshToken),
    checkFlagPoleScanService(freshToken),
    checkServerStatusService(),
    checkServerStatusV2Service(freshToken),
    checkFacialScanService(),
    checkGetSchoolListService(),
    checkPermissionService(freshToken),
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
};
