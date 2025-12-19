import { API_URL } from "@/services/api-url";
import axios from "axios";
import { HealthCheckResult } from "./health-check.type";
import { generateCurlCommand } from "./generate-curl.helper"; // Import Helper เข้ามา

// Configuration สำหรับ Facial Scan
const FACIAL_SCAN_CONFIG = {
  url: `${API_URL.SB_HELPER_URL}/api/v1/hardware/facial/scan`,
  method: "POST",
  params: null,
  headers: {
    "Content-Type": "application/json",
  },
  data: {
    school_id: "39",
    user_code: "1233762",
    s_id: "1233762",
    version: "1.2.5",
  },
};

export async function checkFacialScanService(): Promise<HealthCheckResult> {
  let domain = "";
  try {
    domain = new URL(FACIAL_SCAN_CONFIG.url).hostname;
  } catch (e) {
    domain = "localhost";
  }

  // เรียกใช้ Function กลางจาก Helper
  const curlCommand = generateCurlCommand(FACIAL_SCAN_CONFIG);

  const requestInfo = {
    url: FACIAL_SCAN_CONFIG.url,
    method: FACIAL_SCAN_CONFIG.method,
    headers: FACIAL_SCAN_CONFIG.headers,
    body: FACIAL_SCAN_CONFIG.data,
  };

  try {
    const res = await axios({
      method: FACIAL_SCAN_CONFIG.method,
      url: FACIAL_SCAN_CONFIG.url,
      headers: FACIAL_SCAN_CONFIG.headers,
      data: FACIAL_SCAN_CONFIG.data,
      timeout: 10000, // Timeout 10s
    });

    return {
      module: "facial-scan",
      name_th: "ระบบสแกนใบหน้า (Hardware)",
      name_en: "Facial Scan Service",
      status: String(res.status),
      service: domain,
      curl: curlCommand,
      request: requestInfo,
      response: res.data,
    };
  } catch (error: any) {
    return {
      module: "facial-scan",
      name_th: "ระบบสแกนใบหน้า (Hardware)",
      name_en: "Facial Scan Service",
      status: String(error.response?.status || 500),
      service: domain,
      curl: curlCommand,
      request: requestInfo,
      response: error.response?.data || error.message || "Unknown Error",
    };
  }
}
