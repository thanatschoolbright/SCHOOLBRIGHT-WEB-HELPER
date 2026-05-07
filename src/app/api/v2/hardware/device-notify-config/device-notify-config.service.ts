import { AppError } from "@/helpers/api/app-error";
import type {
  CreateTimeWindowDTO,
  UpdateIntervalDTO,
  UpdateTimeWindowDTO,
} from "./device-notify-config.schema";
import { deviceNotifyConfigRepository } from "./device-notify-config.repository";

const MAX_TIME_WINDOWS = 3;

// ✨ ดึงการตั้งค่าช่วงเวลาและช่วงห่างของโรงเรียน (lazy seed หากยังไม่มีข้อมูล)
async function getConfigBySchool(schoolId: number) {
  const [time_windows, intervals] = await Promise.all([
    deviceNotifyConfigRepository.findTimeWindowsBySchool(schoolId),
    deviceNotifyConfigRepository.findIntervalsBySchool(schoolId),
  ]);
  return { time_windows, intervals };
}

// ✨ อัปเดตช่วงเวลาแจ้งเตือนตาม id — ตรวจสอบว่า id อยู่ใน school_id ที่ระบุ
async function updateTimeWindow(
  id: number,
  schoolId: number,
  dto: UpdateTimeWindowDTO,
  updatedBy: number | null,
) {
  const windows = await deviceNotifyConfigRepository.findTimeWindowsBySchool(schoolId);
  if (!windows.find((w) => w.id === id)) {
    throw new AppError(404, `ไม่พบช่วงเวลาแจ้งเตือน id ${id} ของโรงเรียนนี้`);
  }
  return deviceNotifyConfigRepository.updateTimeWindow(id, { ...dto, updated_by: updatedBy });
}

// ✨ เพิ่มรอบการแจ้งเตือนใหม่ให้โรงเรียน — จำกัดสูงสุด 3 รอบ
async function createTimeWindow(
  schoolId: number,
  dto: CreateTimeWindowDTO,
  updatedBy: number | null,
) {
  const count = await deviceNotifyConfigRepository.countTimeWindowsBySchool(schoolId);
  if (count >= MAX_TIME_WINDOWS) {
    throw new AppError(422, `กำหนดได้สูงสุด ${MAX_TIME_WINDOWS} รอบต่อโรงเรียน`);
  }
  const nextRound = count + 1;
  return deviceNotifyConfigRepository.createTimeWindow({
    school_id: schoolId,
    round: nextRound,
    ...dto,
  });
  void updatedBy; // updated_by ยังไม่มีใน create — สำหรับ audit trail ในอนาคต
}

// ✨ ลบรอบการแจ้งเตือนตาม id — ตรวจสอบ ownership และห้ามลบเหลือน้อยกว่า 1 รอบ
async function deleteTimeWindow(id: number, schoolId: number) {
  const windows = await deviceNotifyConfigRepository.findTimeWindowsBySchool(schoolId);
  if (!windows.find((w) => w.id === id)) {
    throw new AppError(404, `ไม่พบช่วงเวลาแจ้งเตือน id ${id} ของโรงเรียนนี้`);
  }
  if (windows.length <= 1) {
    throw new AppError(422, "ต้องมีช่วงเวลาแจ้งเตือนอย่างน้อย 1 รอบ");
  }
  return deviceNotifyConfigRepository.deleteTimeWindow(id);
}

// ✨ อัปเดตช่วงห่างการแจ้งเตือนตาม id — ตรวจสอบ ownership
async function updateInterval(
  id: number,
  schoolId: number,
  dto: UpdateIntervalDTO,
  updatedBy: number | null,
) {
  const intervals = await deviceNotifyConfigRepository.findIntervalsBySchool(schoolId);
  if (!intervals.find((v) => v.id === id)) {
    throw new AppError(404, `ไม่พบช่วงห่างการแจ้งเตือน id ${id} ของโรงเรียนนี้`);
  }
  return deviceNotifyConfigRepository.updateInterval(id, { ...dto, updated_by: updatedBy });
}

export const deviceNotifyConfigService = {
  getConfigBySchool,
  updateTimeWindow,
  createTimeWindow,
  deleteTimeWindow,
  updateInterval,
};
