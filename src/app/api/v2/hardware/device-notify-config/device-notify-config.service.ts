import { AppError } from "@/helpers/api/app-error";
import type { UpdateIntervalDTO, UpdateTimeWindowDTO } from "./device-notify-config.schema";
import { deviceNotifyConfigRepository } from "./device-notify-config.repository";

// ✨ ดึงการตั้งค่าช่วงเวลาและช่วงห่างทั้งหมด
async function getConfig() {
  const [time_windows, intervals] = await Promise.all([
    deviceNotifyConfigRepository.findAllTimeWindows(),
    deviceNotifyConfigRepository.findAllIntervals(),
  ]);
  return { time_windows, intervals };
}

// ✨ อัปเดตช่วงเวลาแจ้งเตือนตาม id — ตรวจสอบว่า id มีอยู่ก่อน
async function updateTimeWindow(id: number, dto: UpdateTimeWindowDTO, updatedBy: number | null) {
  const windows = await deviceNotifyConfigRepository.findAllTimeWindows();
  const existing = windows.find((w) => w.id === id);
  if (!existing) throw new AppError(404, `ไม่พบช่วงเวลาแจ้งเตือน id ${id}`);
  return deviceNotifyConfigRepository.updateTimeWindow(id, { ...dto, updated_by: updatedBy });
}

// ✨ อัปเดตช่วงห่างการแจ้งเตือนตาม id — ตรวจสอบว่า id มีอยู่ก่อน
async function updateInterval(id: number, dto: UpdateIntervalDTO, updatedBy: number | null) {
  const intervals = await deviceNotifyConfigRepository.findAllIntervals();
  const existing = intervals.find((v) => v.id === id);
  if (!existing) throw new AppError(404, `ไม่พบช่วงห่างการแจ้งเตือน id ${id}`);
  return deviceNotifyConfigRepository.updateInterval(id, { ...dto, updated_by: updatedBy });
}

export const deviceNotifyConfigService = {
  getConfig,
  updateTimeWindow,
  updateInterval,
};
