import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "./health-check.type";
import { generateCurlCommand } from "./generate-curl.helper";

const SERVER_STATUS_CONFIG = {
  url: `${API_URL.PROD_SB_API_URL}/api/SeverStatus`,
  method: "GET",
  headers: {}, // ลบ Cookie ออกเพื่อความปลอดภัย
};

export async function checkServerStatusService(): Promise<HealthCheckResult> {
  let domain = "localhost";
  try {
    domain = new URL(SERVER_STATUS_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(SERVER_STATUS_CONFIG);

  // สร้าง Base Object ลดการเขียนซ้ำ
  const baseResult = {
    module: "server-status-v1",
    name_th: "สถานะเซิร์ฟเวอร์หลัก",
    name_en: "Core API Server Status",
    service: domain,
    curl: curlCommand,
    request: SERVER_STATUS_CONFIG,
  };

  try {
    const res = await axios(SERVER_STATUS_CONFIG);
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
