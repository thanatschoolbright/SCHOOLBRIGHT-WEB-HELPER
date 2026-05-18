import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

const LOGIN_CONFIG = {
  url: `${API_URL.PROD_SB_API_URL}/api/login`,
  method: "GET",
  params: {
    user: "2250",
    pass: "0",
    schoolid: "849",
    imei: "",
  },
  headers: {}, // ไม่ใส่ Cookie ตาม Requirement
};

export async function checkLoginService(): Promise<HealthCheckResult> {
  let domain = "localhost";
  try {
    domain = new URL(LOGIN_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(LOGIN_CONFIG);

  // สร้าง Base Object เพื่อลด Code ซ้ำใน try/catch
  const baseResult = {
    module: "login",
    group: "login-system",
    name_th: "ระบบเข้าสู่ระบบ",
    name_en: "Login Service",
    service: domain,
    curl: curlCommand,
    request: LOGIN_CONFIG,
  };

  const startTime = performance.now();
  try {
    const res = await axios(LOGIN_CONFIG);
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
