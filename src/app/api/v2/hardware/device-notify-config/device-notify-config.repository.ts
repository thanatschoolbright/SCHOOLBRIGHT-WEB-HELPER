import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";

// ✨ ดึงช่วงเวลาแจ้งเตือนทั้งหมด เรียงตามรอบ
async function findAllTimeWindows() {
  return PrismaJabjaiMaster.deviceNotifyTimeWindow.findMany({
    orderBy: { round: "asc" },
  });
}

// ✨ ดึงช่วงห่างการแจ้งเตือนทั้งหมด เรียงตามรอบ
async function findAllIntervals() {
  return PrismaJabjaiMaster.deviceNotifyInterval.findMany({
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

export const deviceNotifyConfigRepository = {
  findAllTimeWindows,
  findAllIntervals,
  updateTimeWindow,
  updateInterval,
};
