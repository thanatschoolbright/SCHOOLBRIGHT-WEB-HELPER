import { NextRequest, NextResponse } from "next/server";
import { DepartmentManagementService } from "../service/department-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const departmentId = Number(searchParams.get("departmentId"));

  if (!departmentId) {
    const errorBody = errorResponse({
      message_th: "ไม่พบรหัสแผนก",
      message_en: "Department ID not found",
      status: 400,
    });
    return NextResponse.json(errorBody, { status: 400 });
  }

  try {
    const result = await DepartmentManagementService.getMembers(departmentId);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงรายชื่อสมาชิกในแผนกสำเร็จ",
        message_en: "Successfully retrieved department members",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก",
      message_en: "An error occurred while retrieving department members",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
