import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import type { ToggleDeviceNotifyDTO } from "../_validation/device-notify-schema";

// อัพเดทหรือสร้างการตั้งค่าการแจ้งเตือนของอุปกรณ์ (upsert ด้วย school_id + device_id)
async function upsertNotifySetting(dto: ToggleDeviceNotifyDTO, updatedBy: number | null) {
  return PrismaTimesheet.deviceMonitorSetting.upsert({
    where: {
      school_id_device_id: {
        school_id: dto.school_id,
        device_id: dto.device_id,
      },
    },
    update: {
      notify_enabled: dto.notify_enabled,
      updated_by: updatedBy,
    },
    create: {
      school_id: dto.school_id,
      device_id: dto.device_id,
      notify_enabled: dto.notify_enabled,
      updated_by: updatedBy,
    },
  });
}

// ดึงการตั้งค่าการแจ้งเตือนทั้งหมดของโรงเรียน
async function findBySchoolId(schoolId: number) {
  return PrismaTimesheet.deviceMonitorSetting.findMany({
    where: { school_id: schoolId },
    select: { device_id: true, notify_enabled: true },
  });
}

// ดึงการตั้งค่าการแจ้งเตือนของหลายโรงเรียนพร้อมกัน
async function findBySchoolIds(schoolIds: number[]) {
  return PrismaTimesheet.deviceMonitorSetting.findMany({
    where: { school_id: { in: schoolIds } },
    select: { school_id: true, device_id: true, notify_enabled: true },
  });
}

export const deviceNotifyRepository = {
  upsertNotifySetting,
  findBySchoolId,
  findBySchoolIds,
};
