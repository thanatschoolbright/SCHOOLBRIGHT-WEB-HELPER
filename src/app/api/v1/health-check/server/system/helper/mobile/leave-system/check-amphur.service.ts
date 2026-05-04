import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkAmphurService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const AMPHUR_CONFIG = {
    // เลข 1 ใน URL คือ Province ID (กรุงเทพมหานคร จากตัวอย่างก่อนหน้า)
    url: `${API_URL.PROD_SB_API_URL}/api/amphur/1`,
    method: "GET",
    params: {
      schoolid: "849",
    },
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(AMPHUR_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(AMPHUR_CONFIG);

  const baseResult = {
    module: "check-amphur",
    group: "leave-system",
    name_th: "ระบบการลา - ดึงข้อมูลอำเภอ/เขต (Get Amphur)",
    name_en: "Leave System - Get Amphur List",
    service: domain,
    curl: curlCommand,
    request: AMPHUR_CONFIG,
  };

  try {
    const res = await axios(AMPHUR_CONFIG);
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
