import { successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { handleError } from "@helpers/controller/handle-error.params";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { CreateOvertimeInput } from "@services/overtime/overtime.service";
import { NextRequest, NextResponse } from "next/server";
import { createOvertimeWithNotification } from "../_service/overtime-service";
import { CreateOvertimeSnakeSchema } from "../_validation/overtime-schema";

/**
 * ✨ API สำหรับสร้างคำขอ Overtime พร้อมส่ง Email แจ้งเตือน
 */
export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(
    request,
    CreateOvertimeSnakeSchema,
  );
  if (error) return error;

  try {
    const d = data;
    const payload: CreateOvertimeInput = {
      requesterId: d.requester_id,
      firstname: d.first_name ?? undefined,
      lastname: d.last_name ?? undefined,
      employee_code: d.employee_code,
      role: d.role,
      department: d.department,
      requestDate: d.request_date ? new Date(d.request_date) : new Date(),
      startTime: d.start_time,
      endTime: d.end_time,
      overtimeType: d.overtime_type,
      descriptions: d.descriptions,
      approverId: d.approver_id,
      status: d.status,
      createdBy: d.created_by,
    };

    const created = await createOvertimeWithNotification(payload) as { id?: number };

    // บันทึก log การสร้างคำขอ OT (to_status = pending หรือ status จาก payload)
    if (created?.id) {
      try {
        await (PrismaTimesheet as any).overtimeStatusLog.create({
          data: {
            overtime_id: Number(created.id),
            changed_by: d.created_by ? Number(d.created_by) : null,
            from_status: null,
            to_status: d.status ?? "pending",
            note: "สร้างคำขอ OT",
          },
        });
      } catch (logErr) {
        console.error("Failed to write overtime_status_log on create:", logErr);
      }
    }

    return NextResponse.json(
      successResponse({
        data: created,
        status: 201,
        message_en: "Created",
        message_th: "สร้างรายการสำเร็จ",
      }),
      { status: 201 },
    );
  } catch (err: unknown) {
    // Delegate to centralized error handler which logs and formats the response
    return handleError(err, "POST /api/v1/timesheet/overtime/create error");
  }
}
