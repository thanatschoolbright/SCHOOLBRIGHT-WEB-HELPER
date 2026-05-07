import prisma from "@/helpers/prisma";
import type { ToggleDeviceNotifyDTO } from "./device-notify.schema";

// อัพเดท NotifyEnabled ใน DeviceDailyStatus (Main DB) ด้วย school_id + device_id
async function upsertNotifySetting(dto: ToggleDeviceNotifyDTO, _updatedBy: number | null) {
  await prisma.deviceDailyStatus.updateMany({
    where: { SchoolID: dto.school_id, DeviceID: dto.device_id },
    data: { NotifyEnabled: dto.notify_enabled },
  });
  return {
    school_id: dto.school_id,
    device_id: dto.device_id,
    notify_enabled: dto.notify_enabled,
  };
}

// ดึง notify setting ทั้งหมดของโรงเรียนจาก DeviceDailyStatus
async function findBySchoolId(schoolId: number) {
  const rows = await prisma.deviceDailyStatus.findMany({
    where: { SchoolID: schoolId },
    select: { DeviceID: true, NotifyEnabled: true },
    distinct: ["DeviceID"],
  });
  return rows.map((r) => ({ device_id: r.DeviceID, notify_enabled: r.NotifyEnabled }));
}

// ดึง notify setting ของหลายโรงเรียนพร้อมกัน
async function findBySchoolIds(schoolIds: number[]) {
  const rows = await prisma.deviceDailyStatus.findMany({
    where: { SchoolID: { in: schoolIds } },
    select: { SchoolID: true, DeviceID: true, NotifyEnabled: true },
    distinct: ["SchoolID", "DeviceID"],
  });
  return rows.map((r) => ({
    school_id: r.SchoolID,
    device_id: r.DeviceID,
    notify_enabled: r.NotifyEnabled,
  }));
}

export const deviceNotifyRepository = {
  upsertNotifySetting,
  findBySchoolId,
  findBySchoolIds,
};
