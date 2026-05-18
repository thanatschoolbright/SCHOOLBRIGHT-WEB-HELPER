import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../../health-check.type";
// generateCurlCommand ไม่รองรับ multipart/form-data จึงสร้าง curl command แบบ manual แทน

export async function checkLeaveUploadService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const targetToken =
    accessToken ?? process.env.AUTHENTICATION_TOKEN ?? "";

  const formData = new FormData();
  const dummyFile = new Blob(["health-check-image"], { type: "image/png" });
  formData.append("files", dummyFile, "health-check.png");

  const UPLOAD_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/Upload/leave/849`,
    method: "POST",
    headers: {
      "JabjaiKey-849-1230336": targetToken,
      "Content-Type": "multipart/form-data",
    },
    data: formData,
  };

  let domain = "localhost";
  try {
    domain = new URL(UPLOAD_CONFIG.url).hostname;
  } catch {}

  const curlCommand = `curl --location '${UPLOAD_CONFIG.url}' \
--header 'JabjaiKey-849-1230336: ${targetToken}' \
--header 'Content-Type: multipart/form-data' \
--form 'files=@"health-check.png"'`;

  const baseResult = {
    module: "check-leave-upload",
    group: "leave-system",
    name_th: "ระบบการลา - แนบรูปภาพ (Upload Image)",
    name_en: "Leave System - Upload Image",
    service: domain,
    curl: curlCommand,
    request: {
      url: UPLOAD_CONFIG.url,
      method: UPLOAD_CONFIG.method,
      headers: {
        ...UPLOAD_CONFIG.headers,
        "Content-Type": "multipart/form-data",
      },
      body: "[FormData: health-check.png]",
    },
  };

  const startTime = performance.now();
  try {
    const res = await axios(UPLOAD_CONFIG);
    const response_time_ms = Math.round(performance.now() - startTime);
    return {
      ...baseResult,
      status: String(res.status),
      response: res.data || "Uploaded Successfully",
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
