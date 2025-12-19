import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "./health-check.type";
import { generateCurlCommand } from "./generate-curl.helper";

// Configuration สำหรับ Facial Scan (Direct Hardware API)
const FACIAL_SCAN_CONFIG = {
  // เปลี่ยน URL ไปยิง Hardware โดยตรง
  url: `${API_URL.PROD_HARDWARE_API_URL}/api/jobscan/TimeStamp`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // หมายเหตุ: หาก API นี้จำเป็นต้องใช้ 'JabjaiKey' หรือ 'Cookie' ในการ Auth
    // คุณอาจต้องเพิ่ม Header กลับเข้ามาตามความเหมาะสมของ Server ปลายทาง
  },
  data: {
    // เปลี่ยน Key ให้ตรงกับ cURL ใหม่ (PascalCase/camelCase)
    schoolId: "39",
    UserCode: "1233762",
    sID: "1233762",
    version: "1.2.5",
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
