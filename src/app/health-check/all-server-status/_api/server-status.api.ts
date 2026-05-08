import { callApiService as axios } from "@/services/axios-instance/sb-helper.axios";

/**
 * ดึงข้อมูลสถานะเซิร์ฟเวอร์ทั้งหมด (V2)
 * @returns รายการสถานะเซิร์ฟเวอร์พร้อมข้อมูลสรุป
 */
export const requestServerStatusV2 = async () => {
    const response = await axios.get("/api/v2/server/status");
    return response.data;
};

/**
 * ส่งรายงานสถานะเซิร์ฟเวอร์ผ่านทางอีเมล
 * @returns สถานะการดำเนินการ
 */
export const requestSendStatusEmail = async () => {
    const response = await axios.get("/api/v2/server/status/channel/email");
    return response.data;
};

/**
 * ส่งแจ้งเตือนสถานะเซิร์ฟเวอร์ไปยัง Discord
 * @returns สถานะการดำเนินการ
 */
export const requestNotifyDiscord = async () => {
    const response = await axios.get("/api/v2/server/status?mode=discord");
    return response.data;
};

/**
 * ดึงรายการ log การตรวจสอบสถานะ Server
 * @param params - พารามิเตอร์ filter และ pagination
 */
export const requestServerStatusLogs = async (params: {
    page?: number;
    page_size?: number;
    server_name?: string;
    status?: "Online" | "Offline";
    date_from?: string;
    date_to?: string;
}) => {
    const response = await axios.get("/api/v2/server/status/log", { params });
    return response.data;
};

/**
 * ดึงสรุปสถิติ Uptime/Downtime ของแต่ละ Server
 * @param params - จำนวนวัน หรือช่วงวันที่
 */
export const requestServerStatusLogSummary = async (params: {
    days?: number;
    date_from?: string;
    date_to?: string;
}) => {
    const response = await axios.get("/api/v2/server/status/log/summary", { params });
    return response.data;
};
