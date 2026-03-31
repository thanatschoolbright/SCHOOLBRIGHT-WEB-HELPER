import type { AxiosResponse } from "axios";
import { z } from "zod";

// ✨ Type สำหรับผลลัพธ์ที่วัดเวลาได้ (สำเร็จ)
export interface TimedOk<T> {
  ok: true;
  value: T;
  response_time: number;
}

// ✨ Type สำหรับผลลัพธ์ที่วัดเวลาได้ (ล้มเหลว)
export interface TimedErr {
  ok: false;
  error: unknown;
  response_time: number;
}

// ✨ Union type รวม TimedOk และ TimedErr
export type TimedResult<T> = TimedOk<T> | TimedErr;

// ✨ Type สำหรับฟังก์ชันที่ทำ HTTP request
export type RequestFn<T = AxiosResponse> = () => Promise<T>;

// ✨ ข้อมูลพื้นฐานของ Server แต่ละตัว
export interface ServerInfo {
  server: string;
  server_name: string;
  server_name_th: string;
  server_name_en: string;
  environment: "Production" | "Staging" | "Development";
  url: string;
  endpoint: string;
  description: string;
  timestamp: string;
}

// ✨ ผลลัพธ์การตรวจสอบสถานะ Server รวมข้อมูล response
export type ServerResultInfo = ServerInfo & {
  status_code: number;
  status: "Online" | "Offline";
  message?: string;
  response_time: number;
  response_time_severity_level: "low" | "medium" | "high" | "error";
};

// ✨ Schema ตรวจสอบ query parameter สำหรับ GET request
export const ServerStatusGetQuerySchema = z.object({
  mode: z.enum(["discord"]).optional(),
});

// ✨ Schema ตรวจสอบ body สำหรับ POST request
export const ServerStatusPostBodySchema = z.object({
  mode: z.enum(["discord"]).optional(),
});

export type ServerStatusGetQuery = z.infer<typeof ServerStatusGetQuerySchema>;
export type ServerStatusPostBody = z.infer<typeof ServerStatusPostBodySchema>;
