import { z } from "zod";

/* Schema สำหรับตรวจสอบพารามิเตอร์การดึงข้อมูลจดหมายลาหยุด (Read) */
export const ReadLeaveLetterSchema = z.object({
  user_id: z.string({
    required_error: "ต้องระบุ user_id",
  }),
  page: z.string().optional().default("1"),
});

/* Schema สำหรับตรวจสอบพารามิเตอร์การอัปเดตสถานะ (Update) */
export const UpdateLeaveStatusSchema = z.object({
  letter_id: z.string({
    required_error: "ต้องระบุ letter_id",
  }),
  school_id: z.string({
    required_error: "ต้องระบุ school_id",
  }),
});

export type ReadLeaveLetterInput = z.infer<typeof ReadLeaveLetterSchema>;
export type UpdateLeaveStatusInput = z.infer<typeof UpdateLeaveStatusSchema>;
