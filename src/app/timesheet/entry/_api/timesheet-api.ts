import { callApiService as axios } from "@/services/axios-instance/sb-helper.axios";

/**
 * API Methods สำหรับจัดการข้อมูล Timesheet (Pure Logic เท่านั้น)
 */
export const timesheetApi = {
  /**
   * ดึงข้อมูลรายการ Timesheet ทั้งหมด (Request)
   * @param admin_id ID ของผู้ใช้งาน
   */
  requestTimesheetList: async (admin_id: number | undefined) => {
    const response = await axios.post(`/api/v1/timesheet/entry/read/`, {
      user_id: admin_id,
      limit: 100,
      page: 1,
    });
    return response.data;
  },

  /**
   * บันทึกหรือแก้ไขข้อมูล Timesheet (Request)
   * @param payload ข้อมูลที่ต้องการบันทึก
   */
  requestUpsertTimesheet: async (payload: any) => {
    const response = await axios.post(
      `/api/v1/timesheet/entry/insert/`,
      payload,
    );
    return response.data;
  },

  /**
   * ลบข้อมูลรายการ Timesheet (Request)
   * @param ids รายการ ID ที่ต้องการลบ
   * @param by ID ของผู้ลบ
   */
  requestDeleteTimesheet: async (ids: number[], by?: number) => {
    const response = await axios.post(`/api/v1/timesheet/entry/delete/`, {
      ids,
      by,
    });
    return response.data;
  },

  /**
   * ดึงข้อมูลโครงการทั้งหมด (Request)
   */
  requestProjectList: async () => {
    const response = await axios.post(`/api/v1/timesheet/project/read/`, {
      limit: 100,
      page: 1,
    });
    return response.data;
  },

  /**
   * ดึงข้อมูลโครงการย่อยของโครงการที่เลือก (Request)
   * @param project_id ID ของโครงการหลัก
   */
  requestSubProjectList: async (project_id: number) => {
    const response = await axios.post(
      `/api/v1/timesheet/project/sub-project/read/`,
      {
        project_id,
        limit: 100,
        page: 1,
      },
    );
    return response.data;
  },

  /**
   * ดึงข้อมูลสรุปรายสัปดาห์ (Request)
   * @param start_date วันเริ่มต้น (YYYY-MM-DD)
   * @param end_date วันสิ้นสุด (YYYY-MM-DD)
   */
  requestWeeklySummary: async (start_date: string, end_date: string) => {
    const response = await axios.post(
      `/api/v1/timesheet/entry/check/summary/`,
      {
        start_date,
        end_date,
      },
    );
    return response.data;
  },

  /**
   * ดึงข้อมูลสรุปรายเดือน (Request)
   * @param user_id ID ของผู้ใช้งาน
   * @param month เดือนที่ต้องการ (1-12)
   * @param year ปีที่ต้องการ (ค.ศ.)
   */
  requestCalculateMonthlySummary: async (
    user_id: number,
    month: number,
    year: number,
  ) => {
    const response = await axios.post(
      `/api/v1/timesheet/calculate-summary-month`,
      {
        user_id,
        month,
        year,
      },
    );
    return response.data;
  },
};
