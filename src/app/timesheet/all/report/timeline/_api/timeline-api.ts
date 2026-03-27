// ✨ API Methods สำหรับ Project Timeline Chart
import axios from "axios";

/**
 * ✨ ดึงข้อมูล Project Timeline จาก API
 */
export const requestTimelineChartData = async (params: {
  start_date?: string;
  end_date?: string;
  project_id?: number | null;
}) => {
  const response = await axios.get(
    "/api/v1/timesheet/report/timeline-chart/read",
    {
      params,
    },
  );
  return response.data;
};

/**
 * ✨ ดึงข้อมูลสถานะโครงการทั้งหมด
 */
export const requestProjectStatusList = async () => {
  const response = await axios.post("/api/v1/timesheet/project/status/read/");
  return response.data;
};

/**
 * ✨ บันทึกหรืออัปเดตข้อมูลโครงการย่อย
 */
export const requestUpsertSubProject = async (payload: any) => {
  const response = await axios.post(
    "/api/v1/timesheet/project/sub-project/insert",
    payload,
  );
  return response.data;
};
