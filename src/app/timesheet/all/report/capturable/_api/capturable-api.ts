import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

export interface CapturableSummary {
  totalProjects: number;
  totalHours: number;
  avgCapturable: number;
  avgUncapturable: number;
}

export interface ProjectStatDetail {
  feature_id: number | null;
  feature_name: string;
  is_deleted: boolean;
  asset_capture_type: string;
  hours: number;
  percent: number;
}

export interface CapturableData {
  project_id: number;
  project_code: string;
  project_name: string;
  is_deleted: boolean;
  capturable_percent: number;
  uncapturable_percent: number;
  capturable_hours: number;
  uncapturable_hours: number;
  hours: number;
  hours_percent: number;
  details: ProjectStatDetail[];
}

// ดึงข้อมูลสรุป Summary ของรายงาน Capturable
export const requestCapturableSummary = async (
  startDate: string,
  endDate: string,
): Promise<CapturableSummary> => {
  const response = await axios.post(
    "/api/v1/timesheet/report/capturable-report/summary",
    { start_date: startDate, end_date: endDate },
  );
  return response.data.data;
};

// ดึงข้อมูลรายละเอียดรายโครงการ
export const requestCapturableReport = async (
  startDate: string,
  endDate: string,
): Promise<CapturableData[]> => {
  const response = await axios.post(
    "/api/v1/timesheet/report/capturable-report",
    { start_date: startDate, end_date: endDate },
  );
  return response.data.data;
};

// ดึงข้อมูล Tracking รายละเอียดรายโครงการ
export const requestTrackingDetails = async (
  projectId: number,
  startDate: string,
  endDate: string,
): Promise<any[]> => {
  const response = await axios.post(
    "/api/v1/timesheet/report/capturable-details/read",
    { project_id: projectId, start_date: startDate, end_date: endDate },
  );
  return response.data.data;
};

export interface SendEmailResult {
  sent: number;
  failed: number;
  total_files: number;
  results: { email: string; success: boolean; error?: string }[];
}

// ส่ง Excel Capturable Report ทางอีเมล
export const requestSendCapturableEmail = async (
  startDate: string,
  endDate: string,
  recipients: string[],
): Promise<SendEmailResult> => {
  const response = await axios.post(
    "/api/v1/timesheet/report/capturable-report/send-email",
    { start_date: startDate, end_date: endDate, recipients },
  );
  return response.data.data;
};

// ส่งออกไฟล์ Excel รายงาน Capturable
export const requestExportExcel = async (
  startDate: string,
  endDate: string,
): Promise<Blob> => {
  const response = await axios.post(
    "/api/v1/timesheet/report/capturable-report/export-excel",
    { start_date: startDate, end_date: endDate },
    { responseType: "blob" },
  );
  return response.data;
};
