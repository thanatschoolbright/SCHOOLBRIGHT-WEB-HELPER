import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@helpers/controller/handle-error.params";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CommentSchema = z.object({
  overtime_id: z.number().int().positive(),
  comment: z.string().min(1).max(1000),
});

/**
 * POST /api/v1/timesheet/overtime/comment
 * บันทึก Comment / หมายเหตุจาก Admin ลงใน OvertimeStatusLog
 * ใช้ to_status = "comment" เพื่อแยกออกจาก status change จริง
 * ไม่เปลี่ยนสถานะของ OT — บันทึกเป็น log entry ธรรมดา
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({ message_th: "กรุณาเข้าสู่ระบบ", message_en: "Unauthorized", status: 401 }),
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = CommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({ message_th: "ข้อมูลไม่ถูกต้อง", message_en: "Invalid request body", status: 400 }),
        { status: 400 },
      );
    }

    const { overtime_id, comment } = parsed.data;
    const userId = Number((session.user as any)?.id);

    // ตรวจสอบว่า OT นี้มีอยู่จริง
    const overtime = await (PrismaTimesheet as any).overtime.findFirst({
      where: { id: overtime_id, isDeleted: false },
      select: { id: true, status: true },
    });

    if (!overtime) {
      return NextResponse.json(
        errorResponse({ message_th: "ไม่พบรายการ OT", message_en: "Overtime not found", status: 404 }),
        { status: 404 },
      );
    }

    // บันทึก comment เป็น log entry โดยใช้ to_status = "comment"
    const log = await (PrismaTimesheet as any).overtimeStatusLog.create({
      data: {
        overtime_id,
        changed_by: userId || null,
        from_status: overtime.status,
        to_status: "comment",
        note: comment,
      },
    });

    return NextResponse.json(
      successResponse({ data: log, status: 201, message_th: "บันทึกหมายเหตุสำเร็จ", message_en: "Comment saved" }),
      { status: 201 },
    );
  } catch (err) {
    return handleError(err, "POST /api/v1/timesheet/overtime/comment error");
  }
}
