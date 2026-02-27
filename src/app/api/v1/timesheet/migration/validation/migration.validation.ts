import { z } from "zod";

/* Schema สำหรับการย้ายข้อมูล Timesheet (Bulk Update) */
export const migrationCreateSchema = z.object({
  entry_ids: z.array(z.number({ required_error: "ต้องระบุรายการที่จะย้าย" })),
  target_project_id: z.number({ required_error: "ต้องระบุโปรเจกต์เป้าหมาย" }),
  target_feature_id: z.number({ required_error: "ต้องระบุ Feature เป้าหมาย" }),
});

/* Schema สำหรับการขอให้ ChatGPT ช่วยสรุปงาน (Auto-fill) */
export const migrationAutomateSchema = z.object({
  admin_id: z.number({ required_error: "ต้องระบุรหัสพนักงาน" }),
  entry_ids: z.array(
    z.number({ required_error: "ต้องระบุรายการที่ต้องการสรุป" }),
  ),
});

/* Schema สำหรับการดึงข้อมูลรายชื่อพนักงาน (GET) */
export const migrationQuerySchema = z.object({
  action: z.enum(["projects", "features", "users", "entries"]),
  project_id: z.string().optional(),
  admin_id: z.string().optional(),
  has_issues: z.string().optional(), // รับเป็น string แล้วค่อยแปลงเป็น boolean
});

export type MigrationCreateInput = z.infer<typeof migrationCreateSchema>;
