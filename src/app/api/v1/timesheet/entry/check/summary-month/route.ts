import { NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";

import { successResponse, errorResponse } from "@/helpers/api/response";
import { Service } from "@/services/backend/timesheet/entry.service";
import { API_URL } from "@services/api-url";

const HOURS_PER_WORKDAY = 8;

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
});

//** Utility: เพิ่มวันโดยไม่แก้ไขต้นฉบับ
const addDays = (date: Date, amount: number) =>
  new Date(date.getTime() + amount * 86_400_000);

//** Utility: yyyy-mm-dd สำหรับ metadata
const toISODate = (date: Date) => date.toISOString().slice(0, 10);

//** Utility: label เดือนภาษาไทย (เช่น "ตุลาคม 2568")
const toThaiMonthYear = (date: Date) =>
  date.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

//** คำนวณวันทำงาน (จันทร์-ศุกร์) และชั่วโมงที่คาดหวังในช่วงที่ให้มา
const computeWorkingDays = (start: Date, end: Date) => {
  let workingDays = 0;
  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor = addDays(cursor, 1)
  ) {
    const day = cursor.getDay();
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

//** สร้างช่วงวันที่ของเดือน พร้อมจำกัดว่าไม่เกินวันปัจจุบัน
const buildEffectivePeriod = (month: string, year: string) => {
  const monthIndex = Number(month) - 1;
  const yearNumber = Number(year);

  if (Number.isNaN(monthIndex) || Number.isNaN(yearNumber)) {
    throw new Error("รูปแบบเดือนหรือปีไม่ถูกต้อง");
  }

  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error("รูปแบบเดือนหรือปีไม่ถูกต้อง");
  }

  const startOfMonth = new Date(Date.UTC(yearNumber, monthIndex, 1));
  const endOfMonth = new Date(
    Date.UTC(yearNumber, monthIndex + 1, 0, 23, 59, 59, 999)
  );

  const today = new Date();
  const isRequestMonthCurrent =
    today.getUTCFullYear() === yearNumber && today.getUTCMonth() === monthIndex;

  const effectiveEnd = isRequestMonthCurrent
    ? new Date(
        Date.UTC(yearNumber, monthIndex, today.getUTCDate(), 23, 59, 59, 999)
      )
    : endOfMonth;

  if (effectiveEnd < startOfMonth) {
    throw new Error("ยังไม่ถึงช่วงเวลาที่ร้องขอ");
  }

  return {
    startOfMonth,
    effectiveEnd,
    label: toThaiMonthYear(startOfMonth),
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
    const { month, year } = MonthYearSchema.parse(rawBody);

    const { startOfMonth, effectiveEnd, label } = buildEffectivePeriod(
      month,
      year
    );

    const { workingDays, expectedHours } = computeWorkingDays(
      startOfMonth,
      effectiveEnd
    );

    const baseUrl =
      API_URL?.SB_HELPER_URL ?? process.env.NEXT_PUBLIC_SB_HELPER_URL;
    if (!baseUrl) {
      throw new Error("Missing SB Helper API base URL configuration");
    }

    const entries = await Service.findEntriesBetween(
      startOfMonth,
      effectiveEnd
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
                start_date: toISODate(startOfMonth),
                end_date: toISODate(effectiveEnd),
                label_th: label,
              },
              working_days: workingDays,
              expected_hours_per_member: expectedHours,
              generated_at: new Date().toISOString(),
              notes:
                "รวบรวมเฉพาะวันทำงานที่ผ่านไปแล้วในเดือนที่เลือก เพื่อความยุติธรรม",
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
