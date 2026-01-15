import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/project-status.service";
import { successResponse, errorResponse } from "@helpers/api/response";
import { z } from "zod";
import { validateRequest } from "@helpers/api/validate.request";

const Schema = z.object({
  id: z.number().min(1),
});

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, Schema);
  if (error) return error;

  try {
    await Service.delete(data.id);
    return NextResponse.json(
      successResponse({
        data: null,
        message_en: "Deleted successfully",
        message_th: "ลบข้อมูลสำเร็จ",
      })
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_en: err.message,
        message_th: "เกิดข้อผิดพลาดในการลบข้อมูล",
        error: err,
      })
    );
  }
}
