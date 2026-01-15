import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkFlagPoleAttendanceService(
  accessToken?: string
): Promise<HealthCheckResult> {
  // 1. กำหนด Token
  const targetToken =
    accessToken ?? process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "";

  // 2. Setup Config (Dynamic)
  const FLAGPOLE_ATTENDANCE_CONFIG = {
    // ดึงข้อมูลนักเรียนสำหรับเช็กชื่อหน้าเสาธง
    url: `${API_URL.PROD_SB_API_URL}/api/School/getstudent/849/50271`,
    method: "GET",
    headers: {
      // ใช้ Token ที่ได้รับมา
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(FLAGPOLE_ATTENDANCE_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(FLAGPOLE_ATTENDANCE_CONFIG);

  const baseResult = {
    module: "flagpole-attendance",
    group: "attendance-system",
    name_th: "ระบบเช็กชื่อหน้าเสาธง - ดึงข้อมูลนักเรียน",
    name_en: "Flag Pole Attendance - Get Student Data",
    service: domain,
    curl: curlCommand,
    request: FLAGPOLE_ATTENDANCE_CONFIG,
  };

  try {
    const res = await axios(FLAGPOLE_ATTENDANCE_CONFIG);
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
