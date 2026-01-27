import { NextRequest, NextResponse } from "next/server";
import { PositionManagementService } from "../service/position-management.service";
import { CreatePositionSchema } from "../validation/position-management.validation";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await validateRequest(
      request,
      CreatePositionSchema,
    );
    if (error) return error;

    const result = await PositionManagementService.create(data);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "สร้างตำแหน่งงานสำเร็จ",
        message_en: "",
        status: 201,
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการสร้างตำแหน่ง",
        message_en: "An error occurred while creating position",
        error: err,
      }),
    );
  }
}
