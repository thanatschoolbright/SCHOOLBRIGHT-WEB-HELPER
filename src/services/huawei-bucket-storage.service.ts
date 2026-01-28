import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";

// file locate : src/services/huawei-bucket-storage.service.ts

/** ข้อมูลการเชื่อมต่อ Huawei Cloud Object Storage Service (OBS) */
export const HUAWEI_STORAGE = {
  OBS_BUCKET_URL: process.env.NEXT_PUBLIC_OBS_BUCKET_URL ?? "error",
  OBS_ENDPOINT: process.env.NEXT_PUBLIC_OBS_ENDPOINT ?? "error",
  OBS_DOMAIN: process.env.NEXT_PUBLIC_OBS_DOMAIN ?? "error",
  OBS_ACCOUNT_ID: process.env.NEXT_PUBLIC_OBS_ACCOUNT_ID ?? "error", // เพิ่มไว้กรณีต้องใช้ ID ในการระบุ Path
} as const;

export const HuaweiBucketStorageService = {
  /**
   * อัปโหลดรูปภาพโปรไฟล์ผู้ใช้งานไปยัง Huawei OBS
   * Path: profile_images/{employee_code}/img_{timestamp}.png
   */
  async requestUploadUserProfileImage(
    file: File,
    employee_code: string,
    old_image_path?: string,
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("employee_code", employee_code);
    if (old_image_path) {
      formData.append("old_image_path", old_image_path);
    }

    // เรียก API หลังบ้านเพื่อจัดการ Upload/Delete จริง (เพื่อความปลอดภัยของ Key)
    const response = await axios.post(
      "/api/v2/admin/user-management/upload/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data; // Expected { url: "..." } or { data: { url: "..." } }
  },

  /**
   * ลบไฟล์ออกจาก OBS (Cleanup Logic)
   */
  async deleteFile(path: string) {
    if (!path) return;
    try {
      await axios.post("/api/v2/admin/user-management/upload/delete", { path });
    } catch (error) {
      console.warn("Failed to delete old file:", path);
    }
  },
};
