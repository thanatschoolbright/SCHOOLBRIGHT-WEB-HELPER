import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../health-check.type";
import { generateCurlCommand } from "../generate-curl.helper";

const FLAGPOLE_SCAN_CONFIG = {
  url: `${API_URL.PROD_SB_API_URL}/api/School/updatestatusjobscan/849/1230336`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "JabjaiKey-849-1230336": process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "",
  },
  data: {
    rootobject: [
      {
        UserId: 1321819,
        scanstatus: "0",
      },
    ],
  },
};

export async function checkFlagPoleScanService(): Promise<HealthCheckResult> {
  let domain = "localhost";
  try {
    domain = new URL(FLAGPOLE_SCAN_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(FLAGPOLE_SCAN_CONFIG);

  const baseResult = {
    module: "flagpole-scan",
    name_th: "ระบบเช็กชื่อหน้าเสาธง - แสกนข้อมูลนักเรียน (ส่งสถานะการเช็กชื่อ)",
    name_en: "Flag Pole Attendance - Update Scan Status",
    service: domain,
    curl: curlCommand,
    request: { ...FLAGPOLE_SCAN_CONFIG, body: FLAGPOLE_SCAN_CONFIG.data },
  };

  try {
    const res = await axios(FLAGPOLE_SCAN_CONFIG);
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
