import { API_URL } from "@/services/api-url";
import axios from "axios";
import { generateCurlCommand } from "../../generate-curl.helper";
import { HealthCheckResult } from "../../health-check.type";

// รับ accessToken เข้ามาเป็น Argument (Optional)
export async function checkNotificationService(
  accessToken?: string,
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const NOTIFICATION_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/message/Main/unread/1230336`,
    method: "GET",
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(NOTIFICATION_CONFIG.url).hostname;
  } catch {
    console.error("Invalid URL:", NOTIFICATION_CONFIG.url);
  }

  const curlCommand = generateCurlCommand(NOTIFICATION_CONFIG);

  const baseResult = {
    module: "notification",
    group: "notification-system",
    name_th: "ระบบแจ้งเตือนขวามือบนในแอป SB APP",
    name_en: "Notification Service (Top-Right)",
    service: domain,
    curl: curlCommand,
    request: NOTIFICATION_CONFIG,
  };

  const startTime = performance.now();
  try {
    const res = await axios(NOTIFICATION_CONFIG);
    const response_time_ms = Math.round(performance.now() - startTime);
    return {
      ...baseResult,
      status: String(res.status),
      response: res.data,
      response_time_ms,
    };
  } catch (error: any) {
    const response_time_ms = Math.round(performance.now() - startTime);
    return {
      ...baseResult,
      status: String(error.response?.status || 500),
      response: error.response?.data || error.message || "Unknown Error",
      response_time_ms,
    };
  }
}
