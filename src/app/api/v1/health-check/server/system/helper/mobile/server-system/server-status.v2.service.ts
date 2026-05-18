import { API_URL } from "@/services/api-url";
import axios from "axios";
import { generateCurlCommand } from "../../generate-curl.helper";
import { HealthCheckResult } from "../../health-check.type";

// ตรวจสอบสถานะเซิร์ฟเวอร์เวอร์ชัน 2 ของ Mobile API
export async function checkServerStatusV2Service(
  accessToken?: string,
): Promise<HealthCheckResult> {
  const targetToken = accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const SERVER_STATUS_V2_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/v2/SeverStatus`,
    method: "GET",
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  const domain = (() => {
    try {
      return new URL(SERVER_STATUS_V2_CONFIG.url).hostname;
    } catch {
      return "localhost";
    }
  })();

  const curlCommand = generateCurlCommand(SERVER_STATUS_V2_CONFIG);

  const baseResult = {
    module: "server-status-v2",
    group: "server-system",
    name_th: "สถานะเซิร์ฟเวอร์หลัก เวอร์ชัน 2",
    name_en: "Core API Server Status V2",
    service: domain,
    curl: curlCommand,
    request: SERVER_STATUS_V2_CONFIG,
  };

  const startTime = performance.now();
  try {
    const response = await axios(SERVER_STATUS_V2_CONFIG);
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
