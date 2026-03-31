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

// ✨ ธีมสีและรูปภาพสำหรับ Discord Embed ตามสถานะรวมของระบบ
const THEMES = {
  HEALTHY: {
    color: 0x00d26a,    // สีเขียวสด ✅
    banner: "https://img2.pic.in.th/pic/Google-Gemini.th.jpg",
  },
  DEGRADED: {
    color: 0xf5a623,    // สีส้ม ⚠️ (บางตัว offline)
    banner: "https://img5.pic.in.th/file/secure-sv1/Bad_job.md.jpg",
  },
  CRITICAL: {
    color: 0xff3b47,    // สีแดงสด 🚨 (หลายตัว offline)
    banner: "https://img5.pic.in.th/file/secure-sv1/Bad_job.md.jpg",
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

// ✨ สร้าง progress bar แบบ Emoji Block สำหรับแสดงความพร้อมระบบใน Discord
const getHealthBar = (percentage: number): string => {
  const total = 12;
  const filled = Math.round((percentage / 100) * total);
  const empty = total - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const color = percentage === 100 ? "🟩" : percentage >= 50 ? "🟨" : "🟥";
  return `${color} \`${bar}\` **${String(percentage)}%**`;
};

// ✨ แปลง severity level เป็น emoji และ label สำหรับแสดงความเร็ว response
const getSeverityLabel = (level: ServerResultInfo["response_time_severity_level"]): string => {
  switch (level) {
    case "low":    return "🚀 เร็วมาก";
    case "medium": return "⚡ ปกติ";
    case "high":   return "🐢 ช้า";
    case "error":  return "💀 ไม่ตอบสนอง";
  }
};

// ✨ วิเคราะห์ผลการตรวจสอบ Server ทั้งหมด คืนค่าสถิติสรุปและกลุ่มจำแนกตามความเร็ว
const analyzeResults = (results: ServerResultInfo[]) => {
  const total = results.length;
  const passed = results.filter((r) => r.status === "Online");
  const failed = results.filter((r) => r.status === "Offline");
  const healthScore =
    total === 0 ? 0 : Math.round((passed.length / total) * 100);

  const avgResponseTime =
    passed.length === 0
      ? 0
      : Number(
          (passed.reduce((sum, r) => sum + r.response_time, 0) / passed.length).toFixed(3),
        );

  const fastServers  = passed.filter((r) => r.response_time_severity_level === "low").length;
  const slowServers  = passed.filter((r) => r.response_time_severity_level === "high").length;

  return { total, passed, failed, healthScore, avgResponseTime, fastServers, slowServers };
};

// ✨ เลือก theme ตามระดับความรุนแรงของปัญหาที่พบ
const selectTheme = (stats: ReturnType<typeof analyzeResults>) => {
  if (stats.failed.length === 0)                        return THEMES.HEALTHY;
  if (stats.failed.length <= stats.total * 0.3)         return THEMES.DEGRADED;
  return THEMES.CRITICAL;
};

// ✨ สร้าง embed หลัก (Dashboard Overview) แสดงสรุปสถานะระบบทั้งหมด
const buildOverviewEmbed = (
  stats: ReturnType<typeof analyzeResults>,
  theme: typeof THEMES.HEALTHY,
): Record<string, unknown> => {
  const now = dayjs();
  const isCritical = stats.failed.length > 0;

  const statusHeadline = stats.healthScore === 100
    ? "## ✅ ระบบทั้งหมดออนไลน์และพร้อมใช้งาน"
    : stats.healthScore >= 70
    ? "## ⚠️ ระบบบางส่วนมีปัญหา กรุณาตรวจสอบ"
    : "## 🚨 ระบบหลายตัวขัดข้อง — ต้องการการแก้ไขด่วน";

  return {
    author: {
      name: "SchoolBright Infrastructure Monitor",
      icon_url: DISCORD_CONFIG.AVATAR_URL,
    },
    title: "📡  Server Health Report",
    description: [
      statusHeadline,
      "",
      `> 📅  **${now.format("dddd")}ที่** ${now.format("D MMMM YYYY")}  |  ⏰  \`${now.format("HH:mm:ss")} น.\``,
      "",
      "### 📊 สรุปภาพรวม",
      getHealthBar(stats.healthScore),
      "",
      `**🖥️  Server ทั้งหมด**  →  \`${String(stats.total)}\` ระบบ`,
      `**🟢  Online**  →  \`${String(stats.passed.length)}\` ระบบ` +
        (stats.fastServers > 0 ? `  *(🚀 เร็ว ${String(stats.fastServers)} ตัว)*` : ""),
      `**🔴  Offline**  →  \`${String(stats.failed.length)}\` ระบบ` +
        (stats.slowServers > 0 ? `  *(🐢 ช้า ${String(stats.slowServers)} ตัว)*` : ""),
      `**⏱️  Avg Response**  →  \`${String(stats.avgResponseTime)}s\``,
    ].join("\n"),
    color: theme.color,
    thumbnail: { url: DISCORD_CONFIG.AVATAR_URL },
    image: isCritical ? { url: theme.banner } : undefined,
    footer: {
      text: `SchoolBright Automated Monitor  •  ตรวจสอบทุก Server พร้อมกัน`,
      icon_url: DISCORD_CONFIG.AVATAR_URL,
    },
    timestamp: new Date().toISOString(),
  };
};

// ✨ สร้าง embed รายละเอียดสถานะ Server แบบ inline grid (สูงสุด 9 ตัวต่อ embed)
const buildServerGridEmbed = (
  items: ServerResultInfo[],
  embedIndex: number,
): Record<string, unknown> => {
  const fields = items.map((item) => {
    const isOnline = item.status === "Online";
    const statusDot = isOnline ? "🟢" : "🔴";
    const speedLabel = getSeverityLabel(item.response_time_severity_level);
    const responseDisplay = isOnline
      ? `\`${String(item.response_time)}s\`  ${speedLabel}`
      : `\`—\`  ${speedLabel}`;

    return {
      name: `${statusDot}  ${item.server_name_th}`,
      value: [
        `> **สถานะ:**  ${isOnline ? "**Online**" : "~~Offline~~"}  \`HTTP ${String(item.status_code)}\``,
        `> **ความเร็ว:**  ${responseDisplay}`,
        `> **Endpoint:**  \`${item.endpoint || "/"}\``,
      ].join("\n"),
      inline: true,
    };
  });

  return {
    title: embedIndex === 0 ? "🖥️  รายละเอียดสถานะ Server แต่ละระบบ" : "🖥️  (ต่อ)",
    color: 0x2b2d31,
    fields,
  };
};

// ✨ สร้าง embed แจ้งเตือนเจาะจงสำหรับ Server ที่ Offline พร้อมข้อมูล error
const buildCriticalEmbed = (
  failedItems: ServerResultInfo[],
): Record<string, unknown> => {
  const fields = failedItems.map((item) => ({
    name: `🚨  ${item.server_name_th}`,
    value: [
      `\`\`\`diff`,
      `- Server   : ${item.server}`,
      `- HTTP     : ${String(item.status_code)}`,
      `- Endpoint : ${item.endpoint || "/"}`,
      `- Error    : ${item.message ?? "Connection refused / Timeout"}`,
      `\`\`\``,
    ].join("\n"),
    inline: false,
  }));

  return {
    title: `🛑  พบ ${String(failedItems.length)} ระบบที่ไม่ตอบสนอง — ต้องการการดำเนินการทันที`,
    description:
      "รายการด้านล่างคือระบบที่ตรวจพบว่า **ไม่ออนไลน์** หรือ **ตอบสนองผิดปกติ**\nกรุณาตรวจสอบ Log และสถานะ Container/VM โดยด่วน",
    color: 0xff3b47,
    fields,
    footer: {
      text: "💡 ตรวจสอบ AWS ECS / PM2 / Docker logs เพื่อหาสาเหตุ",
    },
    timestamp: new Date().toISOString(),
  };
};

// ✨ จัดกลุ่ม Server ทีละ N ตัว สำหรับแบ่ง embed ไม่ให้เกิน field limit
const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// ✨ รวมทุก embed เข้าด้วยกันและสร้าง Discord webhook payload ฉบับสมบูรณ์
const buildDiscordPayload = (
  stats: ReturnType<typeof analyzeResults>,
  results: ServerResultInfo[],
): Record<string, unknown> => {
  const theme = selectTheme(stats);
  const isCritical = stats.failed.length > 0;

  // embed 1: Overview dashboard
  const overviewEmbed = buildOverviewEmbed(stats, theme);

  // embed 2..N: Server grid (max 9 inline fields per embed เพื่อให้แสดงเป็น 3 คอลัมน์)
  const serverChunks = chunkArray(results, 9);
  const serverEmbeds = serverChunks.map((chunk, idx) =>
    buildServerGridEmbed(chunk, idx),
  );

  // embed สุดท้าย (เฉพาะกรณีมี offline): Critical alert
  const criticalEmbed = isCritical
    ? buildCriticalEmbed(stats.failed)
    : null;

  // Discord รับสูงสุด 10 embeds ต่อ 1 message
  const embeds: Record<string, unknown>[] = [
    overviewEmbed,
    ...serverEmbeds,
    ...(criticalEmbed ? [criticalEmbed] : []),
  ].slice(0, 10);

  const content = isCritical
    ? [
        `## 🔔 แจ้งเตือนระบบขัดข้อง — ${DISCORD_CONFIG.ALERT_USER_ID}`,
        `พบ **${String(stats.failed.length)}** จาก **${String(stats.total)}** ระบบที่ไม่ตอบสนอง`,
        `เวลาที่ตรวจพบ: \`${dayjs().format("HH:mm:ss น.")}\` — กรุณาตรวจสอบทันที 🚨`,
      ].join("\n")
    : [
        `## 📋 รายงานสถานะประจำรอบ — \`${dayjs().format("HH:mm น.")}\``,
        `✅ ระบบทั้งหมด **${String(stats.total)}** ตัวทำงานปกติ  |  Avg \`${String(stats.avgResponseTime)}s\``,
      ].join("\n");

  return {
    username: DISCORD_CONFIG.BOT_NAME,
    avatar_url: DISCORD_CONFIG.AVATAR_URL,
    content,
    embeds,
  };
};

// ✨ ส่งรายงานสถานะระบบไปยัง Discord Webhook พร้อม embed ครบชุด
export async function sendDiscordNotification(
  results: ServerResultInfo[],
): Promise<void> {
  if (!DISCORD_CONFIG.WEBHOOK_URL) {
    console.error("[SB Monitor] Discord Webhook URL is missing — skipping notification");
    return;
  }

  const stats = analyzeResults(results);
  const payload = buildDiscordPayload(stats, results);

  try {
    await axios.post(DISCORD_CONFIG.WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
    console.info(
      `[SB Monitor] Discord notification sent — Health: ${String(stats.healthScore)}% | Online: ${String(stats.passed.length)}/${String(stats.total)}`,
    );
  } catch (error: unknown) {
    console.error(
      "[SB Monitor] Failed to send Discord webhook:",
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
