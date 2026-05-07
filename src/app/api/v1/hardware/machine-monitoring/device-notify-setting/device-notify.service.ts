import type { ToggleDeviceNotifyDTO } from "./device-notify.schema";
import { deviceNotifyRepository } from "./device-notify.repository";

// บันทึกการเปิด/ปิดการแจ้งเตือนของอุปกรณ์
async function toggleDeviceNotify(dto: ToggleDeviceNotifyDTO, updatedBy: number | null) {
  return deviceNotifyRepository.upsertNotifySetting(dto, updatedBy);
}

export const deviceNotifyService = {
  toggleDeviceNotify,
};
