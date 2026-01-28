import { NextRequest, NextResponse } from "next/server";
import { DepartmentManagementService } from "../service/department-management.service";
import { CreateDepartmentSchema } from "../validation/department-management.validation";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    const validatedData = CreateDepartmentSchema.parse(body);

    const result = await DepartmentManagementService.create(validatedData);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "เพิ่มแผนกสำเร็จ",
        message_en: "Successfully created department",
        status: 201,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "เกิดข้อผิดพลาดในการเพิ่มแผนก",
      message_en: "An error occurred while creating department",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
