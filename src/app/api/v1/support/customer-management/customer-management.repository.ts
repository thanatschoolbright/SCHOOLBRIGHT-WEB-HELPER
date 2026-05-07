import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { SearchCustomerDto } from "./customer-management.schema";

// ค้นหารายชื่อลูกค้าที่ถูกล็อก พร้อม join ชื่อโรงเรียนจาก TCompany
export async function findLockedCustomers(dto: SearchCustomerDto) {
  const { keyword, company_id, page, page_size } = dto;
  const offset = (page - 1) * page_size;

  const where: any = {
    cDel: { not: "Y" },
    AccountLockedUntil: { not: null },
  };

  if (keyword) {
    where.OR = [
      { sName: { contains: keyword, mode: "insensitive" } },
      { sLastname: { contains: keyword, mode: "insensitive" } },
      { username: { contains: keyword, mode: "insensitive" } },
      { sEmail: { contains: keyword, mode: "insensitive" } },
      { sPhone: { contains: keyword } },
      { sIdentification: { contains: keyword } },
    ];
  }

  if (company_id) {
    where.nCompany = company_id;
  }

  const [users, total] = await Promise.all([
    PrismaJabjaiMaster.tUser.findMany({
      where,
      select: {
        sID: true,
        sName: true,
        sLastname: true,
        username: true,
        sEmail: true,
        sPhone: true,
        nCompany: true,
        CurrentFailedAttempts: true,
        AccountLockedUntil: true,
        cType: true,
      },
      orderBy: { AccountLockedUntil: "desc" },
      skip: offset,
      take: page_size,
    }),
    PrismaJabjaiMaster.tUser.count({ where }),
  ]);

  // Batch join ชื่อโรงเรียนจาก TCompany
  const companyIds = [...new Set(users.map((u) => u.nCompany))];
  const companies =
    companyIds.length > 0
      ? await PrismaJabjaiMaster.tCompany.findMany({
          where: { nCompany: { in: companyIds } },
          select: { nCompany: true, sCompany: true },
        })
      : [];
  const companyMap = new Map(companies.map((c) => [c.nCompany, c.sCompany]));

  const data = users.map((u) => ({
    ...u,
    school_name: companyMap.get(u.nCompany) ?? null,
  }));

  return { users: data, total };
}

// ดึงรายชื่อโรงเรียนทั้งหมด (สำหรับ dropdown filter)
export async function findAllCompanies() {
  return PrismaJabjaiMaster.tCompany.findMany({
    select: { nCompany: true, sCompany: true },
    orderBy: { sCompany: "asc" },
  });
}

// ดึงข้อมูล user ตาม ID
export async function findCustomerById(userId: number) {
  return PrismaJabjaiMaster.tUser.findUnique({
    where: { sID: userId },
    select: {
      sID: true,
      sName: true,
      sLastname: true,
      username: true,
      sEmail: true,
      sPhone: true,
      nCompany: true,
      CurrentFailedAttempts: true,
      AccountLockedUntil: true,
    },
  });
}

// ปลดล็อกบัญชีลูกค้า: set AccountLockedUntil = null, CurrentFailedAttempts = 0
export async function unlockCustomerById(userId: number) {
  return PrismaJabjaiMaster.tUser.update({
    where: { sID: userId },
    data: { AccountLockedUntil: null, CurrentFailedAttempts: 0 },
    select: {
      sID: true,
      sName: true,
      sLastname: true,
      username: true,
      nCompany: true,
      AccountLockedUntil: true,
      CurrentFailedAttempts: true,
    },
  });
}

// ดึง ID ของ user ที่ถูกล็อกทั้งหมด (กรองตาม company_id ได้)
export async function findAllLockedUserIds(companyId?: number) {
  const where: any = {
    cDel: { not: "Y" },
    AccountLockedUntil: { not: null },
  };
  if (companyId) where.nCompany = companyId;

  const users = await PrismaJabjaiMaster.tUser.findMany({
    where,
    select: { sID: true, sName: true, sLastname: true, username: true, nCompany: true },
  });
  return users;
}

// ปลดล็อก user หลายคนพร้อมกัน
export async function unlockManyCustomers(userIds: number[]) {
  return PrismaJabjaiMaster.tUser.updateMany({
    where: { sID: { in: userIds } },
    data: { AccountLockedUntil: null, CurrentFailedAttempts: 0 },
  });
}

// บันทึก activity log ลง api_log (timesheet db)
export async function writeActivityLog(params: {
  endpoint: string;
  calledBy: string;
  requestBody: object;
  statusCode: number;
  isSuccess: boolean;
}) {
  return PrismaTimesheet.apiLog.create({
    data: {
      request_time: new Date(),
      method: "POST",
      endpoint: params.endpoint,
      service_name: "customer-management",
      request_body: params.requestBody as any,
      status_code: params.statusCode,
      is_success: params.isSuccess,
      called_by: params.calledBy,
    },
  });
}

// ดึง activity log ของ customer-management
export async function findActivityLogs(page: number, page_size: number) {
  const offset = (page - 1) * page_size;
  const where = { service_name: "customer-management" };
  const [logs, total] = await Promise.all([
    PrismaTimesheet.apiLog.findMany({
      where,
      orderBy: { request_time: "desc" },
      skip: offset,
      take: page_size,
      select: {
        id: true,
        endpoint: true,
        request_time: true,
        request_body: true,
        status_code: true,
        is_success: true,
        called_by: true,
      },
    }),
    PrismaTimesheet.apiLog.count({ where }),
  ]);
  return { logs, total };
}
