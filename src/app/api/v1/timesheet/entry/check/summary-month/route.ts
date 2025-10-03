import { NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";

import { successResponse, errorResponse } from "@/helpers/api/response";
import { Service } from "@/services/backend/timesheet/entry.service";
import { API_URL } from "@services/api-url";

const HOURS_PER_WORKDAY = 8;
// Default to Bangkok (+07:00) unless overridden
const TZ_OFFSET_MINUTES = Number(
  process.env.TIMESHEET_TZ_OFFSET_MINUTES ?? 420
);

type TimesheetEntryRow = {
  createdBy: number | null;
  hours: any;
  date: Date;
};

type TimesheetUser = {
  admin_id: number | string;
  firstname?: string;
  lastname?: string;
  nickname?: string | null;
  email?: string | null;
  tel?: string | null;
  employee_code?: string | null;
  position?: string | null;
};

//** ตรวจสอบ month/year ให้เป็นสตริง 2/4 หลัก
const MonthYearSchema = z.object({
  month: z
    .string()
    .min(1, "กรุณาระบุเดือน")
    .transform((value) => value.padStart(2, "0")),
  year: z
    .string()
    .min(4, "กรุณาระบุปี")
    .transform((value) => value.padStart(4, "0")),
  // scope: "elapsed" = up to today (default), "full" = entire month
  scope: z.enum(["elapsed", "full"]).optional().default("elapsed"),
});

//** Utility: เพิ่มวันโดยไม่แก้ไขต้นฉบับ
const addDays = (date: Date, amount: number) =>
  new Date(date.getTime() + amount * 86_400_000);

//** Utility: yyyy-mm-dd สำหรับ metadata (local by TZ offset)
const toISODateLocal = (utc: Date, offsetMinutes = TZ_OFFSET_MINUTES) => {
  const local = new Date(utc.getTime() + offsetMinutes * 60_000);
  return local.toISOString().slice(0, 10);
};

//** Utility: label เดือนภาษาไทย (เช่น "ตุลาคม 2568")
const toThaiMonthYear = (date: Date) =>
  date.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

//** คำนวณวันทำงานตามเวลาท้องถิ่นที่กำหนด (จันทร์-ศุกร์)
const computeWorkingDaysLocal = (
  startUtc: Date,
  endUtc: Date,
  offsetMinutes = TZ_OFFSET_MINUTES
) => {
  let workingDays = 0;
  // เดินวันแบบ local date โดยเลื่อน cursor เป็น local time
  for (
    let localCursor = new Date(startUtc.getTime() + offsetMinutes * 60_000);
    localCursor <= new Date(endUtc.getTime() + offsetMinutes * 60_000);
    localCursor = addDays(localCursor, 1)
  ) {
    const day = localCursor.getDay();
    if (day >= 1 && day <= 5) workingDays += 1;
  }
  return { workingDays, expectedHours: workingDays * HOURS_PER_WORKDAY };
};

//** รวมชั่วโมงของผู้ใช้ในแต่ละเดือน
const aggregateEntries = (entries: TimesheetEntryRow[]) => {
  const map = new Map<string, number>();
  entries.forEach((entry) => {
    if (entry.createdBy == null) return;
    const key = String(entry.createdBy);
    map.set(key, (map.get(key) ?? 0) + Number(entry.hours ?? 0));
  });
  return map;
};

//** เกณฑ์การให้ Rank รายเดือน A-E
const determineMonthlyRank = (rate: number) => {
  if (rate >= 100)
    return { grade: "A" as const, description: "ทำครบหรือเกินเป้าในเดือนนี้" };
  if (rate >= 85)
    return {
      grade: "B" as const,
      description: "ใกล้เคียงครบเป้า เหลืออีกเล็กน้อย",
    };
  if (rate >= 70)
    return { grade: "C" as const, description: "ทำได้ตามแผนพอสมควร" };
  if (rate >= 50)
    return { grade: "D" as const, description: "ยังทำไม่ครบ ต้องเร่งปรับปรุง" };
  return {
    grade: "E" as const,
    description: "มีความเสี่ยงสูง ต้องติดตามอย่างใกล้ชิด",
  };
};

//** แปลง Axios error ให้เป็นข้อความที่อ่านง่าย
const describeAxiosError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | { message?: string; message_th?: string; message_en?: string }
      | undefined;
    return (
      payload?.message_th ||
      payload?.message_en ||
      payload?.message ||
      error.message ||
      "ไม่สามารถเชื่อมต่อบริการภายนอกได้"
    );
  }
  return error instanceof Error ? error.message : "Unexpected error";
};

