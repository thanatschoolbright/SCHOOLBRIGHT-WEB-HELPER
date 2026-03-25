import { API_URL } from "@/services/api-url";
import axios from "axios";
import { generateCurlCommand } from "../../generate-curl.helper";
import { HealthCheckResult } from "../../health-check.type";

/**
 * ตรวจสอบการนับจำนวนข้อความที่ยังไม่ได้อ่าน (System Unread Count)
 * @param accessToken (Optional) - สำหรับใช้ใน Header 'JabjaiKey-849-1230336'
 */
export async function checkNotificationUnreadCountService(
  accessToken?: string,
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "";

  const UNREAD_COUNT_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/message/System/unread?UserId=1230336`,
    method: "GET",
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(UNREAD_COUNT_CONFIG.url).hostname;
  } catch {
    console.error("Invalid URL:", UNREAD_COUNT_CONFIG.url);
  }

  const curlCommand = generateCurlCommand(UNREAD_COUNT_CONFIG);

  const baseResult: HealthCheckResult = {
    module: "notification-unread-count",
    group: "notification-system",
    name_th: "ระบบนับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน",
    name_en: "Notification System Unread Count",
    service: domain,
    curl: curlCommand,
    request: UNREAD_COUNT_CONFIG,
    status: "unknown",
    response: undefined,
  };

  try {
    const res = await axios(UNREAD_COUNT_CONFIG);
    return {
      ...baseResult,
      status: String(res.status),
      response: res.data,
    };
  } catch (error: any) {
    console.error(
      "[HealthCheck] Notification Unread Count Error:",
      error.message,
    );
    return {
      ...baseResult,
      status: String(error.response?.status || 500),
      response: error.response?.data || error.message || "Unknown Error",
    };
  }
}
