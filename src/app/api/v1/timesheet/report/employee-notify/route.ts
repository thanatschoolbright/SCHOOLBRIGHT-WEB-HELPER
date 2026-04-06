import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EmployeeNotifyService } from "./_service/employee-notify-service";

// ====================================================================
// Schema
// ====================================================================

const EmployeeNotifySchema = z.object({
  // กรองเฉพาะแผนกที่ระบุ (optional — ถ้าไม่ส่งจะดึงทุกแผนก)
  department_ids: z.array(z.number()).optional().default([]),
  // date label สำหรับแสดงในอีเมล (optional — ถ้าไม่ส่งจะใช้วันนี้)
  date_label: z.string().optional(),
  // dry_run: true = ดูแค่รายชื่อ ไม่ส่งจริง
  dry_run: z.boolean().optional().default(false),
});

// ====================================================================
// POST /api/v1/timesheet/report/employee-notify
// ====================================================================

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, EmployeeNotifySchema);
  if (error) return error;

  const { department_ids, dry_run } = data;

  const dateLabel =
    data.date_label ??
    new Date().toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  try {
    // ดึงรายชื่อพนักงานที่ยังไม่กรอก/กรอกไม่ครบ
    const targets = await EmployeeNotifyService.queryTargets(
      department_ids.length > 0 ? department_ids : undefined,
    );

    // dry_run — แค่ return รายชื่อ ไม่ส่งจริง
    if (dry_run) {
      return NextResponse.json(
        successResponse({
          data: {
            dry_run: true,
            total_targets: targets.length,
            targets: targets.map((t) => ({
              admin_id: t.admin_id,
              full_name: t.full_name,
              email: t.email,
              total_hours: t.total_hours,
              status: t.status,
            })),
          },
          message_th: `[Dry Run] พบพนักงานที่ต้องแจ้งเตือน ${targets.length} คน`,
        }),
      );
    }

    if (targets.length === 0) {
      return NextResponse.json(
        successResponse({
          data: { total_targets: 0, sent: 0 },
          message_th: "พนักงานทุกคนกรอก Timesheet ครบแล้ว ไม่มีการแจ้งเตือน",
        }),
      );
    }

    // ส่งอีเมลแจ้งเตือนพนักงาน
    const result = await EmployeeNotifyService.sendToAll(targets, dateLabel);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: `ส่งแจ้งเตือนพนักงานเรียบร้อย — ส่งสำเร็จ ${result.sent}/${result.total_targets} คน`,
      }),
    );
  } catch (err: any) {
    console.error("[employee-notify][POST]", err);
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการส่งแจ้งเตือนพนักงาน",
        error: err?.message,
      }),
      { status: 500 },
    );
  }
}
