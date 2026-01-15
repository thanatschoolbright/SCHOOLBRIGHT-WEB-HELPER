import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkEmailVerificationService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "";

  const VERIFY_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/user/CheckVerify`,
    method: "GET",
    params: {
      schoolID: "849",
      userID: "1230336",
      type: "email",
      mode: "compromise",
    },
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(VERIFY_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(VERIFY_CONFIG);

  const baseResult = {
    module: "check-email-verification",
    group: "user-system",
    name_th: "ระบบตรวจสอบช่องทางการยืนยันตัวตน (Email)",
    name_en: "User Verification - Check Email Channel",
    service: domain,
    curl: curlCommand,
    request: VERIFY_CONFIG,
  };

  try {
    const res = await axios(VERIFY_CONFIG);
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
