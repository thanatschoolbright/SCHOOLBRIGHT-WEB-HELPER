import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { Service } from "@/services/backend/timesheet/entry.service";
import { API_URL } from "@services/api-url";
import axios from "axios";
import { NextResponse } from "next/server";
import { z } from "zod";

const WORKING_HOURS_PER_DAY = 8;
const WEEKDAY_LABEL_TH = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

interface TimesheetUser {
  admin_id: number | string;
  employee_code?: string;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  email?: string;
  position?: string;
  tel?: string | null;
}

interface TimesheetEntryRow {
  createdBy: number | null;
  hours: any;
  date: Date;
  description?: string | null;
  feature?: {
    name: string;
    name_en: string | null;
    backlogDescription?: any;
  };
  project?: {
    name: string;
    name_en: string | null;
  };
}

const getThaiWeekday = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`);
  return WEEKDAY_LABEL_TH[date.getDay()] ?? "";
};

const formatThaiDate = (date: Date) =>
  date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const formatHoursText = (value: number) =>
  Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);

const enforceValidRange = (start: Date, end: Date) => {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("กรุณาระบุช่วงเวลาที่ถูกต้อง");
  }

  if (start > end) {
    throw new Error("วันเริ่มต้นต้องไม่น้อยกว่าวันสิ้นสุด");
  }

  return {
    start: new Date(start.setHours(0, 0, 0, 0)),
    end: new Date(end.setHours(23, 59, 59, 999)),
  };
};

const DateStringSchema = z
  .string()
  .min(1, { message: "จำเป็นต้องระบุวันที่" })
  .transform((value) => {
    const trimmed = value.trim();
    const isoCandidate = new Date(trimmed);
    if (!Number.isNaN(isoCandidate.getTime())) {
      return isoCandidate;
    }

    const yearFirstMatch = trimmed.match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})$/);
    if (yearFirstMatch) {
      const [, year, month, day] = yearFirstMatch;
      return new Date(`${year}-${month}-${day}T00:00:00`);
    }

    const dayFirstMatch = trimmed.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
    if (dayFirstMatch) {
      const [, day, month, year] = dayFirstMatch;
      return new Date(`${year}-${month}-${day}T00:00:00`);
    }

    throw new Error(
      "รูปแบบวันที่ไม่ถูกต้อง (รองรับ yyyy/mm/dd หรือ dd/mm/yyyy)",
    );
  })
  .refine((date) => !Number.isNaN(date.getTime()), {
    message: "รูปแบบวันที่ไม่ถูกต้อง",
  });

const RequestBodySchema = z.object({
  start_date: DateStringSchema,
  end_date: DateStringSchema,
  department_id: z.number().optional().nullable(),
  department_ids: z.array(z.number()).optional().nullable(),
});

const aggregateEntriesByUser = (entries: TimesheetEntryRow[]) => {
  const map = new Map<
    string,
    {
      total: number;
      breakdown: Map<string, number>;
      entries: Array<{
        date: Date;
        description: string;
        backlogDescription: any;
        hours: number;
        project_name: string;
        feature_name: string;
      }>;
    }
  >();

  entries.forEach((row) => {
    if (row.createdBy == null) return;

    const key = String(row.createdBy);
    const bucket = map.get(key) ?? {
      total: 0,
      breakdown: new Map<string, number>(),
      entries: [],
    };

    const isoDate = toISODate(new Date(row.date));
    const hours = Number(row.hours) || 0;

    bucket.total += hours;
    bucket.breakdown.set(isoDate, (bucket.breakdown.get(isoDate) ?? 0) + hours);

    // Collect details
    bucket.entries.push({
      date: row.date,
      description: row.description || "",
      backlogDescription: row.feature?.backlogDescription,
      hours: hours,
      project_name: row.project?.name_en || row.project?.name || "-",
      feature_name: row.feature?.name_en || row.feature?.name || "-",
    });

    map.set(key, bucket);
  });

  return map;
};

const makeBreakdownRows = (breakdown?: Map<string, number>) => {
  if (!breakdown) return [];

  return Array.from(breakdown.entries())
    .map(([date, hours]) => ({
      date,
      weekday_th: getThaiWeekday(date),
      hours: Number(hours.toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const computeExpectedHours = (
  start: Date,
  end: Date,
  joinedDate?: Date | null,
  resignedDate?: Date | null,
) => {
  const actualStart =
    joinedDate && joinedDate > start
      ? new Date(joinedDate.setHours(0, 0, 0, 0))
      : start;
  const actualEnd =
    resignedDate && resignedDate < end
      ? new Date(resignedDate.setHours(23, 59, 59, 999))
      : end;

  // ตรวจสอบว่าพนักงานเริ่มงานหรือยัง หรือลาออกไปก่อนช่วงที่ระบุหรือไม่
  if (
    actualStart > end ||
    (resignedDate && resignedDate < start) ||
    actualStart > actualEnd
  ) {
    return { workingDays: 0, expectedHours: 0, hasStarted: false };
  }

  const cursor = new Date(actualStart);
  let workingDays = 0;

  while (cursor <= actualEnd) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) {
      workingDays += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    workingDays,
    expectedHours: workingDays * WORKING_HOURS_PER_DAY,
    hasStarted: true,
  };
};

const buildSummaryRecords = (
  users: any[],
  entries: TimesheetEntryRow[],
  globalStart: Date,
  globalEnd: Date,
) => {
  const aggregated = aggregateEntriesByUser(entries);

  const records = users
    .map((user) => {
      const { expectedHours, hasStarted } = computeExpectedHours(
        globalStart,
        globalEnd,
        user.joined_date,
        user.resigned_date,
      );

      const key = String(user.admin_id);
      const aggregatedData = aggregated.get(key);
      const totalHours = aggregatedData?.total ?? 0;

      // Skip users who have already resigned and have no data in the selected period to keep the list relevant
      if (user.status !== "ACTIVE" && totalHours === 0 && expectedHours === 0) {
        return null;
      }

      const roundedHours = Number(totalHours.toFixed(2));
      const hoursGap = Number((expectedHours - roundedHours).toFixed(2));

      const statusLabel =
        hoursGap > 0
          ? `ขาด ${formatHoursText(hoursGap)} ชั่วโมง`
          : hoursGap < 0
            ? `เกิน ${formatHoursText(Math.abs(hoursGap))} ชั่วโมง`
            : "ครบ";

      const completionRate = expectedHours
        ? Number(((roundedHours / expectedHours) * 100).toFixed(2))
        : 0;

      const positionName =
        user.position_ref?.name_th ||
        user.position_ref?.name_en ||
        user.position ||
        "-";

      const departmentName =
        user.department?.name_th || user.department?.name_en || "-";

      return {
        admin_id: user.admin_id,
        full_name:
          [user.firstname_th, user.lastname_th]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          user.username ||
          "-",
        nickname: user.nickname ?? null,
        employee_code: user.employee_code ?? null,
        position: positionName,
        department: departmentName,
        email: user.email ?? null,
        tel: user.phone ?? null,
        image_profile: user.profile_image_path ?? null,
        joined_date: user.joined_date ? toISODate(user.joined_date) : null,
        resigned_date: user.resigned_date
          ? toISODate(user.resigned_date)
          : null,
        has_started: hasStarted,
        total_hours: roundedHours,
        required_hours: expectedHours,
        hours_gap: hoursGap,
        status_label: statusLabel,
        completion_rate: completionRate,
        progress_text: `${formatHoursText(roundedHours)}/${formatHoursText(
          expectedHours,
        )} ชั่วโมง`,
        breakdown: makeBreakdownRows(aggregatedData?.breakdown),
        entries: aggregatedData?.entries
          ? aggregatedData.entries
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .map((e: any) => ({
                ...e,
                date_str: formatThaiDate(e.date),
              }))
          : [],
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return records
    .sort((a, b) => b.total_hours - a.total_hours)
    .map((record, index) => ({ ...record, rank: index + 1 }));
};

const extractAxiosMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message_th?: string; message_en?: string; message?: string }
      | undefined;
    return (
      data?.message_th ||
      data?.message_en ||
      data?.message ||
      error.message ||
      "ไม่สามารถเชื่อมต่อบริการภายนอกได้"
    );
  }

  return error instanceof Error ? error.message : "Unexpected error";
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      start_date: startDate,
      end_date: endDate,
      department_id,
      department_ids,
    } = RequestBodySchema.parse(body);

    const { start, end } = enforceValidRange(startDate, endDate);
    const { workingDays, expectedHours } = computeExpectedHours(start, end);

    const baseUrl =
      API_URL?.SB_HELPER_URL ?? process.env.NEXT_PUBLIC_SB_HELPER_URL;

    if (!baseUrl) {
      throw new Error("Missing SB Helper API base URL configuration");
    }

    const entries = await Service.findEntriesBetween(start, end, true);

    // ⚡ เปลี่ยนจากการเรียก API ภายนอกมาเป็น Query จาก DB โดยตรง (Direct DB Query for maximum reliability)
    const users = (await PrismaTimesheet.user.findMany({
      where: {
        is_deleted: false,
        // Include both ACTIVE and RESIGNED users to ensure total hours match audit reports
        ...(department_ids && department_ids.length > 0
          ? { department_id: { in: department_ids } }
          : department_id
            ? { department_id }
            : {}),
      },
      include: {
        position_ref: true,
        department: true,
      },
    })) as any[];

    const summaryRecords = buildSummaryRecords(
      users,
      (entries ?? []) as TimesheetEntryRow[],
      start,
      end,
    );

    const totalExpectedHoursAllMembers = summaryRecords.reduce(
      (sum, record) => sum + record.required_hours,
      0,
    );

    return NextResponse.json(
      successResponse({
        data: {
          records: summaryRecords,
          metadata: {
            range: {
              start_date: start.toISOString(),
              end_date: end.toISOString(),
              label_th: `${formatThaiDate(start)} - ${formatThaiDate(end)}`,
            },
            working_days: workingDays,
            expected_hours_per_member: expectedHours,
            total_expected_hours_all_members: totalExpectedHoursAllMembers,
            generated_at: new Date().toISOString(),
            notes:
              "รวมชั่วโมงเฉพาะวันทำงาน (จันทร์-ศุกร์) ปรับลดตามวันที่พนักงานเริ่มงานจริง",
          },
        },
      }),
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_th: error.issues.map((issue) => issue.message).join(", "),
          message_en: "Invalid request payload",
          error,
        }),
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Timesheet][summary]", message);

    return NextResponse.json(
      errorResponse({
        message_en: message,
        message_th: "เกิดข้อผิดพลาด",
        error,
      }),
    );
  }
}
