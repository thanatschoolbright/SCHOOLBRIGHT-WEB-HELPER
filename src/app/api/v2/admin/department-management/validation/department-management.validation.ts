import { z } from "zod";

export const CreateDepartmentSchema = z.object({
  name_th: z.string().min(2, "ชื่อแผนก (ภาษาไทย) ต้องไม่ต่ำกว่า 2 ตัวอักษร"),
  name_en: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const UpdateDepartmentSchema = z.object({
  id: z.number().int().positive("ID ต้องเป็นจำนวนเต็มบวก"),
  name_th: z
    .string()
    .min(2, "ชื่อแผนก (ภาษาไทย) ต้องไม่ต่ำกว่า 2 ตัวอักษร")
    .optional(),
  name_en: z.string().optional(),
  is_active: z.boolean().optional(),
});
