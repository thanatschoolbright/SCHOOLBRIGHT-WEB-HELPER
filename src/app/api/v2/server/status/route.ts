import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError, AxiosResponse } from "axios";
import { API_URL } from "@/services/api-url";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import { performance } from "perf_hooks";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

interface TimedOk<T> {
  ok: true;
  value: T;
  response_time: number;
}
interface TimedErr {
  ok: false;
  error: unknown;
  response_time: number;
}
type TimedResult<T> = TimedOk<T> | TimedErr;

type RequestFn<T = AxiosResponse> = () => Promise<T>;

interface ServerInfo {
  server: string;
  server_name: string;
  server_name_th: string;
  server_name_en: string;
  environment: "Production" | "Staging" | "Development";
  url: string;
  endpoint: string;
  description: string;
  timestamp: string;
}

export type ServerResultInfo = ServerInfo & {
  status_code: number;
  status: "Online" | "Offline";
  message?: string;
  response_time: number;
  response_time_severity_level: "low" | "medium" | "high" | "error";
};

const DISCORD_CONFIG = {
  WEBHOOK_URL:
    process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_DAILY_MONITOR_ALL_SERVER_ECS ?? "",
  ALERT_USER_ID: "<@1344189022561636445>",
  BOT_NAME: "SB System Monitor V2",
  AVATAR_URL:
    "https://play-lh.googleusercontent.com/5tMDW7qOj174fR8MVrUOC1xBRx6a8jYg97yYzMw0JwlcS13gazRD8J3HmumEhFi3aQ",
};

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

const getProgressBar = (percentage: number) => {
  const blocks = 10;
  const filled = Math.round((percentage / 100) * blocks);
  const empty = blocks - filled;
  return `[${"#".repeat(filled)}${"-".repeat(empty)}] ${String(percentage)}%`;
};

const analyzeResults = (results: ServerResultInfo[]) => {
  const total = results.length;
  const passed = results.filter((r) => r.status === "Online");
  const failed = results.filter((r) => r.status === "Offline");
  const healthScore =
    total === 0 ? 0 : Math.round((passed.length / total) * 100);

  return { total, passed, failed, healthScore };
};

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
    const failedItems = stats.failed;

    const fieldDetails = failedItems.map((item) => ({
      name: `🚨 [FAIL] ${item.server_name_th} (${item.server})`,
      value: `**Status:** \`${String(item.status_code)}\`\n**Endpoint:** \`${
        item.endpoint || "-"
      }\`\n**Error:** \`${item.message ?? "ไม่สามารถเชื่อมต่อได้"}\``,
      inline: false,
    }));

    embeds.push({
      title: `🛠️ รายละเอียดปัญหา: พบจุดขัดข้อง ${String(failedItems.length)} รายการ`,
      description: `รายการตรวจสอบการขัดข้องจากการเชื่อมต่อและเข้าถึงบริการ`,
      color: 0xed4245,
      fields: fieldDetails,
    });

    const content = `📢 **แจ้งเตือนความผิดปกติ!**\nทีมงาน ${DISCORD_CONFIG.ALERT_USER_ID} พบเซิร์ฟเวอร์ขัดข้องจำนวน **${String(stats.failed.length)}** จุด กรุณาตรวจสอบและดำเนินการแก้ไขด่วน!`;
    return {
      username: DISCORD_CONFIG.BOT_NAME,
      avatar_url: DISCORD_CONFIG.AVATAR_URL,
      content,
      embeds,
    };
  }

  return {
    username: DISCORD_CONFIG.BOT_NAME,
    avatar_url: DISCORD_CONFIG.AVATAR_URL,
    embeds,
  };
};

async function sendDiscordNotification(results: ServerResultInfo[]) {
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

const HEADERS = Object.freeze({
  "Content-Type": "application/json",
});

const REQUEST_TIMEOUT_MS = 10000;

const axiosClient = axios.create({
  headers: HEADERS,
  timeout: REQUEST_TIMEOUT_MS,
});

const responseStatus = (code?: number) =>
  code === 200 || code === 404 ? "Online" : "Offline";

const severityLevel = (ok: boolean, responseTime: number) => {
  if (!ok) return "error";
  if (responseTime < 3) return "low";
  if (responseTime < 5) return "medium";
  return "high";
};

const toSeconds = (start: number) =>
  Number(((performance.now() - start) / 1000).toFixed(3));

async function timed<T>(fn: RequestFn<T>): Promise<TimedResult<T>> {
  const start = performance.now();
  try {
    const value = await fn();
    return {
      ok: true,
      value,
      response_time: toSeconds(start),
    };
  } catch (error: unknown) {
    return {
      ok: false,
      error,
      response_time: toSeconds(start),
    };
  }
}

async function executeServerStatusChecks(): Promise<{
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
      // NOTE: สำหรับ axios.post ให้ใส่ config (headers) เป็น argument ที่ 3
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
  ];

  const results = await Promise.all(
    targets.map(async (target) => {
      const result = await timed(target.fn);
      if (result.ok) {
        const response = result.value;
        return {
          ...target.info,
          status_code: response.status,
          status: responseStatus(response.status),
          response_time: result.response_time,
          response_time_severity_level: severityLevel(
            true,
            result.response_time,
          ),
        };
      }

      const error = result.error as AxiosError | Error;
      const isAxiosError = axios.isAxiosError(error);
      const isTimeout = isAxiosError && error.code === "ECONNABORTED";
      const statusCode = isTimeout
        ? 0
        : isAxiosError
          ? (error.response?.status ?? 500)
          : 500;
      return {
        ...target.info,
        status_code: statusCode,
        status: responseStatus(statusCode),
        message: isAxiosError
          ? isTimeout
            ? `Timeout ${String(REQUEST_TIMEOUT_MS / 1000)}s`
            : error.message
          : error.message,
        response_time: result.response_time,
        response_time_severity_level: severityLevel(
          false,
          result.response_time,
        ),
      };
    }),
  );

  return { timestamp, results: results as ServerResultInfo[] };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shouldNotifyDiscord = searchParams.get("mode") === "discord";

    const { timestamp, results } = await executeServerStatusChecks();

    if (shouldNotifyDiscord) {
      await sendDiscordNotification(results);
    }

    return NextResponse.json(
      {
        timestamp,
        data: results,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  } catch (err: unknown) {
    const isAxiosError = axios.isAxiosError(err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    const status = isAxiosError
      ? ((err as AxiosError).response?.status ?? 500)
      : 500;

    return NextResponse.json(
      {
        message,
        status,
      },
      {
        status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const shouldNotifyDiscord = body.mode === "discord";

    const { timestamp, results } = await executeServerStatusChecks();

    if (shouldNotifyDiscord) {
      await sendDiscordNotification(results);
    }

    return NextResponse.json(
      {
        timestamp,
        data: results,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  } catch (err: unknown) {
    const isAxiosError = axios.isAxiosError(err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    const status = isAxiosError
      ? ((err as AxiosError).response?.status ?? 500)
      : 500;

    return NextResponse.json(
      {
        message,
        status,
      },
      {
        status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  }
}
