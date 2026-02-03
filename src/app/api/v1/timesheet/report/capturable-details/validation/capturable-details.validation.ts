import { z } from "zod";

/**
 * Schema สำหรับตรวจสอบข้อมูลการดึงรายละเอียดการลงเวลาของโครงการ
 */
export const ReadCapturableDetailsSchema = z.object({
  project_id: z.number({ required_error: "กรุณาระบุ project_id" }),
  start_date: z.string({ required_error: "กรุณาระบุวันที่เริ่มต้น" }),
  end_date: z.string({ required_error: "กรุณาระบุวันที่สิ้นสุด" }),
});

export type ReadCapturableDetailsRequest = z.infer<
  typeof ReadCapturableDetailsSchema
>;
