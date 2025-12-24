import axios from "axios";
import { API_URL } from "@/services/api-url";
import { HealthCheckResult } from "../health-check.type";
import { generateCurlCommand } from "../generate-curl.helper";

// รับ accessToken เข้ามาเป็น Argument (Optional)
export async function checkNotificationService(
  accessToken?: string
): Promise<HealthCheckResult> {
  const NOTIFICATION_CONFIG = {
    url: `${API_URL.PROD_SB_API_URL}/api/message/Main/unread/1230332`,
    method: "GET",
    headers: {
      // 1. ถ้ามี accessToken ส่งมา ให้ใช้ตัวนั้น
      // 2. ถ้าไม่มี ให้กลับไปใช้จาก ENV (เผื่อกรณี Test แยกไฟล์)
      "JabjaiKey-849-1230336":
        accessToken ?? process.env.NEXT_PUBLIC_AUTHENTICATION_TOKEN ?? "",
    },
  };

  let domain = "localhost";
  try {
    domain = new URL(NOTIFICATION_CONFIG.url).hostname;
  } catch {}

  const curlCommand = generateCurlCommand(NOTIFICATION_CONFIG);

  const baseResult = {
    module: "notification",
    name_th: "ระบบแจ้งเตือนขวามือบนในแอป SB APP",
    name_en: "Notification Service (Top-Right)",
    service: domain,
    curl: curlCommand,
    request: NOTIFICATION_CONFIG,
  };

  try {
    const res = await axios(NOTIFICATION_CONFIG);
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
