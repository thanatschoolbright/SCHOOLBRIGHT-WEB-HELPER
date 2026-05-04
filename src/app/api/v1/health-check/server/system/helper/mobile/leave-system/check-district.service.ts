import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkDistrictService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const DISTRICT_CONFIG = {
    // เลข 4 ใน URL คือ Amphur ID (เขตบางรัก จากตัวอย่างก่อนหน้า)
    url: `${API_URL.PROD_SB_API_URL}/api/district/4`,
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
    domain = new URL(DISTRICT_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(DISTRICT_CONFIG);

  const baseResult = {
    module: "check-district",
    group: "leave-system",
    name_th: "ระบบการลา - ดึงข้อมูลแขวง/ตำบล (Get District)",
    name_en: "Leave System - Get District List",
    service: domain,
    curl: curlCommand,
    request: DISTRICT_CONFIG,
  };

  try {
    const res = await axios(DISTRICT_CONFIG);
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
