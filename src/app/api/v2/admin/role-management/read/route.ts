import { NextRequest, NextResponse } from "next/server";
import { RoleManagementService } from "../service/role-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";

  try {
    const result = await RoleManagementService.findAll({ search });

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงข้อมูลบทบาทสำเร็จ",
        message_en: "Successfully retrieved roles",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการดึงข้อมูล",
      message_en: "An error occurred while retrieving roles",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
