import { z } from "zod";

const DescriptionSchema = z.object({
  date: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v : v),
    z.string().optional(),
  ),
  startDate: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v : v),
    z.string().optional(),
  ),
  endDate: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v : v),
    z.string().optional(),
  ),
  duration: z.preprocess((v) => {
    if (typeof v === "string" && v.trim() !== "") return Number(v);
    return v;
  }, z.number().nonnegative()),
  description: z.string().optional(),
  assignee: z.union([z.string(), z.number()]).optional(),
});

// ✨ Schema สำหรับตรวจสอบข้อมูลการขอ Overtime (Snake Case Payload)
export const CreateOvertimeSnakeSchema = z.object({
  requester_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  employee_code: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  request_date: z.preprocess(
    (v) => (typeof v === "string" ? v : v),
    z.string().optional(),
  ),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  overtime_type: z.string().optional(),
  descriptions: z.array(DescriptionSchema).optional(),
  approver_id: z.string().optional(),
  status: z.string().optional(),
  created_by: z.preprocess(
    (v) => (typeof v === "string" ? Number(v) : v),
    z.number().int().optional(),
  ),
});
