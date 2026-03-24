import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

/**
 * ดึงข้อมูลรายละเอียดผู้ใช้งานตาม ID
 */
export const requestUserByID = async (userId: string) => {
  return await axios.get(`/api/v2/admin/user-management/detail/${userId}`);
};

/**
 * ดึงข้อมูลค่าคงที่ระดับสิทธิ์ (Roles)
 */
export const requestUserConstants = async () => {
  return await axios.get("/api/v2/admin/user-management/constants");
};

/**
 * ดึงข้อมูลตำแหน่ง (Positions)
 */
export const requestPositions = async () => {
  return await axios.get("/api/v2/admin/position-management/read?limit=1000");
};

/**
 * ดึงข้อมูลแผนก (Departments)
 */
export const requestDepartments = async () => {
  return await axios.get("/api/v2/admin/department-management/read?limit=1000");
};

/**
 * อัปเดตข้อมูลผู้ใช้งาน
 */
export const requestUpdateUser = async (payload: any) => {
  return await axios.post("/api/v2/admin/user-management/update", payload);
};
