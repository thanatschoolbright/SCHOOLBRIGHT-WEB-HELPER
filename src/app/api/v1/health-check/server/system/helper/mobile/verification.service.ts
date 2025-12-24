import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../health-check.type";
import { generateCurlCommand } from "../generate-curl.helper";

export async function checkVerificationService(
  accessToken?: string
): Promise<HealthCheckResult> {
  // 1. กำหนด Token: ใช้ Token ใหม่ที่ส่งมา (fresh) ถ้าไม่มีให้ใช้จาก ENV (fallback)
  const targetToken =
    accessToken ?? process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "";

  // 2. Setup Config (ย้ายเข้ามาข้างในเพื่อให้ Dynamic ตาม Token)
  const VERIFICATION_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/verification`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ใช้ Token ที่เลือกมา
      "JabjaiKey-849-1230336": targetToken,
    },
    data: {
      // ใช้ Token ที่เลือกมา
      Token: targetToken,
      UserID: 1230336,
      SchoolID: 849,
      Imei: "B1199AF3-36D9-416F-BB0D-4D334E3BE43B",
      IPAddress: "",
      Location: "test",
      model: "",
      System: "",
      Type: "",
      Mode: "",
      appVersion: "1",
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(VERIFICATION_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(VERIFICATION_CONFIG);

  const baseResult = {
    module: "verification",
    name_th: "ระบบยืนยันตัวตน",
    name_en: "Verification Service",
    service: domain,
    curl: curlCommand,
    request: { ...VERIFICATION_CONFIG, body: VERIFICATION_CONFIG.data },
  };

  try {
    const res = await axios(VERIFICATION_CONFIG);
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
