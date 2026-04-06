import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  DailyNotifyService,
  TimesheetNotifyRecord,
} from "./_service/daily-notify-service";

// ====================================================================
// Validation Schema
// ====================================================================

const NotifySchema = z.object({
  records: z.array(
    z.object({
      admin_id: z.number(),
      full_name: z.string(),
      nickname: z.string().default(""),
      employee_code: z.string().default(""),
      position: z.string().default(""),
      department: z.string().default(""),
      total_hours: z.number(),
      required_hours: z.number(),
      hours_gap: z.number(),
      status_label: z.string().default(""),
      completion_rate: z.number(),
      progress_text: z.string().default(""),
    }),
  ),
  date_label: z.string().min(1),
  // mode: "all" | "email" | "discord" — default all
  mode: z.enum(["all", "email", "discord"]).default("all"),
  // recipients override (optional) — ถ้าไม่ส่งจะใช้ค่า default
  recipients: z
    .array(z.string().email())
    .optional()
    .default([
      "sa@schoolbright.co",
      "thanat.light@schoolbright.co",
      "narin@schoolbright.co",
      "tana.joe@schoolbright.co",
    ]),
});

// ====================================================================
// POST /api/v1/timesheet/report/daily-notify
// ====================================================================

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, NotifySchema);
  if (error) return error;

  const records = data.records as TimesheetNotifyRecord[];
  const { date_label, mode, recipients } = data;

  const result: {
    email: {
      success: boolean;
      accepted: string[] | undefined;
      error: string | undefined;
    };
    discord: { success: boolean; error: string | undefined };
    summary: {
      total: number;
      completed: number;
      incomplete: number;
      date_range: string;
    };
  } = {
    email: { success: false, accepted: undefined, error: undefined },
    discord: { success: false, error: undefined },
    summary: {
      total: records.length,
      completed: records.filter((r: TimesheetNotifyRecord) => r.hours_gap <= 0)
        .length,
      incomplete: records.filter((r: TimesheetNotifyRecord) => r.hours_gap > 0)
        .length,
      date_range: date_label,
    },
  };

  // ส่งอีเมล
  if (mode === "all" || mode === "email") {
    result.email = await DailyNotifyService.sendEmail(
      records,
      date_label,
      recipients,
    );
  }

  // ส่ง Discord
  if (mode === "all" || mode === "discord") {
    result.discord = await DailyNotifyService.sendDiscord(records, date_label);
  }

  const anySuccess = result.email.success || result.discord.success;

  if (!anySuccess) {
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "ส่งการแจ้งเตือนไม่สำเร็จทุกช่องทาง",
        message_en: "Failed to send all notifications",
        error: { email: result.email.error, discord: result.discord.error },
      }),
      { status: 500 },
    );
  }

  return NextResponse.json(
    successResponse({
      data: result,
      message_th: "ส่งการแจ้งเตือนเรียบร้อยแล้ว",
      message_en: "Notifications sent successfully",
    }),
  );
}
