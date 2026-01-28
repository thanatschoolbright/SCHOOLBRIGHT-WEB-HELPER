import { NextRequest, NextResponse } from "next/server";
import { DepartmentManagementService } from "../service/department-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 50;
  const search = searchParams.get("search") || "";
  const isActive = searchParams.get("is_active");

  try {
    const result = await DepartmentManagementService.findAll({
      page,
      limit,
      search,
      isActive,
    });

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงข้อมูลแผนกสำเร็จ",
        message_en: "Successfully retrieved department data",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการดึงข้อมูล",
      message_en: "An error occurred while retrieving department data",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
