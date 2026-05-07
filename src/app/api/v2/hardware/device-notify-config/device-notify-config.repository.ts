import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";

const DEFAULT_TIME_WINDOWS = [
  { round: 1, label: "รอบเช้า", start_hour: 6, start_min: 0, end_hour: 8, end_min: 0 },
  { round: 2, label: "รอบบ่าย", start_hour: 15, start_min: 0, end_hour: 17, end_min: 0 },
];

const DEFAULT_INTERVALS = [
  { round: 1, label: "รอบแรก (หลัง Offline)", interval_minutes: 5 },
  { round: 2, label: "รอบถัดไป", interval_minutes: 30 },
];

// ✨ ดึงช่วงเวลาแจ้งเตือนของโรงเรียน — หากยังไม่มีจะ seed ค่า default ให้อัตโนมัติ
async function findTimeWindowsBySchool(schoolId: number) {
  const existing = await PrismaJabjaiMaster.deviceNotifyTimeWindow.findMany({
    where: { school_id: schoolId },
    orderBy: { round: "asc" },
  });
  if (existing.length > 0) return existing;

  // lazy seed default rows ให้โรงเรียนนี้
  await PrismaJabjaiMaster.deviceNotifyTimeWindow.createMany({
    data: DEFAULT_TIME_WINDOWS.map((w) => ({ ...w, school_id: schoolId, is_active: true })),
    skipDuplicates: true,
  });
  return PrismaJabjaiMaster.deviceNotifyTimeWindow.findMany({
    where: { school_id: schoolId },
    orderBy: { round: "asc" },
  });
}

// ✨ ดึงช่วงห่างการแจ้งเตือนของโรงเรียน — หากยังไม่มีจะ seed ค่า default ให้อัตโนมัติ
async function findIntervalsBySchool(schoolId: number) {
  const existing = await PrismaJabjaiMaster.deviceNotifyInterval.findMany({
    where: { school_id: schoolId },
    orderBy: { round: "asc" },
  });
  if (existing.length > 0) return existing;

  await PrismaJabjaiMaster.deviceNotifyInterval.createMany({
    data: DEFAULT_INTERVALS.map((v) => ({ ...v, school_id: schoolId, is_active: true })),
    skipDuplicates: true,
  });
  return PrismaJabjaiMaster.deviceNotifyInterval.findMany({
    where: { school_id: schoolId },
    orderBy: { round: "asc" },
  });
}

// ✨ อัปเดตช่วงเวลาแจ้งเตือนตาม id
async function updateTimeWindow(
  id: number,
  data: {
    label?: string;
    start_hour?: number;
    start_min?: number;
    end_hour?: number;
    end_min?: number;
    is_active?: boolean;
    updated_by?: number | null;
  },
) {
  return PrismaJabjaiMaster.deviceNotifyTimeWindow.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

// ✨ เพิ่มรอบการแจ้งเตือนใหม่ให้โรงเรียน (สูงสุด 3 รอบ)
async function createTimeWindow(data: {
  school_id: number;
  round: number;
  label: string;
  start_hour: number;
  start_min: number;
  end_hour: number;
  end_min: number;
}) {
  return PrismaJabjaiMaster.deviceNotifyTimeWindow.create({
    data: { ...data, is_active: true },
  });
}

// ✨ ลบรอบการแจ้งเตือนตาม id
async function deleteTimeWindow(id: number) {
  return PrismaJabjaiMaster.deviceNotifyTimeWindow.delete({ where: { id } });
}

// ✨ อัปเดตช่วงห่างการแจ้งเตือนตาม id
async function updateInterval(
  id: number,
  data: {
    label?: string;
    interval_minutes?: number;
    is_active?: boolean;
    updated_by?: number | null;
  },
) {
  return PrismaJabjaiMaster.deviceNotifyInterval.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

// ✨ นับรอบการแจ้งเตือนของโรงเรียน (ใช้ตรวจสอบก่อน create)
async function countTimeWindowsBySchool(schoolId: number) {
  return PrismaJabjaiMaster.deviceNotifyTimeWindow.count({
    where: { school_id: schoolId },
  });
}

export const deviceNotifyConfigRepository = {
  findTimeWindowsBySchool,
  findIntervalsBySchool,
  updateTimeWindow,
  createTimeWindow,
  deleteTimeWindow,
  updateInterval,
  countTimeWindowsBySchool,
};
