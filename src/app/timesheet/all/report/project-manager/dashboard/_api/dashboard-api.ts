import { callApiService } from "@/services/axios-instance/sb-helper.axios";

/**
 * ✨ ดึงข้อมูลรายงาน Dashboard สำหรับ Project Manager
 * @param start_date วันที่เริ่มต้น (YYYY-MM-DD)
 * @param end_date วันที่สิ้นสุด (YYYY-MM-DD)
 */
export const requestPMDashboardReport = async (
  start_date: string,
  end_date: string,
) => {
  const response = await callApiService.get(
    `/api/v1/timesheet/report/project-manager/dashboard?start_date=${start_date}&end_date=${end_date}`,
  );
  return response;
};
