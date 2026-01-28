import { NextRequest, NextResponse } from "next/server";
import { DepartmentManagementService } from "../service/department-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET(request: NextRequest) {
  try {
    const createdCount = await DepartmentManagementService.seedDepartments();

    return NextResponse.json(
      successResponse({
        data: { created: createdCount },
        message_th: `เพิ่มข้อมูลแผนกตั้งต้นสำเร็จ ${createdCount} รายการ`,
        message_en: `Successfully seeded ${createdCount} default departments`,
        status: 200,
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการเพิ่มข้อมูลตั้งต้น",
        message_en: "An error occurred while seeding default data",
        error: err,
      }),
    );
  }
}
