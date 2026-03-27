import { z } from "zod";

// ✨ Schema สำหรับตรวจสอบข้อมูลการดึงค่า Dashboard ของ PM
export const PMDashboardQuerySchema = z.object({
  start_date: z.string().optional().describe("วันที่เริ่มต้น (YYYY-MM-DD)"),
  end_date: z.string().optional().describe("วันที่สิ้นสุด (YYYY-MM-DD)"),
  group_id: z.string().optional().describe("รหัสกลุ่มโครงการ"),
});

export type PMDashboardQueryInput = z.infer<typeof PMDashboardQuerySchema>;
