import { z } from "zod";

// ✨ Schema สำหรับตรวจสอบข้อมูลการดึงค่า Analytics (Dashboard)
export const OvertimeAnalyticsSchema = z.object({
  start_date: z.string().optional().describe("วันที่เริ่มต้น (YYYY-MM-DD)"),
  end_date: z.string().optional().describe("วันที่สิ้นสุด (YYYY-MM-DD)"),
  department_id: z
    .union([z.string(), z.number()])
    .optional()
    .describe("รหัสแผนก"),
});

export type OvertimeAnalyticsInput = z.infer<typeof OvertimeAnalyticsSchema>;
