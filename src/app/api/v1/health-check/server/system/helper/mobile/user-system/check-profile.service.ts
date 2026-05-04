import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkProfileService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const PROFILE_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/user`,
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
    domain = new URL(PROFILE_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(PROFILE_CONFIG);

  const baseResult = {
    module: "check-profile",
    group: "user-system",
    name_th: "ระบบข้อมูลผู้ใช้งาน - ดึงข้อมูลโปรไฟล์ (Mobile)",
    name_en: "User System - Get Profile",
    service: domain,
    curl: curlCommand,
    request: PROFILE_CONFIG,
  };

  try {
    const res = await axios(PROFILE_CONFIG);
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