//** สร้างช่วงวันที่ของเดือน แบบยึดเวลาท้องถิ่น (เช่น Asia/Bangkok)
//   และจำกัดว่าไม่เกินวันปัจจุบัน (ถ้า scope = elapsed)
const buildEffectivePeriod = (
  month: string,
  year: string,
  scope: "elapsed" | "full"
) => {
  const monthIndex = Number(month) - 1;
  const yearNumber = Number(year);

  if (Number.isNaN(monthIndex) || Number.isNaN(yearNumber)) {
    throw new Error("รูปแบบเดือนหรือปีไม่ถูกต้อง");
  }

  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error("รูปแบบเดือนหรือปีไม่ถูกต้อง");
  }

  // คำนวณขอบเขตเดือนใน local time แล้วแปลงเป็น UTC
  const offsetMs = TZ_OFFSET_MINUTES * 60_000;
  // Local start: YYYY-MM-01T00:00:00 local -> UTC = local - offset
  const startLocalToUtc = new Date(
    Date.UTC(yearNumber, monthIndex, 1, 0, 0, 0, 0) - offsetMs
  );
  // Local next month start: YYYY-MM+1-01T00:00:00 local -> UTC
  const nextMonthStartLocalToUtc = new Date(
    Date.UTC(yearNumber, monthIndex + 1, 1, 0, 0, 0, 0) - offsetMs
  );
  // Local end of month = nextMonthStart - 1 ms (still in UTC timeline)
  const endLocalToUtc = new Date(nextMonthStartLocalToUtc.getTime() - 1);

  // Current local time: nowUTC -> local by adding offset
  const nowUtc = new Date();
  const nowLocal = new Date(nowUtc.getTime() + offsetMs);
  const isRequestMonthCurrent =
    nowLocal.getFullYear() === yearNumber && nowLocal.getMonth() === monthIndex;

  // Local end of today (23:59:59.999 local), then convert back to UTC
  const endOfTodayLocal = new Date(
    nowLocal.getFullYear(),
    nowLocal.getMonth(),
    nowLocal.getDate(),
    23,
    59,
    59,
    999
  );
  const endOfTodayLocalToUtc = new Date(endOfTodayLocal.getTime() - offsetMs);

  const effectiveEnd =
    scope === "full"
      ? endLocalToUtc
      : isRequestMonthCurrent
      ? new Date(
          Math.min(endLocalToUtc.getTime(), endOfTodayLocalToUtc.getTime())
        )
      : endLocalToUtc;

  if (effectiveEnd < startLocalToUtc) {
    throw new Error("ยังไม่ถึงช่วงเวลาที่ร้องขอ");
  }

  return {
    startOfMonthUtc: startLocalToUtc,
    effectiveEndUtc: effectiveEnd,
    endOfMonthUtc: endLocalToUtc,
    label: toThaiMonthYear(
      // สร้าง label จาก local start
      new Date(startLocalToUtc.getTime() + offsetMs)
    ),
  };
};

//** ดึงข้อมูลผู้ใช้จาก SB Helper
const fetchTimesheetUsers = async (
  baseUrl: string
): Promise<TimesheetUser[]> => {
  const response = await axios.get(`${baseUrl}/api/v1/admin/user/`);
  const rawUsers = response?.data?.data?.data;
  return Array.isArray(rawUsers) ? (rawUsers as TimesheetUser[]) : [];
};

