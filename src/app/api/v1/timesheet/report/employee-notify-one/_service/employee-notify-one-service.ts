import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { sendMail } from "@/server/mailer";
import {
  buildEmployeeEmailHtml,
  EmployeeNotifyTarget,
} from "../../employee-notify/_service/employee-notify-service";

// ====================================================================
// Types
// ====================================================================

export interface SendOneResult {
  success: boolean;
  skipped: boolean;
  email?: string;
  reason?: string;
  error?: string;
}

// ====================================================================
// ดึงข้อมูลพนักงาน 1 คนและตรวจสอบชั่วโมงวันนี้
// ====================================================================

const queryTargetById = async (
  adminId: number,
): Promise<EmployeeNotifyTarget | null> => {
  const thaiNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  const startOfToday = new Date(thaiNow);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(thaiNow);
  endOfToday.setHours(23, 59, 59, 999);

  const user = await PrismaTimesheet.user.findFirst({
    where: { admin_id: adminId, is_deleted: false },
    select: {
      id: true,
      admin_id: true,
      firstname_th: true,
      lastname_th: true,
      nickname: true,
      employee_code: true,
      email: true,
      position_ref: { select: { name_th: true } },
      department: { select: { name_th: true } },
    },
  });

  if (!user) return null;

  // คำนวณชั่วโมงที่กรอกวันนี้
  const entries = await PrismaTimesheet.timesheetEntry.findMany({
    where: {
      createdBy: adminId,
      is_deleted: false,
      date: { gte: startOfToday, lte: endOfToday },
    },
    select: { hours: true },
  });

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const fullName =
    `${user.firstname_th ?? ""} ${user.lastname_th ?? ""}`.trim() ||
    "ไม่ระบุชื่อ";

  return {
    admin_id: user.admin_id,
    full_name: fullName,
    nickname: user.nickname,
    employee_code: user.employee_code,
    position: user.position_ref?.name_th ?? null,
    department: user.department?.name_th ?? null,
    email: user.email,
    total_hours: totalHours,
    status: totalHours === 0 ? "ไม่ได้กรอกเลย" : "กรอกไม่ครบ",
  };
};

// ====================================================================
// ส่งอีเมลแจ้งเตือนพนักงาน 1 คน
// ====================================================================

export const sendEmployeeEmailOne = async (
  adminId: number,
  dateLabel: string,
): Promise<SendOneResult> => {
  const target = await queryTargetById(adminId);

  if (!target) {
    return { success: false, skipped: true, reason: "ไม่พบข้อมูลพนักงาน" };
  }

  if (!target.email) {
    return { success: false, skipped: true, reason: "ไม่มีอีเมล" };
  }

  if (target.total_hours >= 8) {
    return { success: false, skipped: true, reason: "กรอกชั่วโมงครบแล้ว" };
  }

  const subject =
    target.status === "ไม่ได้กรอกเลย"
      ? `[SchoolBright] กรุณาบันทึกเวลาทำงานวันนี้ ${dateLabel}`
      : `[SchoolBright] บันทึกเวลาทำงานยังไม่ครบ ${dateLabel}`;

  const html = buildEmployeeEmailHtml(target, dateLabel);

  try {
    await sendMail(target.email, subject, subject, html);
    return { success: true, skipped: false, email: target.email };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    return {
      success: false,
      skipped: false,
      email: target.email,
      error: message,
    };
  }
};
