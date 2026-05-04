import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkSystemApiUrlsService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const API_URLS_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/device/system/apiurls`,
    method: "GET",
    params: {
      applicationtype: "all api",
    },
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(API_URLS_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(API_URLS_CONFIG);

  const baseResult = {
    module: "check-system-api-urls",
    group: "server-system",
    name_th: "ระบบเซ็ตค่า API เริ่มต้น - ดึงข้อมูล API URL ทั้งหมด",
    name_en: "Set API System - Get All API URLs",
    service: domain,
    curl: curlCommand,
    request: API_URLS_CONFIG,
  };

  try {
    const res = await axios(API_URLS_CONFIG);
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
