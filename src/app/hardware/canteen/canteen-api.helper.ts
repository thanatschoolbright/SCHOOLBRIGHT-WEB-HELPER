import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";

//** เรียกข้อมูลรายการแอปพลิเคชันทั้งหมด
export const GET_APPLICATION_LIST = async () => {
  try {
    const response = await axios.get("/api/v1/hardware/canteen/application");
    return response.data;
  } catch (error) {
    throw error;
  }
};

//** เรียกข้อมูลเวอร์ชันของแอปพลิเคชันตาม app_id
export const GET_APPLICATION_VERSION_BY_APPID = async (appId: string | number) => {
  try {
    const response = await axios.get(`/api/v1/hardware/canteen/version/${appId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

//** สร้างเวอร์ชันใหม่สำหรับแอปพลิเคชัน
export const POST_CREATE_APPLICATION_VERSION = async (formData: FormData) => {
  try {
    const response = await axios.post("/api/v1/hardware/canteen/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

//** อัปเดตข้อมูลเวอร์ชันที่มีอยู่
export const POST_UPDATE_APPLICATION_VERSION = async (formData: FormData) => {
  try {
    const response = await axios.post("/api/v1/hardware/canteen/update", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

//** ลบเวอร์ชันตาม version_id
export const DELETE_APPLICATION_VERSION = async (versionId: string | number) => {
  try {
    const response = await axios.post(`/api/v1/hardware/canteen/delete/${versionId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};