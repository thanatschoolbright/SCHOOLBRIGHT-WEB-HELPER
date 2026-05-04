import { NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { Service } from "@/services/backend/timesheet/entry.service";
import axios from "axios";
import { API_URL } from "@services/api-url";

type TimesheetEntry = {
  user_id: number | string;
  total_hours: number;
};

type TimesheetUser = {
  admin_id: number | string;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  email?: string;
  position?: string;
};

type TimesheetGap = TimesheetUser & {
  status: "ไม่ได้กรอกเลย" | "กรอกไม่ครบ";
  total_hours: number;
};

const TARGET_POSITIONS = new Set([
  "developer",
  "tester",
  "business development",
  "admin",
  "business analyst",
  "system analyst",
  "ux/ui",
]);

const normalizePosition = (position?: string) =>
  position ? position.trim().toLowerCase() : "";

const buildTimesheetGaps = (
  users: TimesheetUser[],
  entries: TimesheetEntry[],
  requiredHours = 8
): TimesheetGap[] => {
  if (!Array.isArray(users) || !Array.isArray(entries)) {
    return [];
  }

  const entryHoursByUser = entries.reduce<Map<string, number>>((acc, entry) => {
    const key = String(entry.user_id);
    if (!acc.has(key)) {
      acc.set(key, Number(entry.total_hours ?? 0));
    }
    return acc;
  }, new Map());

  return users.reduce<TimesheetGap[]>((acc, user) => {
    if (!TARGET_POSITIONS.has(normalizePosition(user.position))) {
      return acc;
    }

    const userKey = String(user.admin_id);
    const totalHours = entryHoursByUser.get(userKey);

    if (totalHours === undefined) {
      acc.push({
        ...user,
        status: "ไม่ได้กรอกเลย",
        total_hours: 0,
      });
      return acc;
    }

    if (totalHours < requiredHours) {
      acc.push({
        ...user,
        status: "กรอกไม่ครบ",
        total_hours: totalHours,
      });
    }

    return acc;
  }, []);
};

export async function GET() {
  try {
    const baseUrl =
      API_URL?.SB_HELPER_URL ?? process.env.SB_HELPER_URL;

    if (!baseUrl) {
      throw new Error("Missing SB Helper API base URL configuration");
    }

    const [entries, usersResponse] = await Promise.all([
      Service.findNotEntryToday(),
      axios.get(`${baseUrl}/api/v1/admin/user/`),
    ]);

    const rawUsers = usersResponse?.data?.data?.data;
    const users: TimesheetUser[] = Array.isArray(rawUsers) ? rawUsers : [];
    const validated = buildTimesheetGaps(
      users,
      Array.isArray(entries) ? entries : []
    );

    return NextResponse.json(
      successResponse({
        data: {
          records: validated,
          total: validated.length,
          generated_at: new Date().toISOString(),
        },
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Timesheet][who-not-entry]", message);

    return NextResponse.json(
      errorResponse({
        message_en: message,
        message_th: "เกิดข้อผิดพลาด",
        error,
      })
    );
  }
}
