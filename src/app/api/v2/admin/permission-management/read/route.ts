import { NextRequest, NextResponse } from "next/server";
import { PermissionManagementService } from "../service/permission-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET() {
  try {
    const result = await PermissionManagementService.findAll();

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงข้อมูลสิทธิ์สำเร็จ",
        message_en: "Successfully retrieved permissions",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการดึงข้อมูล",
      message_en: "An error occurred while retrieving permissions",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
