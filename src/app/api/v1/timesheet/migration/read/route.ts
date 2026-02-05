import { NextRequest, NextResponse } from "next/server";
import { MigrationService } from "../service/migration.service";

/* ✨ จัดการคำขอ GET สำหรับดึงข้อมูลที่เกี่ยวข้องกับการย้าย Timesheet */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    let data: any = null;

    switch (action) {
      case "projects":
        data = await MigrationService.getProjects();
        break;

      case "features":
        const project_id = searchParams.get("project_id");
        if (!project_id) {
          return NextResponse.json(
            {
              status_code: 400,
              message_th: "กรุณาระบุรหัสโปรเจกต์",
              message_en: "project_id is required",
            },
            { status: 400 },
          );
        }
        data = await MigrationService.getFeatures(parseInt(project_id));
        break;

      case "users":
        data = await MigrationService.getUsers();
        break;

      case "entries":
        const admin_id = searchParams.get("admin_id");
        const has_issues = searchParams.get("has_issues") === "true";
        data = await MigrationService.getEntries(
          admin_id ? parseInt(admin_id) : undefined,
          has_issues,
        );
        break;

      default:
        return NextResponse.json(
          {
            status_code: 400,
            message_th: "ไม่พบคำสั่งที่ต้องการ (Invalid action)",
            message_en: "Invalid action",
          },
          { status: 400 },
        );
    }

    return NextResponse.json({
      status_code: 200,
      message_th: "ดึงข้อมูลสำเร็จ",
      message_en: "Data retrieved successfully",
      data,
    });
  } catch (error: any) {
    console.error("❌ [MIGRATION_READ_ERROR]:", error);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        message_en: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
