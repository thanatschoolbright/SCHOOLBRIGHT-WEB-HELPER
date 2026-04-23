import axios from "axios";
import https from "https";
import { ReadLeaveManagementInput } from "../validation/leave-management-schema";

const agent = new https.Agent({ rejectUnauthorized: false });

/**
 * Service สำหรับจัดการการลาหยุด (Leave Management) ระดับ Admin
 * สำหรับติดต่อกับ Backend หลักของ SchoolBright
 */
export class LeaveManagementService {
  /**
   * ดึง Token สำหรับเข้าใช้งาน API
   */
  private static async getAuthToken() {
    const apiUrl = "https://apimobiledev.schoolbright.co";
    const loginEndpoint = "/api/login";

    try {
      const response = await axios.post(
        `${apiUrl}${loginEndpoint}?user=JJ00176&pass=-Lightdragon99&schoolid=39&imei=`,
        {},
        { httpsAgent: agent },
      );

      if (response.data && response.data.token) {
        return {
          token: response.data.token,
          userId: response.data.ID,
          schoolId: response.data.SchoolId,
        };
      }
      throw new Error("Login failed: Header token not found");
    } catch (error: any) {
      console.error("Login Error:", error.message);
      throw error;
    }
  }

  /**
   * ดึงรายการข้อมูลการลาทั้งหมด (Admin View)
   */
  static async findAll(params: ReadLeaveManagementInput, headers: any) {
    const { page, search, school_id } = params;

    const apiUrl = "https://apimobiledev.schoolbright.co";
    const endpoint = `/api/LeaveLetterList`;

    try {
      // 1. ดึง Token ใหม่ทุกครั้งที่เรียก (หรือจะทำ Cache ก็ได้)
      const auth = await this.getAuthToken();

      // 2. จัดการ Header ตามรูปแบบ JabjaiKey-{{school_id}}-{{user_id}} : {{token}}
      const customHeaders = {
        ...headers,
        [`JabjaiKey-${auth.schoolId}-${auth.userId}`]: auth.token,
      };

      // userid ต้องส่งเป็น format "id/page" ตามที่ระบุข้อมูลาล่าสุด
      const response = await axios.get(`${apiUrl}${endpoint}`, {
        params: {
          userid: `${search}/${page}`,
          schoolid: school_id || auth.schoolId,
        },
        headers: customHeaders,
        httpsAgent: agent,
      });

      return response.data;
    } catch (error: any) {
      throw {
        message: error.message || "Failed to fetch leave data",
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  }
}
