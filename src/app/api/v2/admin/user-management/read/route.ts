import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

// ดึงข้อมูลผู้ใช้งาน (Search & Pagination)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 50;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || undefined;

  try {
    const result = await UserManagementService.findAll({
      page,
      limit,
      search,
      status,
    });

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงข้อมูลผู้ใช้งานสำเร็จ",
        message_en: "Users retrieved successfully",
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการดึงข้อมูล",
      message_en: err.message,
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
