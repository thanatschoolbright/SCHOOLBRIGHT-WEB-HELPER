import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import { API_URL } from "@/services/api-url";
import axios, { AxiosError, type AxiosResponse } from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { performance } from "perf_hooks";
import type {
  RequestFn,
  ServerInfo,
  ServerResultInfo,
  TimedResult,
} from "../_validation/server-status-schema";

dayjs.locale("th");

// ✨ การตั้งค่า Discord Webhook สำหรับส่งแจ้งเตือนสถานะระบบ
const DISCORD_CONFIG = {
  WEBHOOK_URL:
    process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_DAILY_MONITOR_ALL_SERVER_ECS ?? "",
  ALERT_USER_ID: "<@1344189022561636445>",
  BOT_NAME: "SB System Monitor V2",
  AVATAR_URL:
    "https://play-lh.googleusercontent.com/5tMDW7qOj174fR8MVrUOC1xBRx6a8jYg97yYzMw0JwlcS13gazRD8J3HmumEhFi3aQ",
};

// ✨ ธีมสีและข้อความสำหรับ Discord Embed ตามสถานะระบบ
const THEMES = {
  HEALTHY: {
    color: 0x2ecc71,
    title: "ระบบทำงานปกติสมบูรณ์",
    icon: "",
    image: "https://img2.pic.in.th/pic/Google-Gemini.th.jpg",
  },
  CRITICAL: {
    color: 0xed4245,
    title: "ตรวจพบความผิดปกติของระบบ",
    icon: "",
    image: "https://img5.pic.in.th/file/secure-sv1/Bad_job.md.jpg",
  },
};

// ✨ ค่าคงที่สำหรับ HTTP client
const HEADERS = Object.freeze({ "Content-Type": "application/json" });
const REQUEST_TIMEOUT_MS = 10000;

// ✨ Axios instance สำหรับตรวจสอบสถานะ Server ภายนอก
const axiosClient = axios.create({
  headers: HEADERS,
  timeout: REQUEST_TIMEOUT_MS,
});

// ✨ แปลง status_code เป็นสถานะ Online/Offline
const responseStatus = (code?: number): "Online" | "Offline" =>
  code === 200 || code === 404 ? "Online" : "Offline";

// ✨ ประเมินระดับความรุนแรงของ response time
const severityLevel = (
  ok: boolean,
  responseTime: number,
): "low" | "medium" | "high" | "error" => {
  if (!ok) return "error";
  if (responseTime < 3) return "low";
  if (responseTime < 5) return "medium";
  return "high";
};

// ✨ แปลง performance.now() เป็นวินาที ทศนิยม 3 ตำแหน่ง
const toSeconds = (start: number): number =>
  Number(((performance.now() - start) / 1000).toFixed(3));

// ✨ สร้าง progress bar แบบ ASCII สำหรับแสดงใน Discord
const getProgressBar = (percentage: number): string => {
  const blocks = 10;
  const filled = Math.round((percentage / 100) * blocks);
  const empty = blocks - filled;
  return `[${"#".repeat(filled)}${"-".repeat(empty)}] ${String(percentage)}%`;
};

// ✨ วิเคราะห์ผลการตรวจสอบ Server ทั้งหมด คืนค่าสถิติสรุป
const analyzeResults = (results: ServerResultInfo[]) => {
  const total = results.length;
  const passed = results.filter((r) => r.status === "Online");
  const failed = results.filter((r) => r.status === "Offline");
  const healthScore =
    total === 0 ? 0 : Math.round((passed.length / total) * 100);
  return { total, passed, failed, healthScore };
};

