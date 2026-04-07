import { NextRequest, NextResponse } from "next/server";
import { deleteCrmCase } from "../service/crm-service";
import { CrmDeleteSchema } from "../validation/crm-schema";

// ✨ ลบเคส CRM Support แบบ Soft Delete เพื่อเก็บประวัติไว้
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CrmDeleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          status_code: 400,
          message_th: "ข้อมูลไม่ถูกต้อง",
          message_en: "Invalid request body",
          data: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    await deleteCrmCase(parsed.data);

    return NextResponse.json({
      status_code: 200,
      message_th: "ลบเคสสำเร็จ",
      message_en: "Case deleted successfully",
      data: null,
    });
  } catch (err: unknown) {
    console.error("DELETE /api/v1/support/crm/delete error:", err);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        message_en: "Internal server error",
        data: null,
      },
      { status: 500 },
    );
  }
}
