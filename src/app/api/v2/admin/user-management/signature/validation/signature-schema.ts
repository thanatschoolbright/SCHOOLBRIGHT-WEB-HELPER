import { z } from "zod";

// schema สำหรับตรวจสอบคำขอลบลายเซ็น
export const deleteSignatureSchema = z.object({
  user_id: z.number().int().positive({ message: "กรุณาระบุ user_id ที่ถูกต้อง" }),
  signature_path: z.string().min(1, "กรุณาระบุ path ของลายเซ็นที่ต้องการลบ"),
});

// schema สำหรับตรวจสอบคำขอดึงลายเซ็นตาม user_id (query string)
export const readSignatureSchema = z.object({
  user_id: z.string().regex(/^\d+$/, "user_id ต้องเป็นตัวเลขเท่านั้น"),
});

export type DeleteSignaturePayload = z.infer<typeof deleteSignatureSchema>;
export type ReadSignaturePayload = z.infer<typeof readSignatureSchema>;
