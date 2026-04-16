import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { handleError } from "@helpers/controller/handle-error.params";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateOvertimeStatusWithNotification } from "../_service/overtime-service";

// user_id ที่มีสิทธิ์อนุมัติ OT โดยตรง (ผู้รับผิดชอบ OT หลัก)
const APPROVER_USER_ID = "49";
// admin_id ของ super admin (bypass สิทธิ์ทุกอย่าง)
const SUPER_ADMIN_ID = 117;

// Schema for change-status body (accept snake_case updated_by)
const ChangeStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "paid", "payment_failed"]),
  updated_by: z.preprocess((v) => {
    if (typeof v === "string" && v.trim() !== "") return Number(v);
    return v;
  }, z.number().int().optional()),
  // เหตุผลประกอบการเปลี่ยนสถานะ (จำเป็นเมื่อปฏิเสธ)
  note: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({
          message_en: "Unauthorized",
          message_th: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
          status: 401,
        }),
        { status: 401 },
      );
    }

    const sessionUserId = String((session.user as any).id ?? "");
    const sessionAdminId = Number((session.user as any).admin_id ?? 0);

    // อนุญาตให้: (1) user_id === APPROVER_USER_ID หรือ (2) super admin (admin_id === 117)
    const isApprover = sessionUserId === APPROVER_USER_ID;
    const isSuperAdmin = sessionAdminId === SUPER_ADMIN_ID;

    if (!isApprover && !isSuperAdmin) {
      return NextResponse.json(
        errorResponse({
          message_en: "Forbidden: you do not have permission to change OT status",
          message_th: "คุณไม่มีสิทธิ์เปลี่ยนสถานะ OT",
          status: 403,
        }),
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (!idParam) {
      return NextResponse.json(
        errorResponse({
          message_en: "Missing id parameter",
          message_th: "ต้องระบุพารามิเตอร์ id",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const id = Number(idParam);
    if (Number.isNaN(id) || id <= 0) {
      return NextResponse.json(
        errorResponse({
          message_en: "Invalid id",
          message_th: "ค่า id ไม่ถูกต้อง",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const { data: bodyData, error } = await validateRequest(
      request,
      ChangeStatusSchema,
    );
    if (error) return error;

    const status = bodyData.status as string;
    const updatedBy = bodyData.updated_by;
    const note = bodyData.note ?? null;

    // ดึงสถานะก่อนหน้า เพื่อบันทึก from_status ใน log
    let fromStatus: string | null = null;
    try {
      const current = await (PrismaTimesheet as any).overtime.findUnique({
        where: { id },
        select: { status: true },
      });
      fromStatus = current?.status ?? null;
    } catch {
      // ไม่มีผลต่อการทำงานหากดึงสถานะเดิมไม่สำเร็จ
    }

    const updated = await updateOvertimeStatusWithNotification(
      id,
      status,
      updatedBy !== undefined ? Number(updatedBy) : undefined,
    );

    // บันทึก log การเปลี่ยนแปลงสถานะ
    try {
      await (PrismaTimesheet as any).overtimeStatusLog.create({
        data: {
          overtime_id: id,
          changed_by: updatedBy ? Number(updatedBy) : null,
          from_status: fromStatus,
          to_status: status,
          note: note,
        },
      });
    } catch (logErr) {
      console.error("Failed to write overtime_status_log:", logErr);
    }

    return NextResponse.json(
      successResponse({
        data: updated,
        status: 200,
        message_en: "Status updated",
        message_th: "อัปเดตสถานะเรียบร้อยแล้ว",
      }),
      { status: 200 },
    );
  } catch (err: any) {
    return handleError(
      err,
      "POST /api/v1/timesheet/overtime/change-status error",
    );
  }
}
