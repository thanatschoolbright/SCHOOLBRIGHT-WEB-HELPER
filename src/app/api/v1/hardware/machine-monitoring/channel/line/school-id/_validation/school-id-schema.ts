import { z } from "zod";

// ✨ Schema สำหรับตรวจสอบข้อมูลการดึงรายชื่อกลุ่ม LINE
export const schoolIdSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  school_id: z.number().optional(),
});

export type SchoolIdRequest = z.infer<typeof schoolIdSchema>;
