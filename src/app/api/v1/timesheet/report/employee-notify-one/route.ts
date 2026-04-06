import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmployeeEmailOne } from "./_service/employee-notify-one-service";

// ====================================================================
// Schema
// ====================================================================

const EmployeeNotifyOneSchema = z.object({
  // รหัสพนักงานที่ต้องการส่งอีเมล
  admin_id: z.number().int().positive(),
  // label วันที่สำหรับแสดงในอีเมล
  date_label: z.string().optional(),
});

// ====================================================================
// POST /api/v1/timesheet/report/employee-notify-one
// ส่งอีเมลแจ้งเตือนพนักงานทีละ 1 คน ใช้กับ front-end one-by-one flow
// ====================================================================

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(
    request,
    EmployeeNotifyOneSchema,
  );
  if (error) return error;

  const dateLabel =
    data.date_label ??
    new Date().toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  try {
    const result = await sendEmployeeEmailOne(data.admin_id, dateLabel);

    if (result.skipped) {
      return NextResponse.json(
        successResponse({
          data: { skipped: true, reason: result.reason },
          message_th: result.reason ?? "ข้ามรายการนี้",
        }),
      );
    }

    if (!result.success) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_th: "ส่งอีเมลไม่สำเร็จ",
          error: result.error,
        }),
        { status: 500 },
      );
    }

    return NextResponse.json(
      successResponse({
        data: { admin_id: data.admin_id, email: result.email },
        message_th: "ส่งอีเมลแจ้งเตือนสำเร็จ",
      }),
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[employee-notify-one][POST]", err);
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการส่งอีเมล",
        error: message,
      }),
      { status: 500 },
    );
  }
}
