import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../health-check.type";
import { generateCurlCommand } from "../generate-curl.helper";

const VERIFICATION_CONFIG = {
  url: `${API_URL.PROD_SB_API_URL}/api/verification`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // แทนที่ Token ใน Header
    "JabjaiKey-849-1230336": process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "",
  },
  data: {
    // แทนที่ Token ใน Body (ตามที่เคยทำใน Step ก่อนหน้า)
    Token: process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "",
    UserID: 1400761,
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

export async function checkVerificationService(): Promise<HealthCheckResult> {
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
