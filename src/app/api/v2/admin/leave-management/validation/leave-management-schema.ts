import { z } from "zod";

/**
 * Schema สำหรับตรวจสอบข้อมูลการดึงรายชื่อการลา (Read)
 */
export const ReadLeaveManagementSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(50),
  search: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  school_id: z.string().optional(),
});

export type ReadLeaveManagementInput = z.infer<
  typeof ReadLeaveManagementSchema
>;
