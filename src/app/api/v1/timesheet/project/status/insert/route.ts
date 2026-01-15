import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/project-status.service";
import { successResponse, errorResponse } from "@helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { Schema } from "./route.validator";

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, Schema);
  if (error) return error;

  const { id, ...details } = data;

  try {
    if (id) {
      const updated = await Service.update(id, details);
      return NextResponse.json(
        successResponse({
          data: updated,
          message_en: "Updated successfully",
          message_th: "อัปเดตข้อมูลสำเร็จ",
        })
      );
    }

    const created = await Service.create(details);
    return NextResponse.json(
      successResponse({
        data: created,
        message_en: "Created successfully",
        message_th: "สร้างข้อมูลสำเร็จ",
      })
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_en: err.message,
        message_th: "เกิดข้อผิดพลาดในการดำเนินการ",
        error: err,
      })
    );
  }
}
