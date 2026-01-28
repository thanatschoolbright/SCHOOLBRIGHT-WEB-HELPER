import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../health-check.type";
import { generateCurlCommand } from "../generate-curl.helper";

const FACIAL_SCAN_CONFIG = {
  url: `${API_URL.PROD_HARDWARE_API_URL}/api/jobscan/TimeStamp`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  data: {
    schoolId: "849",
    UserCode: "2250",
    sID: "2250",
    version: "9.9.9",
  },
};

export async function checkFacialScanService(): Promise<HealthCheckResult> {
  let domain = "localhost";
  try {
    domain = new URL(FACIAL_SCAN_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(FACIAL_SCAN_CONFIG);

  const baseResult = {
    module: "facial-scan",
    name_th: "ระบบสแกนใบหน้า (Hardware)",
    name_en: "Facial Scan Service",
    service: domain,
    curl: curlCommand,
    request: { ...FACIAL_SCAN_CONFIG, body: FACIAL_SCAN_CONFIG.data },
  };

  try {
    const res = await axios(FACIAL_SCAN_CONFIG);
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
