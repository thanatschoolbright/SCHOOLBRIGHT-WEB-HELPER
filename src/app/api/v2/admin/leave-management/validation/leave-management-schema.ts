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

/**
 * Schema สำหรับตรวจสอบข้อมูลการอนุมัติ / ไม่อนุมัติการลา (Approve / Reject)
 * userid ไม่ต้องส่งมาจาก frontend — service ใช้ auth.userId จากการ Login แทน
 */
export const ApproveLeaveManagementSchema = z.object({
  letter_id: z.number().int().positive(),
  school_id: z.number().int().positive(),
  approve: z.enum(["0", "1"]).describe("1 = อนุมัติ, 0 = ไม่อนุมัติ"),
  message: z.string().optional().default(""),
});

export type ApproveLeaveManagementInput = z.infer<
  typeof ApproveLeaveManagementSchema
>;
