import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../health-check.type";
import { generateCurlCommand } from "../generate-curl.helper";

const NOTIFICATION_CONFIG = {
  // ใช้ ID 1230332 ตาม cURL ที่ให้มา (สามารถเปลี่ยนเป็น Test ID อื่นได้ถ้าจำเป็น)
  url: `${API_URL.PROD_SB_API_URL}/api/message/Main/unread/1230332`,
  method: "GET",
  headers: {
    // ใช้ Header Key ตาม cURL แต่ Value ดึงจาก ENV เพื่อความปลอดภัย
    "JabjaiKey-849-1230336": process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "",
  },
};

export async function checkNotificationService(): Promise<HealthCheckResult> {
  let domain = "localhost";
  try {
    domain = new URL(NOTIFICATION_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(NOTIFICATION_CONFIG);

  const baseResult = {
    module: "notification",
    name_th: "ระบบแจ้งเตือนขวามือบนในแอป SB APP",
    name_en: "Notification Service (Top-Right)",
    service: domain,
    curl: curlCommand,
    request: NOTIFICATION_CONFIG,
  };

  try {
    const res = await axios(NOTIFICATION_CONFIG);
    return {
      ...baseResult,
      status: String(res.status),
      response: res.data,
    };
  } catch (error: any) {
    return {
      ...baseResult,
      status: String(error.response?.status || 500),
      response: error.response?.data || error.message || "Unknown Error",
    };
  }
}
