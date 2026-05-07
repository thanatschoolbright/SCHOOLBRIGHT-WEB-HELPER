import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import {
  SchoolIdQuerySchema,
  UpdateTimeWindowSchema,
} from "../../device-notify-config.schema";
import { deviceNotifyConfigService } from "../../device-notify-config.service";

// ✨ PATCH — อัปเดตช่วงเวลาแจ้งเตือนตาม id (?school_id=xxx)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบ", message_en: "Unauthorized" }),
      { status: 401 },
    );
  }

  const { id } = await params;
  const recordId = parseInt(id, 10);
  if (isNaN(recordId) || recordId <= 0) {
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "id ไม่ถูกต้อง", message_en: "Invalid id" }),
      { status: 400 },
    );
  }

  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsedQuery = SchoolIdQuerySchema.safeParse(rawParams);
  if (!parsedQuery.success) {
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "กรุณาระบุ school_id ที่ถูกต้อง", message_en: "Invalid school_id" }),
      { status: 400 },
    );
  }

  const { data, error } = await validateRequest(request, UpdateTimeWindowSchema);
  if (error) return error;

  try {
    const adminId: number | null = (session.user as { admin_id?: number }).admin_id ?? null;
    const updated = await deviceNotifyConfigService.updateTimeWindow(
      recordId,
      parsedQuery.data.school_id,
      data,
      adminId,
    );
    return NextResponse.json(
      successResponse({
        message_th: "อัปเดตช่วงเวลาแจ้งเตือนสำเร็จ",
        message_en: "Time window updated",
        data: updated,
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleError(err, "PATCH /api/v2/hardware/device-notify-config/time-windows/[id]");
  }
}

// ✨ DELETE — ลบรอบการแจ้งเตือนตาม id (?school_id=xxx)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบ", message_en: "Unauthorized" }),
      { status: 401 },
    );
  }

  const { id } = await params;
  const recordId = parseInt(id, 10);
  if (isNaN(recordId) || recordId <= 0) {
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "id ไม่ถูกต้อง", message_en: "Invalid id" }),
      { status: 400 },
    );
  }

  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsedQuery = SchoolIdQuerySchema.safeParse(rawParams);
  if (!parsedQuery.success) {
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "กรุณาระบุ school_id ที่ถูกต้อง", message_en: "Invalid school_id" }),
      { status: 400 },
    );
  }

  try {
    await deviceNotifyConfigService.deleteTimeWindow(recordId, parsedQuery.data.school_id);
    return NextResponse.json(
      successResponse({
        message_th: "ลบรอบการแจ้งเตือนสำเร็จ",
        message_en: "Time window deleted",
        data: null,
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleError(err, "DELETE /api/v2/hardware/device-notify-config/time-windows/[id]");
  }
}
