import { NextRequest, NextResponse } from "next/server";
import { MigrationService } from "../service/migration.service";
import { migrationCreateSchema } from "../validation/migration.validation";

/* ✨ จัดการคำขอ POST สำหรับการย้ายรายการ Timesheet แบบกลุ่ม (Bulk Update) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    /* 🛡️ Validate ข้อมูลโครงสร้าง Request Body ก่อนส่งไป Service */
    const validation = migrationCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          status_code: 400,
          message_th: "ข้อมูลไม่ถูกต้อง",
          message_en: "Invalid request data",
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const { entry_ids, target_project_id, target_feature_id } = validation.data;

    const result = await MigrationService.migrateEntries(
      entry_ids,
      target_project_id,
      target_feature_id,
    );

    return NextResponse.json({
      status_code: 201,
      message_th: `ย้ายข้อมูลสำเร็จจำนวน ${result.count} รายการ`,
      message_en: `Successfully migrated ${result.count} entries`,
      data: result,
    });
  } catch (error: any) {
    console.error("❌ [MIGRATION_CREATE_ERROR]:", error);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "เกิดข้อผิดพลาดในการย้ายข้อมูล",
        message_en: "Error migrating entries",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
