import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

/**
 * ดึงรายการข้อมูลการลา (Server-side Pagination & Search)
 */
export const responseLeaveList = async (params: {
  userid: string;
  schoolid?: string | number;
}) => {
  return await axios.get("/api/v2/admin/leave-management/read", {
    params,
  });
};

/**
 * อนุมัติหรือไม่อนุมัติใบลา
 * approve = "1" คืออนุมัติ, approve = "0" คือไม่อนุมัติ
 * userid ไม่ต้องส่งมา — service จะใช้ auth.userId จากการ Login แทน
 */
export const requestConfirmLeave = async (payload: {
  letter_id: number;
  school_id: number;
  approve: "0" | "1";
  message?: string;
}) => {
  return await axios.post("/api/v2/admin/leave-management/approve", payload);
};
