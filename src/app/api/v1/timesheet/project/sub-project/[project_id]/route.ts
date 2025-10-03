import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/sub-project/sub-project.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id } = await context.params; // ✅ ต้อง await
    const projectId = Number(project_id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        errorResponse({
          message_en: "Invalid project_id",
          message_th: "project_id ไม่ถูกต้อง",
        }),
        { status: 400 }
      );
    }

    const features = await Service.findByProjectId(projectId);

    return NextResponse.json(
      successResponse({
        data: features,
        message_en: "Fetch sub-project successfully",
        message_th: "ดึงข้อมูลซับโปรเจคสำเร็จ",
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        error,
      }),
      { status: 500 }
    );
  }
}
