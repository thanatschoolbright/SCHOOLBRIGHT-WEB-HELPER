import { API_URL } from "@/services/api-url";
import axios from "axios";
import { generateCurlCommand } from "../../generate-curl.helper";
import { HealthCheckResult } from "../../health-check.type";

// ตรวจสอบการนับจำนวนข้อความตอบรับที่ยังไม่อ่าน
export async function checkAcceptUnreadCountService(
  accessToken?: string,
): Promise<HealthCheckResult> {
  const targetToken = accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const ACCEPT_UNREAD_COUNT_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/message/Appecpt/unread`,
    method: "GET",
    params: {
      UserId: "1230336",
    },
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  const domain = (() => {
    try {
      return new URL(ACCEPT_UNREAD_COUNT_CONFIG.url).hostname;
    } catch {
      return "localhost";
    }
  })();

  const curlCommand = generateCurlCommand(ACCEPT_UNREAD_COUNT_CONFIG);

  const baseResult: HealthCheckResult = {
    module: "accept-unread-count",
    group: "notification-system",
    name_th: "ระบบนับจำนวนข้อความตอบรับที่ยังไม่อ่าน",
    name_en: "Accept Message Unread Count",
    service: domain,
    curl: curlCommand,
    request: ACCEPT_UNREAD_COUNT_CONFIG,
    status: "unknown",
    response: null,
    response_time_ms: 0,
  };

  const startTime = performance.now();
  try {
    const response = await axios(ACCEPT_UNREAD_COUNT_CONFIG);
    const response_time_ms = Math.round(performance.now() - startTime);
    return {
      ...baseResult,
      status: String(response.status),
      response: (response.data as Record<string, unknown>) ?? null,
      response_time_ms,
    };
  } catch (error: unknown) {
    const response_time_ms = Math.round(performance.now() - startTime);

    if (axios.isAxiosError(error)) {
      return {
        ...baseResult,
        status: String(error.response?.status ?? 500),
        response: (error.response?.data as Record<string, unknown> | null) ?? {
          message: error.message,
        },
        response_time_ms,
      };
    }

    return {
      ...baseResult,
      status: "500",
      response: { message: "Unknown Error" },
      response_time_ms,
    };
  }
}
