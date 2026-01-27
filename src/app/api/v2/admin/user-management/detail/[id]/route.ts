import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../../service/user-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (isNaN(id)) {
    return NextResponse.json(
      errorResponse({
        message_th: "ID ผู้ใช้งานไม่ถูกต้อง",
        message_en: "Invalid User ID",
        status: 400,
      }),
      { status: 400 },
    );
  }

  try {
    const user = await UserManagementService.findById(id);

    if (!user) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไม่พบข้อมูลผู้ใช้งาน",
          message_en: "User not found",
          status: 404,
        }),
        { status: 404 },
      );
    }

    return NextResponse.json(
      successResponse({
        data: user,
        message_th: "ดึงข้อมูลผู้ใช้งานสำเร็จ",
        message_en: "User retrieved successfully",
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        message_en: err.message,
        error: err,
      }),
      { status: 500 },
    );
  }
}
