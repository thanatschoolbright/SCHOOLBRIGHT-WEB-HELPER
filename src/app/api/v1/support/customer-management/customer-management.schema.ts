import { z } from "zod";

// Schema สำหรับค้นหาลูกค้า
export const SearchCustomerSchema = z.object({
  keyword: z.string().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

// Schema สำหรับปลดล็อกลูกค้ารายเดียว
export const UnlockCustomerSchema = z.object({
  user_id: z.number().int().positive({ message: "user_id ต้องเป็นจำนวนเต็มบวก" }),
});

// Schema สำหรับปลดล็อกทั้งหมด (กรองตาม company ได้)
export const UnlockAllCustomerSchema = z.object({
  company_id: z.number().int().positive().optional(),
});

// Schema สำหรับดึง activity log
export const ActivityLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchCustomerDto = z.infer<typeof SearchCustomerSchema>;
export type UnlockCustomerDto = z.infer<typeof UnlockCustomerSchema>;
export type UnlockAllCustomerDto = z.infer<typeof UnlockAllCustomerSchema>;
export type ActivityLogQueryDto = z.infer<typeof ActivityLogQuerySchema>;
