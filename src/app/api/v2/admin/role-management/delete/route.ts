import { NextRequest, NextResponse } from "next/server";
import { RoleManagementService } from "../service/role-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        errorResponse({
          message_en: "Invalid JSON body",
          message_th: "ข้อมูล JSON ไม่ถูกต้อง",
          status: 400,
        }),
        { status: 400 },
      );
    }
    const { id } = body;

    if (!id) throw new Error("ID is required");

    const result = await RoleManagementService.delete(Number(id));

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ลบบทบาทสําเร็จ",
        message_en: "Successfully deleted role",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการลบบทบาท",
      message_en: "An error occurred while deleting role",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
