import axios from "axios";

/**
 * ดึงข้อมูลวิเคราะห์ประสิทธิภาพรายบุคคลจากระบบ Backlog
 * @param params { space: string, createdSince?: string, createdUntil?: string }
 */
export const fetchBacklogAnalytics = async (params: {
  space: string;
  createdSince?: string;
  createdUntil?: string;
}) => {
  const response = await axios.get("/api/v1/backlog/dashboard/analytics", {
    params,
  });
  return response.data;
};
