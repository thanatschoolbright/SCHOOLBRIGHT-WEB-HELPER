import { API_URL } from "@/services/api-url";
import axios from "axios";
import https from "https";
import {
  ApproveLeaveManagementInput,
  ReadLeaveManagementInput,
} from "../validation/leave-management-schema";

const agent = new https.Agent({ rejectUnauthorized: false });

/**
 * Service สำหรับจัดการการลาหยุด (Leave Management) ระดับ Admin
 * สำหรับติดต่อกับ Backend หลักของ SchoolBright
 */
export class LeaveManagementService {
  /**
   * ดึง Token สำหรับเข้าใช้งาน API พร้อม userId และ schoolId ที่ได้จากการ Login
   */
  private static async getAuthToken() {
    const apiUrl = API_URL.PROD_SB_API_URL;
    const loginEndpoint = "/api/login";
    const loginUrl = `${apiUrl}${loginEndpoint}`;

    const response = await axios.get(loginUrl, {
      params: {
        user: "JJ00176",
        pass: "-Lightdragon99",
        schoolid: 39,
        imei: "",
      },
      httpsAgent: agent,
    });

    if (response.data && response.data.token) {
      return {
        token: response.data.token,
        userId: response.data.ID,
        schoolId: response.data.SchoolId,
      };
    }
    throw new Error("Login failed: Token not found in response");
  }

  /**
   * ดึงรายการข้อมูลการลาทั้งหมด (Admin View)
   */
  static async findAll(
    params: ReadLeaveManagementInput,
    _headers: Record<string, string>,
  ) {
    const { userid, schoolid } = params;
    const apiUrl = "https://apimobiledev.schoolbright.co";
    const endpoint = `/api/LeaveLetterList`;

    const auth = await this.getAuthToken();

    const jabjaiKey = `JabjaiKey-${auth.schoolId}-${auth.userId}`;
    // ส่งเฉพาะ JabjaiKey เท่านั้น ห้าม forward headers จาก browser เพราะจะทำให้ cookie/host ผิดพลาด
    const customHeaders: Record<string, string> = {
      [jabjaiKey]: auth.token,
    };

    const requestParams = {
      userid: userid,
      schoolid: schoolid || auth.schoolId,
    };

    const response = await axios.get(`${apiUrl}${endpoint}`, {
      params: requestParams,
      headers: customHeaders,
      httpsAgent: agent,
    });

    return response.data;
  }

  /**
   * อนุมัติหรือไม่อนุมัติใบลาโดยอ้างอิงจาก letterId
   * approve = "1" คืออนุมัติ, approve = "0" คือไม่อนุมัติ
   */
  static async confirmLeave(
    params: ApproveLeaveManagementInput,
    _headers: Record<string, string>,
  ) {
    const apiUrl = "https://apimobiledev.schoolbright.co";
    const endpoint = "/api/confirmLeave";

    const auth = await this.getAuthToken();

    const jabjaiKey = `JabjaiKey-${auth.schoolId}-${auth.userId}`;
    // ส่งเฉพาะ JabjaiKey เท่านั้น ห้าม forward headers จาก browser
    const customHeaders: Record<string, string> = {
      [jabjaiKey]: auth.token,
    };

    const requestParams = {
      letterid: params.letter_id,
      // userid คือ admin ที่ทำการอนุมัติ ดึงจาก auth token โดยตรง
      userid: auth.userId,
      schoolid: params.school_id,
      approve: params.approve,
      message: params.message || "",
    };

    const response = await axios.get(`${apiUrl}${endpoint}`, {
      params: requestParams,
      headers: customHeaders,
      httpsAgent: agent,
    });

    return response.data;
  }
}
