// ✨ API Methods สำหรับ Project Timeline Chart
import axios from "axios";

const API_PATH = "/api/v1/timesheet/report/timeline-chart/read";

export interface TimelineData {
  id: string;
  name: string;
  name_en?: string;
  start_date: string;
  end_date: string | null;
  status: string;
  status_name?: string;
  type: "project" | "feature";
  children?: TimelineData[];
}

export interface TimelineChartResponse {
  status_code: number;
  message_th: string;
  message_en: string;
  data: TimelineData[];
}

/**
 * ✨ ดึงข้อมูล Project Timeline จาก API
 * @param params { start_date, end_date, project_id }
 * @returns Promise<TimelineChartResponse>
 */
export const getTimelineChartData = async (params: {
  start_date?: string;
  end_date?: string;
  project_id?: number;
}) => {
  const response = await axios.get<TimelineChartResponse>(API_PATH, { params });
  return response.data;
};
