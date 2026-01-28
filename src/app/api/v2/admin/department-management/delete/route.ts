import { NextRequest, NextResponse } from "next/server";
import { DepartmentManagementService } from "../service/department-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไม่พบ ID ที่ต้องการลบ",
          message_en: "ID not found for deletion",
          status: 400,
        }),
      );
    }

    const result = await DepartmentManagementService.delete(Number(id));

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ลบแผนกสำเร็จ",
        message_en: "Successfully deleted department",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการลบแผนก",
      message_en: "An error occurred while deleting department",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
