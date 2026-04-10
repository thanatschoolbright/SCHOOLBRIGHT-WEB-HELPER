import { z } from "zod";

// Schema สำหรับ Re-assign Issue (เปลี่ยนผู้รับผิดชอบงาน)
export const reAssignSchema = z.object({
  space: z.string().min(1, "กรุณาระบุ Space"),
  issue_key_or_id: z.union([z.string().min(1), z.number()]),
  assignee_id: z.number({
    required_error: "กรุณาเลือกพนักงานที่ต้องการมอบงาน",
  }),
  comment: z.string().optional(),
});

export type ReAssignPayload = z.infer<typeof reAssignSchema>;
