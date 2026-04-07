import { z } from "zod";

// ✨ Schema สำหรับกรองรายการ CRM Support (Query Params)
export const CrmReadQuerySchema = z.object({
  page: z.preprocess((v) => Number(v), z.number().int().min(1).default(1)),
  page_size: z.preprocess(
    (v) => Number(v),
    z.number().int().min(1).max(200).default(20),
  ),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  channel: z.string().optional(),
  type: z.string().optional(),
  sub_type: z.string().optional(),
  school_id: z.preprocess(
    (v) => (v ? Number(v) : undefined),
    z.number().int().optional(),
  ),
  assign_staff_id: z.preprocess(
    (v) => (v ? Number(v) : undefined),
    z.number().int().optional(),
  ),
  created_by: z.preprocess(
    (v) => (v ? Number(v) : undefined),
    z.number().int().optional(),
  ),
  issue_date_from: z.string().optional(),
  issue_date_to: z.string().optional(),
  tab: z.enum(["all", "upcoming", "follow_up", "overdue"]).default("all"),
});

// ✨ Schema สำหรับสร้างเคส CRM Support ใหม่
export const CrmCreateSchema = z.object({
  issue_date: z.string(),
  school_id: z.number().int(),
  channel: z.string().optional(),
  contact_id: z.string().optional(),
  type: z.string().optional(),
  sub_type: z.string().optional(),
  ref_code: z.string().optional(),
  support_detail: z.string().optional(),
  subject: z.string().min(1, "กรุณาระบุหัวข้อเคส"),
  question: z.string().optional(),
  answer: z.string().optional(),
  is_follow_up: z.boolean().default(false),
  follow_up_date: z.string().optional(),
  status: z.string().default("OPEN"),
  priority: z.string().optional(),
  backlog_project_id: z.number().int().optional(),
  backlog_issue_id: z.number().int().optional(),
  assign_staff_id: z.number().int().optional(),
  note: z.string().optional(),
  onboarding: z.boolean().default(false),
  reference_key: z.string().optional(),
  reference_value: z.string().optional(),
  backlog_model: z.string().optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  has_remind_follow_up: z.boolean().default(false),
  follow_up_end_date: z.string().optional(),
  follow_up_frequency: z.string().optional(),
  customer_follow_up_date: z.string().optional(),
  customer_follow_up_end_date: z.string().optional(),
  customer_follow_up_frequency: z.string().optional(),
  customer_notify_message: z.boolean().default(false),
  created_by: z.number().int().optional(),
});

// ✨ Schema สำหรับอัปเดตเคส CRM Support
export const CrmUpdateSchema = z.object({
  id: z.number().int(),
  issue_date: z.string().optional(),
  school_id: z.number().int().optional(),
  channel: z.string().optional(),
  contact_id: z.string().optional(),
  type: z.string().optional(),
  sub_type: z.string().optional(),
  ref_code: z.string().optional(),
  support_detail: z.string().optional(),
  subject: z.string().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  is_follow_up: z.boolean().optional(),
  follow_up_date: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  backlog_project_id: z.number().int().optional(),
  backlog_issue_id: z.number().int().optional(),
  assign_staff_id: z.number().int().optional(),
  note: z.string().optional(),
  onboarding: z.boolean().optional(),
  reference_key: z.string().optional(),
  reference_value: z.string().optional(),
  backlog_model: z.string().optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  has_remind_follow_up: z.boolean().optional(),
  follow_up_end_date: z.string().optional(),
  follow_up_frequency: z.string().optional(),
  customer_follow_up_date: z.string().optional(),
  customer_follow_up_end_date: z.string().optional(),
  customer_follow_up_frequency: z.string().optional(),
  customer_notify_message: z.boolean().optional(),
  updated_by: z.number().int().optional(),
});

// ✨ Schema สำหรับลบเคส CRM Support (Soft Delete)
export const CrmDeleteSchema = z.object({
  id: z.number().int(),
  deleted_by: z.number().int().optional(),
});

export type CrmReadQuery = z.infer<typeof CrmReadQuerySchema>;
export type CrmCreateInput = z.infer<typeof CrmCreateSchema>;
export type CrmUpdateInput = z.infer<typeof CrmUpdateSchema>;
export type CrmDeleteInput = z.infer<typeof CrmDeleteSchema>;
