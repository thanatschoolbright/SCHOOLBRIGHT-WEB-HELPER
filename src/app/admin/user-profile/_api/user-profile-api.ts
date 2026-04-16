import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

// ดึงข้อมูลพนักงานทั้งหมดที่มีในระบบ
export const responseAllUsers = async () => {
  return await axios.get("/api/v2/admin/user-management/read?limit=1000");
};

// ดึงข้อมูลตำแหน่งงานทั้งหมดที่มีในระบบ
export const responsePositions = async () => {
  return await axios.get("/api/v2/admin/position-management/read?limit=1000");
};

// ดึงข้อมูลแผนกทั้งหมดที่มีในระบบ
export const responseDepartments = async () => {
  return await axios.get("/api/v2/admin/department-management/read?limit=1000");
};

// ดึงค่า constants (roles) สำหรับหน้าจัดการผู้ใช้
export const responseUserConstants = async () => {
  return await axios.get("/api/v2/admin/user-management/constants");
};

// สร้างพนักงานใหม่ในระบบ
export const requestCreateNewUser = async (payload: unknown) => {
  return await axios.post("/api/v2/admin/user-management/create", payload);
};

// แก้ไขข้อมูลพนักงานที่มีอยู่แล้วตาม ID
export const requestUpdateUserByID = async (payload: unknown) => {
  return await axios.post("/api/v2/admin/user-management/update", payload);
};

// ลบข้อมูลพนักงานออกจากระบบ (Soft Delete)
export const requestDeleteUserByID = async (payload: unknown) => {
  return await axios.post("/api/v2/admin/user-management/delete", payload);
};

// ปลดล็อกบัญชีผู้ใช้งานที่ใส่รหัสผ่านผิดเกินกำหนด
export const requestUnlockUserByID = async (userAccountID: number) => {
  return await axios.post("/api/v2/admin/user-management/unlock", {
    id: userAccountID,
  });
};

// รีเซ็ตรหัสผ่านเดี่ยว (ส่งรหัสใหม่ไปอีเมล)
export const requestResetPasswordSingle = async (userId: number) => {
  return await axios.post("/api/v2/admin/user-management/reset-password", {
    userId,
  });
};

// รีเซ็ตรหัสผ่านแบบกลุ่ม (ส่งรหัสใหม่ไปอีเมลทุกคน)
export const requestResetPasswordBulk = async (userIds: React.Key[]) => {
  return await axios.post("/api/v2/admin/user-management/reset-password", {
    userIds,
  });
};

// รีเซ็ตรหัสผ่านเป็นเบอร์โทรศัพท์แบบกลุ่ม
export const requestResetPasswordToPhone = async (
  userIds: number[],
  adminId: number | string | undefined,
) => {
  return await axios.post(
    "/api/v2/admin/user-management/reset-password-to-phone",
    { userIds, adminId },
  );
};

// ปรับตำแหน่งแบบกลุ่ม
export const requestBulkUpdatePosition = async (payload: unknown) => {
  return await axios.post(
    "/api/v2/admin/user-management/bulk-update-position",
    payload,
  );
};

// ปรับแผนกแบบกลุ่ม
export const requestBulkUpdateDepartment = async (payload: unknown) => {
  return await axios.post(
    "/api/v2/admin/user-management/bulk-update-department",
    payload,
  );
};

// ปรับสิทธิ์แบบกลุ่ม
export const requestBulkUpdateRole = async (payload: unknown) => {
  return await axios.post(
    "/api/v2/admin/user-management/bulk-update-role",
    payload,
  );
};

// ปรับประเภทการจ้างงานแบบกลุ่ม
export const requestBulkUpdateEmploymentType = async (payload: unknown) => {
  return await axios.post(
    "/api/v2/admin/user-management/bulk-update-employment-type",
    payload,
  );
};

// Export ข้อมูลพนักงานเป็น Excel
export const responseExportUserExcel = async () => {
  return await axios.get("/api/v2/admin/user-management/export-excel", {
    responseType: "blob",
  });
};

// ดึง URL ลายเซ็นปัจจุบันของ user ตาม user_id
export const responseUserSignature = async (user_id: number) => {
  return await axios.get(
    `/api/v2/admin/user-management/signature/read?user_id=${user_id}`,
  );
};

// อัปโหลดลายเซ็นของ user ไปยัง OBS
export const requestUploadSignature = async (
  file: File,
  user_id: number,
  old_signature_path?: string,
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", String(user_id));
  if (old_signature_path) {
    formData.append("old_signature_path", old_signature_path);
  }
  return await axios.post(
    "/api/v2/admin/user-management/signature/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
};

// ลบลายเซ็นของ user ออกจาก OBS และฐานข้อมูล
export const requestDeleteSignature = async (
  user_id: number,
  signature_path: string,
) => {
  return await axios.delete("/api/v2/admin/user-management/signature/delete", {
    data: { user_id, signature_path },
  });
};

// จำเป็นต้อง import เพราะใช้ React.Key
import type React from "react";
