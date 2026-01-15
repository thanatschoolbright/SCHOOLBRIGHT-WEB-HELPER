import { z } from "zod";

export const Schema = z.object({
  id: z.number().optional(),
  nameTh: z.string().min(1, "กรุณาระบุชื่อสถานะ (ภาษาไทย)"),
  nameEn: z.string().optional().nullable(),
  priority: z.number().min(1, "Priority ต้องเป็นตัวเลขมากกว่า 0"),
});
