import { z } from "zod";

/**
 * Schema สำหรับตรวจสอบข้อมูลการดึงรายชื่อการลา (Read)
 */
export const ReadLeaveManagementSchema = z.object({
  userid: z.string().describe("User ID format 'id/page' (e.g. 1233762/1)"),
  schoolid: z.string().optional(),
});

export type ReadLeaveManagementInput = z.infer<
  typeof ReadLeaveManagementSchema
>;
