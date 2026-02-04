import { convertToCurl } from "@/helpers/api/convert-to-curl";
import { API_URL } from "@/services/api-url";
import axios from "axios";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

/**
 * Service สำหรับจัดการข้อมูลจดหมายลาหยุด (Leave Letter)
 */
export class LeaveLetterService {
  /**
   * ดึงข้อมูลจดหมายลาหยุดจากระบบหลัก
   * @param user_id รหัสผู้ใช้
   * @param page ลำดับหน้า
   * @param headers headers ที่ใช้ในการ forward request
   */
  static async getLeaveLetters(user_id: string, page: string, headers: any) {
    const apiUrl = `${API_URL.PROD_SB_API_URL}`;
    // ⚠️ หมายเหตุ: รูปแบบ endpoint เดิมคือ ?userid=${user_id}/${page} ตามที่ได้รับมอบหมาย
    const endpoint = `/api/v2/internal/leave-letter?userid=${user_id}/${page}`;
    const callAPI = apiUrl + endpoint;
    const curlCommand = convertToCurl(apiUrl, endpoint);

    try {
      const response = await axios.get(callAPI, {
        headers,
        httpsAgent: agent,
      });

      return {
        data: response.data,
        curl: curlCommand,
        status: response.status,
      };
    } catch (error: any) {
      throw {
        message: error.message || "Failed to fetch from external API",
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  }
}
