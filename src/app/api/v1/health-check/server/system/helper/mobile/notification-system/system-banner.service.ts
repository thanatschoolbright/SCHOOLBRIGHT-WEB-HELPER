import { API_URL } from "@/services/api-url";
import axios from "axios";
import { generateCurlCommand } from "../../generate-curl.helper";
import { HealthCheckResult } from "../../health-check.type";

// ตรวจสอบการดึงข้อมูลโฆษณาแบบป๊อปอัปสำหรับแสดงบนหน้าจอแอปมือถือ
export async function checkSystemBannerService(
  accessToken?: string,
): Promise<HealthCheckResult> {
  const targetToken = accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const SYSTEM_BANNER_CONFIG = {
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
      return new URL(SYSTEM_BANNER_CONFIG.url).hostname;
    } catch {
      return "localhost";
    }
  })();

  const curlCommand = generateCurlCommand(SYSTEM_BANNER_CONFIG);

  const baseResult = {
    module: "check-system-banner",
    group: "notification-system",
    name_th: "ดึง Ads Modal มาแสดงที่ Mobile Screen",
    name_en: "Notification System - Get Mobile Ads Modal",
    service: domain,
    curl: curlCommand,
    request: SYSTEM_BANNER_CONFIG,
  };

  const startTime = performance.now();
  try {
    const response = await axios(SYSTEM_BANNER_CONFIG);
    const response_time_ms = Math.round(performance.now() - startTime);

    const responseData =
      (response.data as Record<string, unknown> | null | undefined) ?? null;

    return {
      ...baseResult,
      status: String(response.status),
      response: responseData,
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
