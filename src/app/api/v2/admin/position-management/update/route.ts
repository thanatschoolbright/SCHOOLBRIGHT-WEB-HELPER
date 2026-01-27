import { NextRequest, NextResponse } from "next/server";
import { PositionManagementService } from "../service/position-management.service";
import { UpdatePositionSchema } from "../validation/position-management.validation";
import { successResponse, errorResponse } from "@/helpers/api/response";

import { validateRequest } from "@helpers/api/validate.request";

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await validateRequest(
      request,
      UpdatePositionSchema,
    );
    if (error) return error;
    const { id, ...body } = data;

    const result = await PositionManagementService.update(id, body);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "อัปเดตตำแหน่งงานสำเร็จ",
        message_en: "Successfully updated position",
        status: 200,
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการอัปเดตตำแหน่ง",
        message_en: "An error occurred while updating position",
        error: err,
      }),
    );
  }
}
