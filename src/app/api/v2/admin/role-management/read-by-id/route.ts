import { NextRequest, NextResponse } from "next/server";
import { RoleManagementService } from "../service/role-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      errorResponse({
        message_th: "ไม่พบรหัสบทบาท",
        message_en: "Role ID is required",
        status: 400,
      }),
      { status: 400 },
    );
  }

  try {
    const result = await RoleManagementService.findById(Number(id));

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงข้อมูลบทบาทสำเร็จ",
        message_en: "Successfully retrieved role detail",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "ไม่พบข้อมูลบทบาทที่ระบุ",
      message_en: "Role detail not found",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
