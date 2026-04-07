import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

// ดึง Roles ทั้งหมดพร้อม permissions ที่ assign อยู่
export const responseAllRoles = async () => {
  return await axios.get("/api/v2/admin/role-management/read");
};

// ดึง Permissions ทั้งหมดในระบบ
export const responseAllPermissions = async () => {
  return await axios.get("/api/v2/admin/permission-management/read");
};

// อัปเดต permissions ของ role (ส่ง permission_ids ทั้งชุด)
export const requestUpdateRolePermissions = async (
  roleId: number,
  permissionIds: number[],
) => {
  return await axios.post("/api/v2/admin/role-management/update", {
    id: roleId,
    permission_ids: permissionIds,
  });
};

// สร้าง Role ใหม่
export const requestCreateRole = async (payload: {
  role_name: string;
  description?: string;
  permission_ids?: number[];
}) => {
  return await axios.post("/api/v2/admin/role-management/create", payload);
};

// ลบ Role (Soft Delete)
export const requestDeleteRole = async (roleId: number) => {
  return await axios.post("/api/v2/admin/role-management/delete", {
    id: roleId,
  });
};
