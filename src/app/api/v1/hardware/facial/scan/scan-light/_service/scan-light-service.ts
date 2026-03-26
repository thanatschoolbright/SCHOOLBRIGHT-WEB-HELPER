import { API_URL } from "@/services/api-url";
import axios from "axios";

/** 🎯 ฟังก์ชันแปลงรหัสสถานะเป็นข้อความภาษาไทยและสี (Internal Helper) */
const getAttendanceStatusInfo = (status: string | number) => {
  const s = String(status);
  if (["0", "7"].includes(s)) return { text: "มาตรงเวลา", color: "success" };
  if (s === "1") return { text: "มาสาย", color: "warning" };
  if (["3", "-3"].includes(s)) return { text: "ขาดเรียน", color: "error" };
  if (["4", "10"].includes(s)) return { text: "ลากิจ", color: "processing" };
  if (["5", "11"].includes(s)) return { text: "ลาป่วย", color: "warning" };
  if (["6", "12"].includes(s)) return { text: "ไปกิจกรรม", color: "cyan" };
  if (["21", "22", "23", "24", "25", "26"].includes(s))
    return { text: "ลาอื่นๆ", color: "default" };
  if (s === "99") return { text: "ยังไม่เช็ค", color: "default" };
  if (s === "8") return { text: "วันหยุด", color: "orange" };
  return { text: "ไม่ระบุ", color: "default" };
};

/** ✨ Service สำหรับจัดการ Business Logic ของการแสกนใบหน้า (Light Version) */
export const scanLightService = {
  /** 📷 ฟังก์ชันส่งข้อมูลการแสกนไปยัง Hardware API และจัดรูปแบบข้อมูลกลับ */
  async executeScan(payload: {
    school_id: string;
    user_code: string;
    s_id: string;
    version: string;
  }) {
    const externalUrl = `${API_URL.PROD_HARDWARE_API_URL}/api/jobscan/TimeStamp`;
    const requestPayload = {
      schoolId: String(payload.school_id),
      UserCode: String(payload.user_code),
      sID: String(payload.s_id),
      version: payload.version,
    };

    const response = await axios.post(externalUrl, requestPayload, {
      headers: {
        "Content-Type": "application/json",
        Cookie: "HWWAFSESID=03e7db5aba0cb39b6c; HWWAFSESTIME=1774516432923",
      },
    });

    const rawData = response.data;

    // ✨ จัดรูปแบบข้อมูลตามเงื่อนไขทางธุรกิจ (Attendance Status)
    const formattedData = Array.isArray(rawData)
      ? rawData.map((item: any) => ({
          ...item,
          attendance_status: getAttendanceStatusInfo(item.LogScanStatus),
        }))
      : rawData;

    return formattedData;
  },
};
