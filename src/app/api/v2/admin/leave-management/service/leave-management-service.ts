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
    // เปลี่ยนมาใช้ GET params แทน URL query string string
    const loginUrl = `${apiUrl}${loginEndpoint}`;

    console.log("🚀 [Auth] Starting login process...");
    console.log(`🔗 [Auth] URL: ${loginUrl}`);

    try {
      // ลองเปลี่ยนจาก POST เป็น GET ตามโครงสร้าง API บางตัวของ SchoolBright
      const response = await axios.get(loginUrl, {
        params: {
          user: "JJ00176",
          pass: "-Lightdragon99",
          schoolid: 39,
          imei: "",
        },
        httpsAgent: agent,
      });

      console.log("✅ [Auth] Login Success");
      console.log(
        "📦 [Auth] Response Data:",
        JSON.stringify(response.data, null, 2),
      );

      if (response.data && response.data.token) {
        return {
          token: response.data.token,
          userId: response.data.ID,
          schoolId: response.data.SchoolId,
        };
      }
      throw new Error("Login failed: Token not found in response");
    } catch (error: any) {
      console.error("❌ [Auth] Login Error:", error.message);
      if (error.response) {
        console.error("📂 [Auth] Error Status:", error.response.status);
        console.error(
          "📂 [Auth] Error Data:",
          JSON.stringify(error.response.data, null, 2),
        );
      }
      throw error;
    }
  }

  /**
   * ดึงรายการข้อมูลการลาทั้งหมด (Admin View)
   */
  static async findAll(params: ReadLeaveManagementInput, headers: any) {
    const { userid, schoolid } = params;
    const apiUrl = "https://apimobiledev.schoolbright.co";
    const endpoint = `/api/LeaveLetterList`;

    console.log("🔍 [FindAll] Request Parameters:", {
      userid,
      schoolid,
    });

    try {
      // 1. ดึง Token
      const auth = await this.getAuthToken();

      // 2. จัดการ Header
      // ใช้ ID และ SchoolId จาก Auth (Login) ตาม cURL ล่าสุด
      const jabjaiKey = `JabjaiKey-${auth.schoolId}-${auth.userId}`;
      const customHeaders = {
        ...headers,
        [jabjaiKey]: auth.token,
      };

      console.log(`🔑 [FindAll] Header Key: ${jabjaiKey}`);

      // 3. ยิง API
      // ใช้ค่าที่ส่งมาจากหน้าบ้านโดยตรงตาม format id/page
      const requestParams = {
        userid: userid,
        schoolid: schoolid || auth.schoolId,
      };

      console.log("📡 [FindAll] Calling LeaveLetterList API...");
      console.log(`🔗 [FindAll] URL: ${apiUrl}${endpoint}`);
      console.log("📑 [FindAll] Final Query Params:", requestParams);

      const response = await axios.get(`${apiUrl}${endpoint}`, {
        params: requestParams,
        headers: customHeaders,
        httpsAgent: agent,
      });

      console.log("✅ [FindAll] API Success");

      const rawData = response.data;

      // ส่งข้อมูลกลับไปแบบ raw data หรือ map ตามความเหมาะสม
      // ในที่นี้เลือกส่งกลับแบบที่ Frontend จัดการต่อได้ง่าย
      return rawData;
    } catch (error: any) {
      console.error("❌ [FindAll] Fetch Error:", error.message);
      if (error.response) {
        console.error("📂 [FindAll] Error Status:", error.response.status);
        console.error(
          "📂 [Auth] Error Data:",
          JSON.stringify(error.response.data, null, 2),
        );
      }
      throw error;
    }
  }
}
