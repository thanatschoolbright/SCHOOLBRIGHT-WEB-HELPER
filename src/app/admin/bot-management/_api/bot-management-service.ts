import { callApiService } from "@/services/axios-instance/sb-helper.axios";

export interface BotItem {
  key: string;
  name_th: string;
  description: string;
  schedule: string;
  schedule_th: string;
  cronjob_name: string;
  enabled: boolean;
  updated_by: number | null;
  updated_at: string | null;
}

// ดึงรายการ Bot ทั้งหมดพร้อมสถานะจาก API
export async function fetchBotList(): Promise<BotItem[]> {
  const res = await callApiService.get("/api/v2/admin/bot-management");
  return res.data?.data ?? [];
}

// เปิด/ปิด Bot ตาม key
export async function toggleBot(key: string, enabled: boolean): Promise<BotItem> {
  const res = await callApiService.patch("/api/v2/admin/bot-management", { key, enabled });
  return res.data?.data;
}
