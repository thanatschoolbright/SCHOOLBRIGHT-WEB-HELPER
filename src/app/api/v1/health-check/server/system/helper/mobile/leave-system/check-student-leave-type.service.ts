import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkStudentLeaveTypeService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "";

  const LEAVE_TYPE_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/studentLeave/GetStudentLeaveType`,
    method: "GET",
    params: {
      schoolId: 1054,
    },
    headers: {
      "JabjaiKey-849-1230336": targetToken,
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(LEAVE_TYPE_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(LEAVE_TYPE_CONFIG);

  const baseResult = {
    module: "check-student-leave-type",
    group: "leave-system",
    name_th: "ระบบการลา - ตรวจสอบประเภทการลา (Student Leave Type)",
    name_en: "Leave System - Get Student Leave Type",
    service: domain,
    curl: curlCommand,
    request: LEAVE_TYPE_CONFIG,
  };

  try {
    const res = await axios(LEAVE_TYPE_CONFIG);
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
