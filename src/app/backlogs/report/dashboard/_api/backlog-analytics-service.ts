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

/**
 * ดึงข้อมูล Timeline การส่งต่องาน (Issue Assignment History)
 * @param issueKey รหัสงาน เช่น SB-1234
 * @param space ชื่อพื้นที่ทำงานใน Backlog
 */
export const fetchIssueTimeline = async (issueKey: string, space: string) => {
  const response = await axios.get("/api/v1/backlog/issues/timeline", {
    params: { issueIdOrKey: issueKey, space },
  });
  return response.data;
};
