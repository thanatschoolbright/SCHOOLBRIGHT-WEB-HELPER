import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import Service from "@/services/overtime/overtime.service";
import { logger } from "@helpers/logger";
import safeParseRequestBody from "@helpers/controller/safe-parse.params";
import { handleError } from "@helpers/controller/handle-error.params";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (!idParam) {
      return NextResponse.json(
        errorResponse({ message_en: "Missing id parameter", message_th: "ต้องระบุพารามิเตอร์ id", status: 400 }),
        { status: 400 }
      );
    }

    const id = Number(idParam);
    if (Number.isNaN(id) || id <= 0) {
      return NextResponse.json(
        errorResponse({ message_en: "Invalid id", message_th: "ค่า id ไม่ถูกต้อง", status: 400 }),
        { status: 400 }
      );
    }

    const body = await safeParseRequestBody(request);
    const deleted = await Service.delete(id, {
      deletedBy: (body as any).deletedBy,
    });

    return NextResponse.json(
      successResponse({ data: deleted, status: 200, message_en: "Deleted", message_th: "ลบรายการสำเร็จ" }),
      { status: 200 }
    );
  } catch (err: any) {
    return handleError(err, "POST /api/v1/timesheet/overtime/delete error");
  }
}
