import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { ApiResponse } from "../types/timesheet.types";

// ดึงข้อมูลสรุปการบันทึกเวลาตามช่วงวันที่และแผนก
export const responseTimesheetSummary = async (payload: {
  start_date: string;
  end_date: string;
  department_ids: number[];
}): Promise<ApiResponse> => {
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
