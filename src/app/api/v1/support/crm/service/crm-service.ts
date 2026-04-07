import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import dayjs from "dayjs";
import type {
  CrmCreateInput,
  CrmDeleteInput,
  CrmReadQuery,
  CrmUpdateInput,
} from "../validation/crm-schema";

// ✨ ดึงรายการเคส CRM Support พร้อม Pagination และ Filter ครบถ้วน
export async function getCrmList(query: CrmReadQuery) {
  const {
    page,
    page_size,
    search,
    status,
    priority,
    channel,
    type,
    sub_type,
    school_id,
    assign_staff_id,
    created_by,
    issue_date_from,
    issue_date_to,
    tab,
  } = query;

  const skip = (page - 1) * page_size;

  // กำหนดเงื่อนไขพื้นฐาน (ไม่แสดงรายการที่ถูกลบ)
  const baseWhere: Record<string, unknown> = { is_deleted: false };

  if (search) {
    baseWhere.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { ref_code: { contains: search, mode: "insensitive" } },
      { contact_id: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) baseWhere.status = status;
  if (priority) baseWhere.priority = priority;
  if (channel) baseWhere.channel = channel;
  if (type) baseWhere.type = type;
  if (sub_type) baseWhere.sub_type = sub_type;
  if (school_id) baseWhere.school_id = school_id;
  if (assign_staff_id) baseWhere.assign_staff_id = assign_staff_id;
  if (created_by) baseWhere.created_by = created_by;

  if (issue_date_from || issue_date_to) {
    baseWhere.issue_date = {};
    if (issue_date_from)
      (baseWhere.issue_date as Record<string, Date>).gte = new Date(
        issue_date_from,
      );
    if (issue_date_to)
      (baseWhere.issue_date as Record<string, Date>).lte = new Date(
        issue_date_to,
      );
  }

  // กรองตาม Tab
  const now = dayjs().toDate();
  const sevenDaysLater = dayjs().add(7, "day").toDate();

  if (tab === "upcoming") {
    baseWhere.due_date = { gte: now, lte: sevenDaysLater };
    baseWhere.status = { notIn: ["CLOSED", "RESOLVED"] };
  } else if (tab === "follow_up") {
    baseWhere.is_follow_up = true;
    baseWhere.follow_up_date = { gte: now };
    baseWhere.status = { notIn: ["CLOSED", "RESOLVED"] };
  } else if (tab === "overdue") {
    baseWhere.due_date = { lt: now };
    baseWhere.status = { notIn: ["CLOSED", "RESOLVED"] };
  }

  const [items, total] = await Promise.all([
    (PrismaTimesheet as any).crmSupport.findMany({
      where: baseWhere,
      orderBy: { created_at: "desc" },
      skip,
      take: page_size,
      include: {
        creator: {
          select: {
            id: true,
            firstname_th: true,
            lastname_th: true,
            employee_code: true,
          },
        },
        updater: {
          select: {
            id: true,
            firstname_th: true,
            lastname_th: true,
            employee_code: true,
          },
        },
      },
    }),
    (PrismaTimesheet as any).crmSupport.count({ where: baseWhere }),
  ]);

  return { items, total, page, page_size };
}

// ✨ ดึงสรุปจำนวนเคสแบ่งตามสถานะ สำหรับ Dashboard
export async function getCrmSummary() {
  const baseWhere = { is_deleted: false };

  const [total, open, in_progress, resolved, closed] = await Promise.all([
    (PrismaTimesheet as any).crmSupport.count({ where: baseWhere }),
    (PrismaTimesheet as any).crmSupport.count({
      where: { ...baseWhere, status: "OPEN" },
    }),
    (PrismaTimesheet as any).crmSupport.count({
      where: { ...baseWhere, status: "IN_PROGRESS" },
    }),
    (PrismaTimesheet as any).crmSupport.count({
      where: { ...baseWhere, status: "RESOLVED" },
    }),
    (PrismaTimesheet as any).crmSupport.count({
      where: { ...baseWhere, status: "CLOSED" },
    }),
  ]);

  return { total, open, in_progress, resolved, closed };
}

// ✨ สร้างเคส CRM Support ใหม่
export async function createCrmCase(input: CrmCreateInput) {
  const data: Record<string, unknown> = {
    issue_date: new Date(input.issue_date),
    school_id: input.school_id,
    channel: input.channel,
    contact_id: input.contact_id,
    type: input.type,
    sub_type: input.sub_type,
    ref_code: input.ref_code,
    support_detail: input.support_detail,
    subject: input.subject,
    question: input.question,
    answer: input.answer,
    is_follow_up: input.is_follow_up,
    follow_up_date: input.follow_up_date
      ? new Date(input.follow_up_date)
      : null,
    status: input.status,
    priority: input.priority,
    backlog_project_id: input.backlog_project_id,
    backlog_issue_id: input.backlog_issue_id,
    assign_staff_id: input.assign_staff_id,
    note: input.note,
    onboarding: input.onboarding,
    reference_key: input.reference_key,
    reference_value: input.reference_value,
    backlog_model: input.backlog_model,
    start_date: input.start_date ? new Date(input.start_date) : null,
    due_date: input.due_date ? new Date(input.due_date) : null,
    has_remind_follow_up: input.has_remind_follow_up,
    follow_up_end_date: input.follow_up_end_date
      ? new Date(input.follow_up_end_date)
      : null,
    follow_up_frequency: input.follow_up_frequency,
    customer_follow_up_date: input.customer_follow_up_date
      ? new Date(input.customer_follow_up_date)
      : null,
    customer_follow_up_end_date: input.customer_follow_up_end_date
      ? new Date(input.customer_follow_up_end_date)
      : null,
    customer_follow_up_frequency: input.customer_follow_up_frequency,
    customer_notify_message: input.customer_notify_message,
    created_by: input.created_by,
  };

  return (PrismaTimesheet as any).crmSupport.create({ data });
}

// ✨ อัปเดตเคส CRM Support ตาม ID
export async function updateCrmCase(input: CrmUpdateInput) {
  const { id, updated_by, ...rest } = input;

  const data: Record<string, unknown> = { updated_by };

  const dateFields = [
    "issue_date",
    "follow_up_date",
    "start_date",
    "due_date",
    "follow_up_end_date",
    "customer_follow_up_date",
    "customer_follow_up_end_date",
  ];

  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined) continue;
    if (dateFields.includes(key)) {
      data[key] = value ? new Date(value as string) : null;
    } else {
      data[key] = value;
    }
  }

  return (PrismaTimesheet as any).crmSupport.update({ where: { id }, data });
}

// ✨ ลบเคส CRM Support แบบ Soft Delete เพื่อเก็บประวัติ
export async function deleteCrmCase(input: CrmDeleteInput) {
  return (PrismaTimesheet as any).crmSupport.update({
    where: { id: input.id },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
      deleted_by: input.deleted_by,
    },
  });
}
