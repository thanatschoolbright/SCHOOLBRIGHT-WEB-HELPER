import { NextRequest, NextResponse } from "next/server";
import { PositionManagementService } from "../service/position-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 50;
  const search = searchParams.get("search") || "";
  const isActive = searchParams.get("is_active");

  try {
    const result = await PositionManagementService.findAll({
      page,
      limit,
      search,
      isActive,
    });

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงข้อมูลตำแหน่งสำเร็จ",
        message_en: "Successfully retrieved position data",
        status: 200,
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        message_en: "An error occurred while retrieving position data",
        error: err,
      }),
    );
  }
}