// ✨ สร้าง payload สำหรับส่งไปยัง Discord Webhook พร้อม embed และการแจ้งเตือน
const buildDiscordPayload = (
  stats: ReturnType<typeof analyzeResults>,
  results: ServerResultInfo[],
) => {
  const isCritical = stats.failed.length > 0;
  const theme = isCritical ? THEMES.CRITICAL : THEMES.HEALTHY;

  const mainEmbed = {
    title: `${theme.icon} ${theme.title}`,
    description: `> 📊 **รายงานผลตรวจสอบสถานะเซิร์ฟเวอร์**\n> 📅 **วันที่:** \`${dayjs().format(
      "D MMMM YYYY",
    )}\` | ⏰ **เวลา:** \`${dayjs().format("HH:mm น.")}\`\n\n${
      stats.healthScore === 100
        ? "✨ **ยอดเยี่ยม!** ระบบทั้งหมดทำงานราบรื่น ไม่มีสะดุด"
        : "⚠️ **แจ้งเตือน!** ตรวจพบระบบขัดข้อง กรุณาตรวจสอบด่วน"
    }`,
    color: theme.color,
    thumbnail: { url: DISCORD_CONFIG.AVATAR_URL },
    image: { url: theme.image },
    fields: [
      {
        name: "🎯 **ความพร้อมของระบบ (System Health)**",
        value: `\`\`\`ini\n${getProgressBar(stats.healthScore)}\n\`\`\``,
        inline: false,
      },
      ...results.map((item) => {
        const isOnline = item.status === "Online";
        const statusIcon = isOnline ? "🟢 [PASS]" : "🔴 [FAIL]";
        return {
          name: `📌 ${item.server_name_th}`,
          value: `\`\`\`yaml\nStatus: ${statusIcon}\nTime:   ⏱️ ${String(item.response_time)}s\n\`\`\``,
          inline: false,
        };
      }),
    ],
    footer: {
      text: "⚡ SchoolBright Automated Monitoring",
      icon_url: DISCORD_CONFIG.AVATAR_URL,
    },
    timestamp: new Date().toISOString(),
  };

  const embeds: Record<string, unknown>[] = [mainEmbed];

  if (isCritical) {
    const fieldDetails = stats.failed.map((item) => ({
      name: `🚨 [FAIL] ${item.server_name_th} (${item.server})`,
      value: `**Status:** \`${String(item.status_code)}\`\n**Endpoint:** \`${
        item.endpoint || "-"
      }\`\n**Error:** \`${item.message ?? "ไม่สามารถเชื่อมต่อได้"}\``,
      inline: false,
    }));

    embeds.push({
      title: `🛠️ รายละเอียดปัญหา: พบจุดขัดข้อง ${String(stats.failed.length)} รายการ`,
      description: `รายการตรวจสอบการขัดข้องจากการเชื่อมต่อและเข้าถึงบริการ`,
      color: 0xed4245,
      fields: fieldDetails,
    });

    return {
      username: DISCORD_CONFIG.BOT_NAME,
      avatar_url: DISCORD_CONFIG.AVATAR_URL,
      content: `📢 **แจ้งเตือนความผิดปกติ!**\nทีมงาน ${DISCORD_CONFIG.ALERT_USER_ID} พบเซิร์ฟเวอร์ขัดข้องจำนวน **${String(stats.failed.length)}** จุด กรุณาตรวจสอบและดำเนินการแก้ไขด่วน!`,
      embeds,
    };
  }

  return {
    username: DISCORD_CONFIG.BOT_NAME,
    avatar_url: DISCORD_CONFIG.AVATAR_URL,
    embeds,
  };
};

