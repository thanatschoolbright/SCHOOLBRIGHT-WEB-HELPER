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
    const result = await RoleManagementService.create(body);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "สร้างบทบาทสำเร็จ",
        message_en: "Successfully created role",
        status: 201,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการสร้างบทบาท",
      message_en: "An error occurred while creating role",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
