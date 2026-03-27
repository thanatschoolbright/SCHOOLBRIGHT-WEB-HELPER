import { callApiService as axios } from "@/services/axios-instance/sb-helper.axios";

const API_RANK_ENDPOINT = "/api/v1/timesheet/entry/check/summary-month";
const API_FIND_RANK_ENDPOINT = "/api/v1/timesheet/find-ranking";

/**
 * API Methods สำหรับจัดการข้อมูล Ranking (Pure Logic เท่านั้น)
 */
export const rankingApi = {
  /**
   * ดึงข้อมูลการจัดอันดับประจำเดือน (Request)
   * @param month เดือนที่ต้องการ (1-12)
   * @param year ปีที่ต้องการ (ค.ศ.)
   * @param adminId ID ของผู้ใช้งาน (ถ้ามี)
   */
  requestMonthlyRanking: async (
    month: string,
    year: string,
    adminId?: number,
  ) => {
    const endpoint = adminId ? API_FIND_RANK_ENDPOINT : API_RANK_ENDPOINT;
    const payload: any = { month, year };

    if (adminId) {
      payload.user_id = adminId;
    }

    const response = await axios.post(endpoint, payload);
    return response.data;
  },
};
