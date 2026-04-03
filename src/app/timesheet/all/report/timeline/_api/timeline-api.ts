// ✨ API Methods สำหรับ Project Timeline Chart
import axios from "axios";

export interface TimelineChartParams {
  start_date?: string;
  end_date?: string;
  project_id?: number | null;
  group_id?: number | null;
  status_id?: number | null;
  category_type?: string | null;
  approval?: string | null;
  sub_status_id?: number | null;
  has_sub_projects?: boolean | null;
  search?: string | null;
}

/**
 * ✨ ดึงข้อมูล Project Timeline จาก API
 */
export const requestTimelineChartData = async (params: TimelineChartParams) => {
  // ลบค่า null/undefined ออกก่อนส่ง
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  const response = await axios.get(
    "/api/v1/timesheet/report/timeline-chart/read",
    { params: cleanParams },
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
 * ✨ ดึงรายการโครงการทั้งหมด (สำหรับ Dropdown)
 */
export const requestProjectList = async () => {
  const response = await axios.post("/api/v1/timesheet/project/read", {
    limit: 500,
    page: 1,
  });
  return response.data;
};

/**
 * ✨ ดึงรายการกลุ่มโครงการทั้งหมด (สำหรับ Dropdown)
 */
export const requestGroupList = async () => {
  const response = await axios.get(
    "/api/v1/timesheet/report/timeline-chart/groups/read",
  );
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
