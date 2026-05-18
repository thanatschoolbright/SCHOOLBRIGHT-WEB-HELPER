import { API_URL } from "@/services/api-url";
import axios from "axios";
import { generateCurlCommand } from "../../generate-curl.helper";
import { HealthCheckResult } from "../../health-check.type";

// ตรวจสอบการดึงข้อมูลป้ายแบนเนอร์ของโรงเรียนในระบบแจ้งเตือน
export async function checkBannerService(
  accessToken?: string,
): Promise<HealthCheckResult> {
  const targetToken = accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const BANNER_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/systemnews/List`,
    method: "GET",
    params: {
      userId: "1230336",
      schoolId: "849",
    },
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  const domain = (() => {
    try {
      return new URL(BANNER_CONFIG.url).hostname;
    } catch {
      return "localhost";
    }
  })();

  const curlCommand = generateCurlCommand(BANNER_CONFIG);

  const baseResult = {
    module: "check-banner",
    group: "notification-system",
    name_th: "ดึงข้อมูลป้ายแบนเนอร์ ของโรงเรียน",
    name_en: "Notification System - Get School Banner",
    service: domain,
    curl: curlCommand,
    request: BANNER_CONFIG,
  };

  const startTime = performance.now();
  try {
    const response = await axios(BANNER_CONFIG);
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
