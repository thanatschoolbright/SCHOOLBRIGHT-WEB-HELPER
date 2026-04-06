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
  const { data } = await callApiService.get(
    "/api/v1/timesheet/department/list",
  );
  return data.status === 200 ? data.data : [];
};

// ส่งอีเมลแจ้งเตือนพนักงานที่ยังไม่กรอก/กรอกไม่ครบโดยตรงจาก DB
export const postEmployeeNotify = async (payload: {
  department_ids?: number[];
  date_label?: string;
  dry_run?: boolean;
}): Promise<any> => {
  const { data } = await callApiService.post(
    "/api/v1/timesheet/report/employee-notify",
    payload,
  );
  return data;
};

// ส่งอีเมลแจ้งเตือนพนักงาน 1 คน ใช้กับ one-by-one flow
export const postEmployeeNotifyOne = async (payload: {
  admin_id: number;
  date_label?: string;
}): Promise<any> => {
  const { data } = await callApiService.post(
    "/api/v1/timesheet/report/employee-notify-one",
    payload,
  );
  return data;
};

// ส่งการแจ้งเตือนไทม์ชีทประจำวันผ่าน Email และ Discord
export const postDailyNotify = async (payload: {
  records: any[];
  date_label: string;
  mode?: "all" | "email" | "discord";
  recipients?: string[];
}): Promise<any> => {
  const { data } = await callApiService.post(
    "/api/v1/timesheet/report/daily-notify",
    payload,
  );
  return data;
};
