import { AppError } from "@/helpers/api/app-error";
import {
  findAllLockedUserIds,
  findCustomerById,
  findLockedCustomers,
  unlockCustomerById,
  unlockManyCustomers,
  writeActivityLog,
  findActivityLogs,
  findAllCompanies,
} from "./customer-management.repository";
import {
  ActivityLogQueryDto,
  SearchCustomerDto,
  UnlockAllCustomerDto,
  UnlockCustomerDto,
} from "./customer-management.schema";

// ค้นหาลูกค้าที่ถูกล็อก
export async function searchLockedCustomers(dto: SearchCustomerDto) {
  return findLockedCustomers(dto);
}

// ดึงรายชื่อโรงเรียนทั้งหมดสำหรับ dropdown
export async function getAllCompanies() {
  return findAllCompanies();
}

// ปลดล็อกบัญชีลูกค้ารายเดียว
export async function unlockCustomer(
  dto: UnlockCustomerDto,
  calledBy: string,
  operatorMeta: { name: string; employee_code?: string },
) {
  const user = await findCustomerById(dto.user_id);
  if (!user) throw new AppError(404, `ไม่พบลูกค้า ID: ${dto.user_id}`);
  if (!user.AccountLockedUntil && user.CurrentFailedAttempts === 0) {
    throw new AppError(400, "บัญชีนี้ไม่ได้ถูกล็อกอยู่");
  }

  const updated = await unlockCustomerById(dto.user_id);

  writeActivityLog({
    endpoint: "CUSTOMER_UNLOCK_ONE",
    calledBy,
    requestBody: {
      user_id: dto.user_id,
      username: user.username,
      school_id: user.nCompany,
      operator_name: operatorMeta.name,
      operator_employee_code: operatorMeta.employee_code,
    },
    statusCode: 200,
    isSuccess: true,
  }).catch(() => undefined);

  return updated;
}

// ปลดล็อกบัญชีทั้งหมด (รองรับ SSE progress)
export async function unlockAllCustomers(
  dto: UnlockAllCustomerDto,
  calledBy: string,
  operatorMeta: { name: string; employee_code?: string },
  onProgress: (unlocked: number, total: number) => void,
) {
  const users = await findAllLockedUserIds(dto.company_id);
  const total = users.length;

  if (total === 0) return { unlocked: 0, total: 0 };

  const BATCH = 50;
  let unlocked = 0;

  for (let i = 0; i < users.length; i += BATCH) {
    const batch = users.slice(i, i + BATCH);
    await unlockManyCustomers(batch.map((u) => u.sID));
    unlocked += batch.length;
    onProgress(unlocked, total);
  }

  writeActivityLog({
    endpoint: "CUSTOMER_UNLOCK_ALL",
    calledBy,
    requestBody: {
      company_id: dto.company_id ?? null,
      total_unlocked: unlocked,
      operator_name: operatorMeta.name,
      operator_employee_code: operatorMeta.employee_code,
    },
    statusCode: 200,
    isSuccess: true,
  }).catch(() => undefined);

  return { unlocked, total };
}

// ดึง activity log ของหน้านี้
export async function getActivityLogs(dto: ActivityLogQueryDto) {
  const { logs, total } = await findActivityLogs(dto.page, dto.page_size);
  return {
    logs: logs.map((l) => ({ ...l, id: l.id.toString() })),
    total,
  };
}
