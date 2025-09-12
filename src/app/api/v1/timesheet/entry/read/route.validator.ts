import { z } from "zod";

export const Schema = z
  .object({
    id: z.number().optional(),
    limit: z.number().min(1), // required
    page: z.number().min(1).optional(),
    user_id: z.number().optional(),
  })
  .refine((data) => data.id !== undefined || data.page !== undefined, {
    message: "ต้องระบุ id หรือ page อย่างน้อย 1 อย่าง และต้องกำหนด limit เสมอ",
  });
