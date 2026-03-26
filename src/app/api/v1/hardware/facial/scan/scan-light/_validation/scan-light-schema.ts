import { z } from "zod";

/** ✨ Schema สำหรับตรวจสอบข้อมูลการแสกนใบหน้า (Light Version) */
export const ScanLightSchema = z.object({
  school_id: z.string({ required_error: "กรุณาระบุรหัสโรงเรียน" }),
  user_code: z.string({ required_error: "กรุณาระบุรหัสพนักงาน/นักเรียน" }),
  s_id: z.string({ required_error: "กรุณาระบุรหัสผู้ใช้งาน (sID)" }),
  version: z.string().optional().default("1.2.5"),
});

export type ScanLightInput = z.infer<typeof ScanLightSchema>;
