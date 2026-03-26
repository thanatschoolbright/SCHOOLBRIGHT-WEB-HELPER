import axios from "axios";

/**
 * Service สำหรับเรียก API แสกนใบหน้า (Light Mode)
 * @param {object} payload - ข้อมูลที่ต้องการส่ง
 * @returns {Promise<any>} - ผลลัพธ์จาก API
 */
export const fetchScanLightFace = async (payload: {
  school_id: string;
  user_code: string;
  s_id: string;
}) => {
  const response = await axios.post(
    "/api/v1/hardware/facial/scan/scan-light",
    payload,
  );
  return response.data;
};
