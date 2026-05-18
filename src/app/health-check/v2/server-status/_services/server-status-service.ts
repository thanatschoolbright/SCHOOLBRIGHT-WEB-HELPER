"use client";

import axios from "axios";

/**
 * อินเทอร์เฟซสำหรับข้อมูลสถานะเซิร์ฟเวอร์
 */
export interface ServerStatusData {
  module: string;
  group: string;
  name_th: string;
  name_en: string;
  status: string;
  service: string;
  curl: string;
  request: {
    url: string;
    method: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
    body?: any;
    data?: any;
  };
  response: any;
  response_time_ms: number;
}

/**
 * อินเทอร์เฟซสำหรับ Response จาก API
 */
export interface ServerStatusApiResponse {
  status: number;
  message_th: string;
  message_en: string;
  data: ServerStatusData[];
}

/**
 * บริการสำหรับดึงข้อมูลสถานะเซิร์ฟเวอร์
 * @param executionMode โหมดการทำงาน (normal | discord)
 * @returns ข้อมูลสถานะเซิร์ฟเวอร์
 */
export const requestServerStatus = async (
  executionMode: "normal" | "discord" = "normal",
): Promise<ServerStatusApiResponse> => {
  const response = await axios.post<ServerStatusApiResponse>(
    "/api/v1/health-check/server/system",
    { mode: executionMode },
    { headers: { "Content-Type": "application/json" } },
  );
  return response.data;
};

/**
 * บริการสำหรับการส่งออกรายงาน Excel
 * @param data ข้อมูลที่ต้องการส่งออก
 * @returns Blob ของไฟล์ Excel
 */
export const requestExportExcelReport = async (
  data: ServerStatusData[],
): Promise<Blob> => {
  const response = await axios.post(
    "/api/v1/health-check/server/system/export",
    { data },
    { responseType: "blob" },
  );
  return response.data;
};
