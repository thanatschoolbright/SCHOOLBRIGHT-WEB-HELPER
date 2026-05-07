import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import {
  CreateTimeWindowSchema,
  SchoolIdQuerySchema,
} from "./device-notify-config.schema";
import { deviceNotifyConfigService } from "./device-notify-config.service";

// ✨ GET — ดึงการตั้งค่าช่วงเวลาและช่วงห่างของโรงเรียน (?school_id=xxx)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบ", message_en: "Unauthorized" }),
      { status: 401 },
    );
  }

  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = SchoolIdQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      errorResponse({ status: 400, message_th: "กรุณาระบุ school_id ที่ถูกต้อง", message_en: "Invalid school_id" }),
      { status: 400 },
    );
  }

  try {
    const config = await deviceNotifyConfigService.getConfigBySchool(parsed.data.school_id);
    return NextResponse.json(
      successResponse({
        message_th: "ดึงการตั้งค่าการแจ้งเตือนสำเร็จ",
        message_en: "Notification config retrieved",
        data: config,
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleError(err, "GET /api/v2/hardware/device-notify-config");
  }
}

// ✨ POST — เพิ่มรอบการแจ้งเตือนใหม่ให้โรงเรียน (สูงสุด 3 รอบ) (?school_id=xxx)
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบ", message_en: "Unauthorized" }),
      { status: 401 },
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

  const { data, error } = await validateRequest(request, CreateTimeWindowSchema);
  if (error) return error;

  try {
    const adminId: number | null = (session.user as { admin_id?: number }).admin_id ?? null;
    const created = await deviceNotifyConfigService.createTimeWindow(
      parsedQuery.data.school_id,
      data,
      adminId,
    );
    return NextResponse.json(
      successResponse({
        message_th: "เพิ่มรอบการแจ้งเตือนสำเร็จ",
        message_en: "Time window created",
        data: created,
      }),
      { status: 201 },
    );
  } catch (err: unknown) {
    return handleError(err, "POST /api/v2/hardware/device-notify-config");
  }
}
