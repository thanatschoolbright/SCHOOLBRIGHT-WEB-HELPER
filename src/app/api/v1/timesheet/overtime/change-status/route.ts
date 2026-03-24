import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { handleError } from "@helpers/controller/handle-error.params";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateOvertimeStatusWithNotification } from "../_service/overtime-service";

// Schema for change-status body (accept snake_case updated_by)
const ChangeStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "paid", "payment_failed"]),
  updated_by: z.preprocess((v) => {
    if (typeof v === "string" && v.trim() !== "") return Number(v);
    return v;
  }, z.number().int().optional()),
});

export async function POST(request: NextRequest) {
  try {
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

    const updated = await updateOvertimeStatusWithNotification(
      id,
      status,
      updatedBy !== undefined ? Number(updatedBy) : undefined,
    );

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
