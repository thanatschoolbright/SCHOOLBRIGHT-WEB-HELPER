import { API_URL } from "@/services/api-url";
import axios from "axios";
import { generateCurlCommand } from "../../generate-curl.helper";
import { HealthCheckResult } from "../../health-check.type";

// ตรวจสอบหน้ากระดิ่งแท็บยังไม่ได้อ่านผ่าน API ประวัติการแจ้งเตือน
export async function checkBroadcastHistoryService(
  accessToken?: string,
): Promise<HealthCheckResult> {
  const targetToken = accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const BROADCAST_HISTORY_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/Message/General/history`,
    method: "GET",
    params: {
      UserId: "1230336",
      page: "1",
    },
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  const domain = (() => {
    try {
      return new URL(BROADCAST_HISTORY_CONFIG.url).hostname;
    } catch {
      return "localhost";
    }
  })();

  const curlCommand = generateCurlCommand(BROADCAST_HISTORY_CONFIG);

  const baseResult = {
    module: "broadcast-history",
    group: "notification-system",
    name_th: "หน้ากระดิ่งแท็บยังไม่ได้อ่าน",
    name_en: "Bell Unread Tab - Broadcast History",
    service: domain,
    curl: curlCommand,
    request: BROADCAST_HISTORY_CONFIG,
  };

  const startTime = performance.now();
  try {
    const response = await axios(BROADCAST_HISTORY_CONFIG);
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
