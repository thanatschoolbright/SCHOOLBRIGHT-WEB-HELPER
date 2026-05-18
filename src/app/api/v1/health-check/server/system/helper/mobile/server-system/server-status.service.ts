import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

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
    group: "server-system",
    name_th: "สถานะเซิร์ฟเวอร์หลัก",
    name_en: "Core API Server Status",
    service: domain,
    curl: curlCommand,
    request: SERVER_STATUS_CONFIG,
  };

  const startTime = performance.now();
  try {
    const res = await axios(SERVER_STATUS_CONFIG);
    const response_time_ms = Math.round(performance.now() - startTime);
    return {
      ...baseResult,
      status: String(res.status),
      response: res.data,
      response_time_ms,
    };
  } catch (error: any) {
    const response_time_ms = Math.round(performance.now() - startTime);
    return {
      ...baseResult,
      status: String(error.response?.status || 500),
      response: error.response?.data || error.message || "Unknown Error",
      response_time_ms,
    };
  }
}
