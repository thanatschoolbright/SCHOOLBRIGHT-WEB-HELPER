import { API_URL } from "@/services/api-url";
import axios from "axios";
import { generateCurlCommand } from "../../generate-curl.helper";
import { HealthCheckResult } from "../../health-check.type";

/**
 * ฟังก์ชันสำหรับตรวจสอบ "ระบบแจ้งเตือน จากทางสคูลไบรท์"
 * @param accessToken (Optional) JWT Token ของผู้ใช้งาน
 * @returns HealthCheckResult
 */
export async function checkSystemNotificationService(
  accessToken?: string,
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "";

  const SYSTEM_NOTIFICATION_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/message/System/Detail?Messageid=789&userid=1230336`,
    method: "GET",
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  let domain = "sbapi.schoolbright.co";
  try {
    domain = new URL(SYSTEM_NOTIFICATION_CONFIG.url).hostname;
  } catch {
    console.error("Invalid URL:", SYSTEM_NOTIFICATION_CONFIG.url);
  }

  const curlCommand = generateCurlCommand(SYSTEM_NOTIFICATION_CONFIG);

  const baseResult = {
    module: "notification",
    group: "notification-system",
    name_th: "ระบบแจ้งเตือนจากทาง SchoolBright",
    name_en: "SchoolBright System Notification Service",
    service: domain,
    curl: curlCommand,
    request: SYSTEM_NOTIFICATION_CONFIG,
  };

  try {
    const res = await axios(SYSTEM_NOTIFICATION_CONFIG);
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
