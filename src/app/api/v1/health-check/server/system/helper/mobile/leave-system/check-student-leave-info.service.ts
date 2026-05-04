import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkStudentLeaveInfoService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const LEAVE_INFO_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/studentLeave/GetLeaveInfo`,
    method: "GET",
    params: {
      UserId: "1230336",
    },
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(LEAVE_INFO_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(LEAVE_INFO_CONFIG);

  const baseResult = {
    module: "check-student-leave-info",
    group: "leave-system",
    name_th: "ระบบการลา - ตรวจสอบยอดคงเหลือการลา (Leave Balance)",
    name_en: "Leave System - Get Leave Info",
    service: domain,
    curl: curlCommand,
    request: LEAVE_INFO_CONFIG,
  };

  try {
    const res = await axios(LEAVE_INFO_CONFIG);
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
