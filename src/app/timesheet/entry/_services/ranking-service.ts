import axios from "axios";

const API_RANK_ENDPOINT = "/api/v1/timesheet/entry/check/summary-month";
const API_FIND_RANK_ENDPOINT = "/api/v1/timesheet/find-ranking";

/**
 * ดึงข้อมูลการจัดอันดับประจำเดือน
 */
export const getMonthlyRanking = async (
  month: string, // M (1-12)
  year: string, // YYYY
  adminId?: number,
) => {
  const endpoint = adminId ? API_FIND_RANK_ENDPOINT : API_RANK_ENDPOINT;
  const payload: any = { month, year };

  if (adminId) {
    payload.user_id = adminId;
  }

  const response = await axios.post(endpoint, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};
