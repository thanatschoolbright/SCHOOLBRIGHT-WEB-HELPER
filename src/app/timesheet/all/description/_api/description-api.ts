import { callApiService } from "@/services/axios-instance/sb-helper.axios";

// ดึงข้อมูลรายงานการลงเวลาประจำวันตามช่วงวันที่และแผนก
export const responseTimesheetDailyReport = async (payload: {
  start_date: string;
  end_date: string;
  department_ids: number[];
}): Promise<any> => {
  const { data } = await callApiService.post(
    "/api/v1/timesheet/entry/check/summary",
    payload,
  );
  return data;
};

// ดึงรายชื่อแผนกทั้งหมด
export const responseDepartmentList = async (): Promise<any[]> => {
  const { data } = await callApiService.get("/api/v1/timesheet/department/list");
  return data.status === 200 ? data.data : [];
};
