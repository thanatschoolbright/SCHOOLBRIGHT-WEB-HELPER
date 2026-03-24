import axios from "axios";

/**
 * Service สำหรับจัดการข้อมูลการทำงานล่วงเวลา (Overtime)
 */
export const overtimeService = {
  /**
   * ดึงข้อมูลรายการ OT ตาม ID และ User ID
   * @param id รหัสรายการ OT
   * @param requestId รหัสผู้ดึงข้อมูล (หรือผู้ยื่นคำขอ)
   */
  requestOvertimeItemByID: async (id: string, requestId: string) => {
    const response = await axios.post("/api/v1/timesheet/overtime/read", {
      id: String(id),
      request_id: String(requestId),
    });
    return response.data;
  },

  /**
   * ดึงข้อมูลรูปภาพและแปลงเป็น Base64
   * @param url URL ของรูปภาพ
   */
  fetchImageAsBase64: async (url: string): Promise<string> => {
    try {
      const fetchUrl = url.startsWith("/")
        ? url
        : `/api/v1/proxy/image?url=${encodeURIComponent(url)}`;
      const res = await fetch(fetchUrl);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Fetch image error:", error);
      return "";
    }
  },
};
