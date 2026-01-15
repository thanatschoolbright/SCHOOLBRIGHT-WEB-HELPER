import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
import { generateCurlCommand } from "../../generate-curl.helper";

export async function checkSubmitLeaveService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "";

  const payload = {
    UserId: 1230336,
    LeaveTypeID: 3421, // ใช้ ID 3421 (ลาป่วย) หรือเปลี่ยนตามต้องการ
    DayStart: "07/07/2025",
    DayEnd: "07/31/2025",
    Description: "ทดสอบการลา (Health Check)",
    HomeNumber: "44",
    Road: "สีลม",
    Tumbon: "",
    Aumpher: "บางรัก",
    Province: "กรุงเทพมหานคร",
    Phone: "0646356524",
    SubmitDate: "07/07/2025",
    Season: -1,
    fileUploads: [
      {
        FileType: "image/jpeg",
        FileURL:
          "https://leaveletter-system.obs.ap-southeast-2.myhuaweicloud.com/849/43bf57d3-4e4c-44b9-8b5d-2cf5680b9a3a.png",
      },
    ],
  };

  const SUBMIT_LEAVE_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/studentLeave`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "JabjaiKey-849-1230336": targetToken,
    },
    data: payload,
  };

  let domain = "localhost";
  try {
    domain = new URL(SUBMIT_LEAVE_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(SUBMIT_LEAVE_CONFIG);

  const baseResult = {
    module: "check-submit-leave",
    group: "leave-system",
    name_th: "ระบบการลา - ยืนยันการส่งใบลา (Submit Leave)",
    name_en: "Leave System - Submit Leave Form",
    service: domain,
    curl: curlCommand,
    request: SUBMIT_LEAVE_CONFIG,
  };

  try {
    const res = await axios(SUBMIT_LEAVE_CONFIG);
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
