import { NextRequest, NextResponse } from "next/server";
import { RoleManagementService } from "../service/role-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) throw new Error("ID is required");

    const result = await RoleManagementService.update(Number(id), data);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "อัปเดตบทบาทสำเร็จ",
        message_en: "Successfully updated role",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการอัปเดตบทบาท",
      message_en: "An error occurred while updating role",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
