import { z } from "zod";

// ✨ Schema สำหรับอัปเดตช่วงเวลาแจ้งเตือน (PATCH)
export const UpdateTimeWindowSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  start_hour: z.coerce.number().int().min(0).max(23).optional(),
  start_min: z.coerce.number().int().min(0).max(59).optional(),
  end_hour: z.coerce.number().int().min(0).max(23).optional(),
  end_min: z.coerce.number().int().min(0).max(59).optional(),
  is_active: z.boolean().optional(),
});
export type UpdateTimeWindowDTO = z.infer<typeof UpdateTimeWindowSchema>;

// ✨ Schema สำหรับอัปเดตช่วงห่างการแจ้งเตือน (PATCH)
export const UpdateIntervalSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  interval_minutes: z.coerce.number().int().min(1).max(1440).optional(),
  is_active: z.boolean().optional(),
});
export type UpdateIntervalDTO = z.infer<typeof UpdateIntervalSchema>;
