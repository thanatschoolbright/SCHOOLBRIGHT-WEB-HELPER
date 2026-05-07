import { callApiService } from "@/services/axios-instance/sb-helper.axios";

/**
 * ✨ ดึงข้อมูลรายการแอปพลิเคชันทั้งหมด
 */
export const getApplicationList = async () => {
  const response = await callApiService.get("/api/v1/hardware/canteen/application", {
    timeout: 10000,
  });
  return response.data;
};

/**
 * ✨ ดึงข้อมูลเวอร์ชันของแอปพลิเคชันตาม app_id
 */
export const getApplicationVersionByAppID = async (appId: string | number) => {
  const response = await callApiService.get(`/api/v1/hardware/canteen/version/${appId}`, {
    timeout: 10000,
  });
  return response.data;
};

/**
 * ✨ สร้างเวอร์ชันใหม่สำหรับแอปพลิเคชัน
 */
export const createApplicationVersion = async (formData: FormData) => {
  const response = await callApiService.post("/api/v1/hardware/canteen/create", formData, {
    timeout: 15000,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * ✨ อัปเดตข้อมูลเวอร์ชันที่มีอยู่
 */
export const updateApplicationVersion = async (formData: FormData, versionId: string | number) => {
  const response = await callApiService.post(`/api/v1/hardware/canteen/update?version_id=${versionId}`, formData, {
    timeout: 15000,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * ✨ ลบเวอร์ชันตาม version_id
 */
export const deleteApplicationVersion = async (versionId: string | number) => {
  const response = await callApiService.post(`/api/v1/hardware/canteen/delete/${versionId}`, {}, {
    timeout: 10000,
  });
  return response.data;
};

/**
 * ✨ ตรวจสอบการอัปเดตแอปพลิเคชันสำหรับโรงเรียนที่ระบุ
 */
export const checkApplicationVersion = async (params: {
  app_id: string;
  version_name: string;
  school_id: string;
  current_ver?: string;
}) => {
  const response = await callApiService.get("/api/v1/hardware/canteen/check", {
    params: {
      app_id: params.app_id,
      version_name: params.version_name,
      SchoolID: params.school_id,
      current_ver: params.current_ver || "",
    },
    timeout: 10000,
  });
  return response.data;
};

/**
 * ✨ ดึงข้อมูลประวัติการทำรายการ (Excel Export Ready)
 */
export const getExportApplicationHistory = async (appId: string | number, appName: string) => {
  const response = await callApiService.get(
    `/api/v1/hardware/canteen/export?appId=${appId}&appName=${encodeURIComponent(appName)}`,
    { responseType: "blob", timeout: 20000 }
  );
  return response.data;
};
