import { z } from "zod";

/**
 * ✨ Schema สำหรับตรวจสอบข้อมูลการดึงรายชื่อกลุ่ม LINE
 */
export const schoolIdSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  school_id: z.number().optional(),
});

/**
 * ✨ Schema สำหรับสร้างกลุ่ม LINE ใหม่
 */
export const createSchoolGroupSchema = z.object({
  school_id: z.number({ required_error: "กรุณาระบุรหัสโรงเรียน" }),
  group_id: z.string({ required_error: "กรุณาระบุ Group ID" }),
  line_notification_access_token: z.string({ required_error: "กรุณาระบุ Access Token" }),
  group_type: z.string().optional().default("general"),
});

/**
 * ✨ Schema สำหรับแก้ไขกลุ่ม LINE
 */
export const updateSchoolGroupSchema = z.object({
  line_group_id: z.number({ required_error: "กรุณาระบุ ID ของกลุ่ม" }),
  school_id: z.number().optional(),
  group_id: z.string().optional(),
  line_notification_access_token: z.string().optional(),
  group_type: z.string().optional(),
});

/**
 * ✨ Schema สำหรับลบกลุ่ม LINE
 */
export const deleteSchoolGroupSchema = z.object({
  line_group_id: z.number({ required_error: "กรุณาระบุ ID ของกลุ่มที่ต้องการลบ" }),
});

export type SchoolIdRequest = z.infer<typeof schoolIdSchema>;
export type CreateSchoolGroupRequest = z.infer<typeof createSchoolGroupSchema>;
export type UpdateSchoolGroupRequest = z.infer<typeof updateSchoolGroupSchema>;
export type DeleteSchoolGroupRequest = z.infer<typeof deleteSchoolGroupSchema>;
