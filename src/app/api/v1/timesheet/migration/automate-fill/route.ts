import { NextRequest, NextResponse } from "next/server";
import { MigrationService } from "../service/migration.service";
import { migrationAutomateSchema } from "../validation/migration.validation";

/* จัดการคำขอ POST สำหรับการ Generate รายละเอียดงานด้วย AI (ChatGPT) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    /* Validate ข้อมูลโครงสร้าง Request Body */
    const validation = migrationAutomateSchema.safeParse(body);

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

    const { admin_id, entry_ids } = validation.data;

    const data = await MigrationService.generateDescriptions(
      admin_id,
      entry_ids,
    );

    return NextResponse.json({
      status_code: 200,
      message_th: "Generate รายละเอียดงานสำเร็จ",
      message_en: "Descriptions generated successfully",
      data,
    });
  } catch (error: any) {
    console.error("[MIGRATION_AUTOMATE_ERROR]:", error);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "เกิดข้อผิดพลาดในการ Generate ข้อมูล",
        message_en: "Error generating descriptions",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

/* จัดการคำขอ PATCH สำหรับการยืนยันบันทึกรายละเอียดงานที่ถูก Generate */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates } = body; // Expect { id: number, description: string }[]

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        {
          status_code: 400,
          message_th: "ไม่พบข้อมูลที่ต้องการอัปเดต",
          message_en: "No update data provided",
        },
        { status: 400 },
      );
    }

    const result = await MigrationService.updateDescriptions(updates);

    return NextResponse.json({
      status_code: 200,
      message_th: `บันทึกข้อมูลเรียบร้อยแล้ว จำนวน ${result.length} รายการ`,
      message_en: `Successfully updated ${result.length} entries`,
      data: result,
    });
  } catch (error: any) {
    console.error("[MIGRATION_PATCH_ERROR]:", error);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        message_en: "Error updating descriptions",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
