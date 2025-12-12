import dayjs from "dayjs";
import type {
  WorkingHoursResult,
  ProjectStatus,
} from "../types/sub-project.types";

export const calculateWorkingHours = (
  startDate?: string | Date,
  endDate?: string | Date
): WorkingHoursResult => {
  if (!startDate || !endDate)
    return { hours: 0, text: "ระบบคำนวณให้อัตโนมัติ" };

  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).startOf("day");

  if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
    return { hours: 0, text: "0 ชั่วโมง" };
  }

  let current = start.clone();
  let workingDays = 0;

  while (current.isBefore(end) || current.isSame(end, "day")) {
    const day = current.day();
    if (day !== 0 && day !== 6) workingDays += 1;
    current = current.add(1, "day");
  }

  const hours = workingDays * 8;
  return { hours, text: `${hours} ชั่วโมง` };
};

export const determineProjectStatus = (
  startDate?: string | Date,
  endDate?: string | Date
): ProjectStatus => {
  const today = dayjs().startOf("day");
  const s = startDate ? dayjs(startDate).startOf("day") : null;
  const e = endDate ? dayjs(endDate).startOf("day") : null;

  if (s && e && s.isValid() && e.isValid()) {
    if (today.isAfter(e))
      return { label: "สิ้นสุดแล้ว", status: "success", color: "green" };
    if (!s.isAfter(e) && !today.isBefore(s))
      return { label: "กำลังดำเนินการ", status: "processing", color: "blue" };
    return { label: "ยังไม่เริ่ม", status: "default", color: "default" };
  }
  return { label: "ยังไม่ระบุ", status: "default", color: "default" };
};

export const calculateProgress = (
  startDate?: string | Date,
  endDate?: string | Date
): number => {
  if (!startDate || !endDate) return 0;

  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const today = dayjs();

  if (today.isAfter(end)) return 100;
  if (today.isBefore(start)) return 0;

  const totalDuration = end.diff(start, "day");
  const elapsed = today.diff(start, "day");

  return totalDuration > 0 ? Math.round((elapsed / totalDuration) * 100) : 0;
};
