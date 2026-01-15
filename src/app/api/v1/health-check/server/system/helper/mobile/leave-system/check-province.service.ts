import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkProvinceService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "";

  const PROVINCE_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/Province`,
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
    domain = new URL(PROVINCE_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(PROVINCE_CONFIG);

  const baseResult = {
    module: "check-province",
    group: "leave-system",
    name_th: "ระบบการลา - ดึงข้อมูลจังหวัด (Get Province)",
    name_en: "Leave System - Get Province List",
    service: domain,
    curl: curlCommand,
    request: PROVINCE_CONFIG,
  };

  try {
    const res = await axios(PROVINCE_CONFIG);
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