// ✨ ส่งรายงานสถานะระบบไปยัง Discord Webhook
export async function sendDiscordNotification(
  results: ServerResultInfo[],
): Promise<void> {
  if (!DISCORD_CONFIG.WEBHOOK_URL) {
    console.error("Discord Webhook URL is missing");
    return;
  }
  const stats = analyzeResults(results);
  const payload = buildDiscordPayload(stats, results);
  try {
    await axios.post(DISCORD_CONFIG.WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error(
      "Failed to send Discord webhook",
      error instanceof Error ? error.message : String(error),
    );
  }
}

// ✨ Wrapper สำหรับวัดเวลา HTTP request พร้อมจัดการ error
async function timed<T>(fn: RequestFn<T>): Promise<TimedResult<T>> {
  const start = performance.now();
  try {
    const value = await fn();
    return { ok: true, value, response_time: toSeconds(start) };
  } catch (error: unknown) {
    return { ok: false, error, response_time: toSeconds(start) };
  }
}

// ✨ ดำเนินการตรวจสอบสถานะ Server ทุกตัวแบบขนาน (Parallel) และคืนผลรวม
export async function executeServerStatusChecks(): Promise<{
  timestamp: string;
  results: ServerResultInfo[];
}> {
  const timestamp = convertToThaiDateDDMMYYY(new Date().toISOString());

  const targets: { info: ServerInfo; fn: RequestFn }[] = [
    {
      info: {
        server: "SERVER_PROD_SBAPI",
        server_name: "SCHOOL BRIGHT MOBILE APPLICATION API",
        server_name_th: "1.ระบบหลังบ้าน SB App",
        server_name_en: "Backend Service for School Bright App",
        environment: "Production",
        url: API_URL.PROD_SB_API_URL,
        endpoint: "/api/SeverStatus",
        description:
          "เซิฟเวอร์ Production ระบบหลังบ้าน SB APP ที่พี่โจ้เป็นคนทำ เช่นระบบแจ้งเตือน,เช็คชื่อหน้าเสาธง,รายงาน เป็นต้น",
        timestamp,
      },
      fn: () => axiosClient.get(`${API_URL.PROD_SB_API_URL}/api/SeverStatus`),
    },
    {
      info: {
        server: "SERVER_PROD_HARDWARE",
        server_name: "SCHOOL BRIGHT HARDWARE API",
        server_name_th: "2.ระบบสแกนหน้า/แสกนบัตร",
        server_name_en: "Backend Service for Online Scan System",
        environment: "Production",
        url: API_URL.PROD_HARDWARE_API_URL,
        endpoint: "/api/application",
        description:
          "เซิฟเวอร์ Production ระบบหลังบ้าน SB HARDWARE API ที่พี่โจ้ เป็นคนทำ เช่น ระบบแสกนหน้าออนไลน์ , ออฟไลน์ เป็นต้น",
        timestamp,
      },
      fn: () =>
        axiosClient.get(`${API_URL.PROD_HARDWARE_API_URL}/api/application`),
    },
    {
      info: {
        server: "SERVER_PROD_PAYSB",
        server_name: "SCHOOL BRIGHT PAYMENT API",
        server_name_th: "3.ระบบจ่ายเงินโรงอาหาร",
        server_name_en: "Backend Service for Canteen Payment System",
        environment: "Production",
        url: API_URL.PROD_PAYMENT_API_URL,
        endpoint: "/api/device/status/registeronlinelogin",
        description:
          "เซิฟเวอร์ Production ระบบหลังบ้าน SB PAYMENT API ที่ Vimal เป็นคนทำ เช่น ระบบจ่ายเงินผ่านเครื่อง Canteen,ตัดยอดเงินออนไลน์,ตัดยอดเงินออฟไลน์ เป็นต้น",
        timestamp,
      },
      fn: () =>
        axiosClient.post(
          `${API_URL.PROD_PAYMENT_API_URL}/api/device/status/registeronlinelogin`,
          {},
        ),
    },
    {
      info: {
        server: "SERVER_PROD_CANTEEN_WEB",
        server_name: "SCHOOL BRIGHT CANTEEN WEB",
        server_name_th: "4.ระบบเว็บเติมเงิน",
        server_name_en: "Canteen Web System",
        environment: "Production",
        url: API_URL.PROD_CANTEEN_WEB_URL,
        endpoint: "/",
        description:
          "เซิฟเวอร์ Production ระบบเว็บโรงอาหาร ที่พี่ยู เป็นคนทำ เช่น  ระบบเว็บโรงอาหาร เป็นต้น",
        timestamp,
      },
      fn: () => axiosClient.get(API_URL.PROD_CANTEEN_WEB_URL),
    },
    {
      info: {
        server: "SERVER_PROD_PAYMENT_GATEWAY_API",
        server_name: "SCHOOL BRIGHT PAYMENT GATEWAY API",
        server_name_th: "5.ระบบเชื่อมต่อธนาคาร",
        server_name_en: "Payment Gateway API",
        environment: "Production",
        url: API_URL.PROD_PAYMENT_GATEWAY_API_URL,
        endpoint: "/",
        description:
          "เซิฟเวอร์ Production ระบบจ่ายเงินผ่านช่องทางธนาคาร ที่พี่ดีน เป็นคนทำ",
        timestamp,
      },
      fn: () => axiosClient.get(API_URL.PROD_PAYMENT_GATEWAY_API_URL),
    },
    {
      info: {
        server: "SERVER_PROD_ACCOUNTING_WEB",
        server_name: "SCHOOL BRIGHT ACCOUNTING WEB",
        server_name_th: "6.ระบบบัญชีโรงเรียน",
        server_name_en: "School Accounting System",
        environment: "Production",
        url: API_URL.PROD_ACCOUNTING_WEB_URL,
        endpoint: "/",
        description:
          "เซิฟเวอร์ Production ระบบบัญชีโรงเรียน ที่พี่ตั๊ก เป็นคนทำ เช่น ระบบบัญชีโรงเรียน, ระบบการเงินโรงเรียน เป็นต้น",
        timestamp,
      },
      fn: () => axiosClient.get(API_URL.PROD_ACCOUNTING_WEB_URL),
    },
    {
      info: {
        server: "SERVER_PROD_ACADEMIC_WEB",
        server_name: "SCHOOL BRIGHT ACADEMIC WEB",
        server_name_th: "7.ระบบวิชาการ",
        server_name_en: "Backend Service for Academic System",
        environment: "Production",
        url: API_URL.PROD_ACADEMIC_WEB_URL,
        endpoint: "/",
        description:
          "เซิฟเวอร์ Production ระบบบริการหลังบ้านสำหรับระบบการศึกษา ที่กริซนัน เป็นคนทำ เช่น  ระบบการศึกษา เป็นต้น",
        timestamp,
      },
      fn: () => axiosClient.get(API_URL.PROD_ACADEMIC_WEB_URL),
    },
    {
      info: {
        server: "SERVER_PROD_SCHOOLBUS_WEB",
        server_name: "SCHOOL BRIGHT SCHOOLBUS WEB",
        server_name_th: "8.ระบบรถบัสโรงเรียน",
        server_name_en: "Schoolbus Web System",
        environment: "Production",
        url: API_URL.PROD_SCHOOLBUS_WEB_URL,
        endpoint: "/",
        description:
          "เซิฟเวอร์ Production ระบบเว็บโรงอาหาร ที่คนจีน (Needman) เป็นคนทำ เช่น  ระบบเว็บโรงอาหาร เป็นต้น",
        timestamp,
      },
      fn: () => axiosClient.get(API_URL.PROD_SCHOOLBUS_WEB_URL),
    },
    {
      info: {
        server: "SERVER_PROD_LIBRARY_WEB",
        server_name: "SCHOOL BRIGHT LIBRARY WEB",
        server_name_th: "9.ระบบห้องสมุด",
        server_name_en: "Library Web System",
        environment: "Production",
        url: API_URL.PROD_LIBRARY_WEB_URL,
        endpoint: "/",
        description:
          "เซิฟเวอร์ Production ระบบเว็บห้องสมุด ที่คนจีน (Needman) เป็นคนทำ",
        timestamp,
      },
      fn: () => axiosClient.get(API_URL.PROD_LIBRARY_WEB_URL),
    },
    {
      info: {
        server: "SERVER_PROD_MARK_ACTIVITY_WEB",
        server_name: "SCHOOL BRIGHT MARK ACTIVITY WEB",
        server_name_th: "10.ระบบเช็คชื่อกิจกรรม",
        server_name_en: "Mark Activity Web System",
        environment: "Production",
        url: API_URL.PROD_MARK_ACTIVITY_WEB_URL,
        endpoint: "/ActivityManagement",
        description:
          "เซิฟเวอร์ Production ระบบเช็คชื่อกิจกรรม ที่คนจีน (Needman) เป็นคนทำ",
        timestamp,
      },
      fn: () =>
        axiosClient.get(
          `${API_URL.PROD_MARK_ACTIVITY_WEB_URL}/ActivityManagement`,
        ),
    },
    {
      info: {
        server: "SERVER_PROD_ALPHA_TUTOR_SYSTEM",
        server_name: "ALPHA TUTOR SYSTEM",
        server_name_th: "11.ระบบจัดการอัลฟาติวเตอร์",
        server_name_en: "Alpha Tutor Web System",
        environment: "Production",
        url: API_URL.PROD_MARK_ACTIVITY_WEB_URL,
        endpoint: "/ActivityManagement",
        description:
          "เซิฟเวอร์ Production ระบบเช็คชื่อกิจกรรม ที่คนจีน (Needman) เป็นคนทำ",
        timestamp,
      },
      fn: () =>
        axiosClient.get(
          `${API_URL.PROD_MARK_ACTIVITY_WEB_URL}/ActivityManagement`,
        ),
    },
    {
      info: {
        server: "SERVER_PROD_SYSTEM_WEB",
        server_name: "SCHOOL BRIGHT SYSTEM WEB",
        server_name_th: "12. ระบบข้อมูลบุคคล System",
        server_name_en: "System Web Service",
        environment: "Production",
        url: API_URL.PROD_SYSTEM_URL,
        endpoint: "/",
        description: `เซิฟเวอร์ Production สำหรับระบบข้อมูลบุคคล ในเว็บ ${API_URL.PROD_SYSTEM_URL}`,
        timestamp,
      },
      fn: () => axiosClient.get(API_URL.PROD_SYSTEM_URL),
    },
  ];

  // ✨ รันการตรวจสอบ Server ทุกตัวพร้อมกัน เพื่อลดเวลาการรอ
  const results = await Promise.all(
    targets.map(async (target) => {
      const result = await timed(target.fn);

      if (result.ok) {
        const response = result.value as AxiosResponse;
        return {
          ...target.info,
          status_code: response.status,
          status: responseStatus(response.status),
          response_time: result.response_time,
          response_time_severity_level: severityLevel(true, result.response_time),
        };
      }

      const error = result.error as AxiosError | Error;
      const isAxiosError = axios.isAxiosError(error);
      const isTimeout = isAxiosError && (error as AxiosError).code === "ECONNABORTED";
      const statusCode = isTimeout
        ? 0
        : isAxiosError
          ? ((error as AxiosError).response?.status ?? 500)
          : 500;

      return {
        ...target.info,
        status_code: statusCode,
        status: responseStatus(statusCode),
        message: isAxiosError
          ? isTimeout
            ? `Timeout ${String(REQUEST_TIMEOUT_MS / 1000)}s`
            : (error as AxiosError).message
          : (error as Error).message,
        response_time: result.response_time,
        response_time_severity_level: severityLevel(false, result.response_time),
      };
    }),
  );

  return { timestamp, results: results as ServerResultInfo[] };
}