//** สร้างข้อมูลสรุปต่อผู้ใช้ พร้อมจัดอันดับ
const buildMonthlyRecords = (
  users: TimesheetUser[],
  totalsByUser: Map<string, number>,
  expectedHours: number
) =>
  users
    .map((user) => {
      const key = String(user.admin_id);
      const totalHours = totalsByUser.get(key) ?? 0;
      const completionRate = expectedHours
        ? Number(((totalHours / expectedHours) * 100).toFixed(2))
        : 0;
      const rank = determineMonthlyRank(completionRate);

      return {
        admin_id: user.admin_id,
        full_name:
          [user.firstname, user.lastname].filter(Boolean).join(" ").trim() ||
          "-",
        nickname: user.nickname ?? null,
        employee_code: user.employee_code ?? null,
        position: user.position ?? "-",
        email: user.email ?? null,
        tel: user.tel ?? null,
        total_hours: Number(totalHours.toFixed(2)),
        expected_hours: expectedHours,
        completion_rate: completionRate,
        rank: rank.grade,
        rank_description: rank.description,
      };
    })
    .sort((a, b) => b.completion_rate - a.completion_rate)
    .map((record, index) => ({ ...record, order: index + 1 }));

//** Endpoint หลัก: รับ month/year แล้วสรุป Rank รายเดือนของทุกคน
export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const { month, year, scope } = MonthYearSchema.parse(rawBody);

    const { startOfMonthUtc, effectiveEndUtc, endOfMonthUtc, label } =
      buildEffectivePeriod(month, year, scope);

    const { workingDays, expectedHours } = computeWorkingDaysLocal(
      startOfMonthUtc,
      effectiveEndUtc,
      TZ_OFFSET_MINUTES
    );

    const baseUrl =
      API_URL?.SB_HELPER_URL ?? process.env.NEXT_PUBLIC_SB_HELPER_URL;
    if (!baseUrl) {
      throw new Error("Missing SB Helper API base URL configuration");
    }

    const entries = await Service.findEntriesBetween(
      startOfMonthUtc,
      effectiveEndUtc
    );

    try {
      const users = await fetchTimesheetUsers(baseUrl);
      const totalsByUser = aggregateEntries(entries as TimesheetEntryRow[]);
      const records = buildMonthlyRecords(users, totalsByUser, expectedHours);

      return NextResponse.json(
        successResponse({
          data: {
            records,
            metadata: {
              range: {
                start_date: toISODateLocal(startOfMonthUtc),
                end_date: toISODateLocal(effectiveEndUtc),
                label_th: label,
              },
              mode: scope === "full" ? "full_month" : "elapsed_to_date",
              working_days: workingDays,
              expected_hours_per_member: expectedHours,
              // For clarity, also include the full-month expectation
              working_days_full_month: computeWorkingDaysLocal(
                startOfMonthUtc,
                endOfMonthUtc,
                TZ_OFFSET_MINUTES
              ).workingDays,
              expected_hours_full_month: computeWorkingDaysLocal(
                startOfMonthUtc,
                endOfMonthUtc,
                TZ_OFFSET_MINUTES
              ).expectedHours,
              generated_at: new Date().toISOString(),
              notes:
                scope === "full"
                  ? "สรุปทั้งเดือน (รวมวันอนาคตด้วย)"
                  : "รวบรวมเฉพาะวันทำงานที่ผ่านไปแล้วในเดือนที่เลือก เพื่อความยุติธรรม",
            },
          },
        })
      );
    } catch (userError) {
      const message = describeAxiosError(userError);
      console.error("[Timesheet][summary-month] fetch users", message);
      return NextResponse.json(
        errorResponse({
          status: 502,
          message_en: "Failed to fetch user directory from SB Helper",
          message_th: "ไม่สามารถโหลดข้อมูลผู้ใช้จาก SB Helper ได้",
          error: userError,
        }),
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_th: error.issues.map((issue) => issue.message),
          message_en: "Invalid request payload",
          error,
        }),
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Timesheet][summary-month]", message, error);

    return NextResponse.json(
      errorResponse({
        message_en: message,
        message_th: "เกิดข้อผิดพลาด",
        error,
      })
    );
  }
}
