import { API_URL } from "@/services/api-url";
import axios from "axios";
import { generateCurlCommand } from "../../generate-curl.helper";
import { HealthCheckResult } from "../../health-check.type";

// ตรวจสอบการนับจำนวนข้อความทั่วไปที่ยังไม่อ่าน
export async function checkGeneralUnreadCountService(
  accessToken?: string,
): Promise<HealthCheckResult> {
  const targetToken = accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const GENERAL_UNREAD_COUNT_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/message/General/unread`,
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
      return new URL(GENERAL_UNREAD_COUNT_CONFIG.url).hostname;
    } catch {
      return "localhost";
    }
  })();

  const curlCommand = generateCurlCommand(GENERAL_UNREAD_COUNT_CONFIG);

  const baseResult: HealthCheckResult = {
    module: "general-unread-count",
    group: "notification-system",
    name_th: "ระบบนับจำนวนข้อความทั่วไปที่ยังไม่อ่าน",
    name_en: "General Message Unread Count",
    service: domain,
    curl: curlCommand,
    request: GENERAL_UNREAD_COUNT_CONFIG,
    status: "unknown",
    response: null,
    response_time_ms: 0,
  };

  const startTime = performance.now();
  try {
    const response = await axios(GENERAL_UNREAD_COUNT_CONFIG);
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
