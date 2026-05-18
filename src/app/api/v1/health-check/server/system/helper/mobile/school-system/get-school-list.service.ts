import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkGetSchoolListService(): Promise<HealthCheckResult> {
  // 1. Setup Config
  // หมายเหตุ: จาก cURL ที่ให้มา Endpoint นี้ไม่ต้องใช้ Token/Auth Header
  const GET_SCHOOL_LIST_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/school`,
    method: "GET",
    headers: {
      // ใส่ Header เพิ่มเติมได้ที่นี่หากจำเป็น (เช่น Cookie)
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(GET_SCHOOL_LIST_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(GET_SCHOOL_LIST_CONFIG);

  const baseResult = {
    module: "get-school-list",
    group: "school-system",
    name_th: "ดึงข้อมูล - โรงเรียนทั้งหมดแสดงผลในหน้าล็อกอิน",
    name_en: "Get School List (Login Page)",
    service: domain,
    curl: curlCommand,
    request: GET_SCHOOL_LIST_CONFIG,
  };

  const startTime = performance.now();
  try {
    const res = await axios(GET_SCHOOL_LIST_CONFIG);
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