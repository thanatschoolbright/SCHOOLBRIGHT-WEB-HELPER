import { NextRequest, NextResponse } from "next/server";
import { PermissionManagementService } from "../service/permission-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { permissions } = body;

    if (!permissions || !Array.isArray(permissions)) {
      throw new Error("Permissions array is required");
    }

    const result = await PermissionManagementService.seed(permissions);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ติดตั้งสิทธิ์มาตรฐานสำเร็จ",
        message_en: "Successfully seeded permissions",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการติดตั้งสิทธิ์",
      message_en: "An error occurred while seeding permissions",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
