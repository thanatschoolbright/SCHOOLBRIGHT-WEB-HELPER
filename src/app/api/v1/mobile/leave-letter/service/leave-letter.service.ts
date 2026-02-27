import { convertToCurl } from "@/helpers/api/convert-to-curl";
import { API_URL } from "@/services/api-url";
import axios from "axios";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

/* Service สำหรับจัดการข้อมูลจดหมายลาหยุด (Leave Letter) */
export class LeaveLetterService {
  /* ดึงข้อมูลจดหมายลาหยุดจากระบบหลัก */
  static async getLeaveLetters(user_id: string, page: string, headers: any) {
    const apiUrl = `${API_URL.DEV_SB_API_URL}`;
    const endpoint = `/api/v2/internal/leave-letter?userId=${user_id}&page=${page}`;
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

  /* อัปเดต/แก้ไขสถานะจดหมายลาหยุด */
  static async updateLeaveStatus(
    letter_id: string,
    school_id: string,
    headers: any,
  ) {
    const apiUrl = `${API_URL.PROD_SB_API_URL}`;
    const endpoint = `/api/LeaveCalendar/update?letterid=${letter_id}&schooid=${school_id}`;
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
        message: error.message || "Failed to update leave status",
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  }
}
