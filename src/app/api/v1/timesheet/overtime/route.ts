import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import Service from "@/services/overtime/overtime.service";
import { logger } from "@/helpers/logger";

// list or create




export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (!idParam) {
      return NextResponse.json(
        errorResponse({ message_en: "Missing id parameter", status: 400 }),
        { status: 400 }
      );
    }

    const id = Number(idParam);
    if (Number.isNaN(id) || id <= 0) {
      return NextResponse.json(
        errorResponse({ message_en: "Invalid id", status: 400 }),
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const deleted = await Service.delete(id, { deletedBy: body.deletedBy });

    return NextResponse.json(
      successResponse({ data: deleted, status: 200, message_en: "Deleted" }),
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("DELETE /api/v1/timesheet/overtime error", err);
    const status = err?.response?.status || err?.status || 500;
    return NextResponse.json(
      errorResponse({
        message_en: err?.message || "Internal Server Error",
        status,
        error: err?.response?.data || err,
      }),
      { status }
    );
  }
}
