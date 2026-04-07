import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

/**
 * ดึง Roles ทั้งหมดพร้อม permissions
 */
export const responseAllRoles = async (search?: string) => {
  return await axios.get("/api/v2/admin/role-management/read", {
    params: { search },
  });
};

/**
 * ดึง Permissions ทั้งหมด
 */
export const responseAllPermissions = async () => {
  return await axios.get("/api/v2/admin/permission-management/read");
};

/**
 * สร้าง Role ใหม่
 */
export const requestCreateRole = async (payload: unknown) => {
  return await axios.post("/api/v2/admin/role-management/create", payload);
};

/**
 * อัปเดต Role
 */
export const requestUpdateRole = async (payload: unknown) => {
  return await axios.post("/api/v2/admin/role-management/update", payload);
};

/**
 * ลบ Role
 */
export const requestDeleteRole = async (id: number) => {
  return await axios.post("/api/v2/admin/role-management/delete", { id });
};

/**
 * Seed Permissions มาตรฐาน
 */
export const requestSeedPermissions = async (permissions: unknown[]) => {
  return await axios.post("/api/v2/admin/permission-management/seed", {
    permissions,
  });
};

/**
 * ลบ Permissions แบบกลุ่ม
 */
export const requestDeletePermissions = async (ids: number[]) => {
  return await axios.post("/api/v2/admin/permission-management/delete", {
    ids,
  });
};

/**
 * ลบ Permission เดี่ยว
 */
export const requestDeletePermission = async (id: number) => {
  return await axios.post("/api/v2/admin/permission-management/delete", { id });
};
