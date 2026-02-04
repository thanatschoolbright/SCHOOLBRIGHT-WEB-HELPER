import { z } from "zod";

/**
 * Schema สำหรับตรวจสอบพารามิเตอร์การดึงข้อมูลจดหมายลาหยุด
 */
export const ReadLeaveLetterSchema = z.object({
  user_id: z.string({
    required_error: "ต้องระบุ user_id",
  }),
  page: z.string().optional().default("1"),
});

export type ReadLeaveLetterInput = z.infer<typeof ReadLeaveLetterSchema>;
