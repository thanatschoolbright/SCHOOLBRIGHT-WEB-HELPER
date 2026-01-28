import { NextRequest, NextResponse } from "next/server";
import { DepartmentManagementService } from "../service/department-management.service";
import { UpdateDepartmentSchema } from "../validation/department-management.validation";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    const { id, ...data } = UpdateDepartmentSchema.parse(body);

    const result = await DepartmentManagementService.update(id, data);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "แก้ไขข้อมูลแผนกสำเร็จ",
        message_en: "Successfully updated department",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลแผนก",
      message_en: "An error occurred while updating department",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
