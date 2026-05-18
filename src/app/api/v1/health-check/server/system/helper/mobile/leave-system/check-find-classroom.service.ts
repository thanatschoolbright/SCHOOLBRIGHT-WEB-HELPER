import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkFindClassroomService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const CLASSROOM_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/findClassroom`,
    method: "GET",
    params: {
      userid: "1230336",
    },
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(CLASSROOM_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(CLASSROOM_CONFIG);

  const baseResult = {
    module: "check-find-classroom",
    group: "leave-system",
    name_th: "ระบบการลา - ดึงข้อมูลครูประจำชั้น (Get Homeroom Teacher)",
    name_en: "Leave System - Get Classroom/Teacher Info",
    service: domain,
    curl: curlCommand,
    request: CLASSROOM_CONFIG,
  };

  const startTime = performance.now();
  try {
    const res = await axios(CLASSROOM_CONFIG);
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
