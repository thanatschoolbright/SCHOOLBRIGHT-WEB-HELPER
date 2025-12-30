import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../health-check.type";
import { generateCurlCommand } from "../generate-curl.helper";

export async function checkRefreshTokenService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "";

  const REFRESH_TOKEN_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/v1/tokens/refresh`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "JabjaiKey-849-1230336": targetToken,
    },
    data: {
      SchoolID: 849,
      OldToken: targetToken,
      sID: 1230336,
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(REFRESH_TOKEN_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(REFRESH_TOKEN_CONFIG);

  const baseResult = {
    module: "refresh-token",
    name_th: "ระบบยืนยันตัวตน - ต่ออายุการใช้งาน (Refresh Token)",
    name_en: "Authentication - Refresh Token",
    service: domain,
    curl: curlCommand,
    request: { ...REFRESH_TOKEN_CONFIG, body: REFRESH_TOKEN_CONFIG.data },
  };

  try {
    const res = await axios(REFRESH_TOKEN_CONFIG);
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
