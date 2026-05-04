import { API_URL } from "@/services/api-url";
import axios from "axios";
import { generateCurlCommand } from "../../generate-curl.helper";
import { HealthCheckResult } from "../../health-check.type";

/**
 * ตรวจสอบความพร้อมการใช้งาน Service: ดูการแจ้งเตือนวันนี้
 * @param accessToken (Optional) - สำหรับใช้ใน Header 'JabjaiKey-849-1230336'
 */
export async function checkNotificationTodayService(
  accessToken?: string,
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const NOTIFICATION_TODAY_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/Notification/today/1230336?page=1&lang=th`,
    method: "GET",
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(NOTIFICATION_TODAY_CONFIG.url).hostname;
  } catch {
    console.error("Invalid URL:", NOTIFICATION_TODAY_CONFIG.url);
  }

  const curlCommand = generateCurlCommand(NOTIFICATION_TODAY_CONFIG);

  const baseResult: HealthCheckResult = {
    module: "notification-today",
    group: "notification-system",
    name_th: "ระบบดูการแจ้งเตือนวันนี้",
    name_en: "Notification Today Service",
    service: domain,
    curl: curlCommand,
    request: NOTIFICATION_TODAY_CONFIG,
    status: "unknown",
    response: undefined,
  };

  try {
    const res = await axios(NOTIFICATION_TODAY_CONFIG);
    return {
      ...baseResult,
      status: String(res.status),
      response: res.data,
    };
  } catch (error: any) {
    console.error("[HealthCheck] Notification Today Error:", error.message);
    return {
      ...baseResult,
      status: String(error.response?.status || 500),
      response: error.response?.data || error.message || "Unknown Error",
    };
  }
}
