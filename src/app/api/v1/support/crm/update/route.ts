import { NextRequest, NextResponse } from "next/server";
import { updateCrmCase } from "../service/crm-service";
import { CrmUpdateSchema } from "../validation/crm-schema";

// ✨ อัปเดตข้อมูลเคส CRM Support ตาม ID
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CrmUpdateSchema.safeParse(body);

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

    const updated = await updateCrmCase(parsed.data);

    return NextResponse.json({
      status_code: 200,
      message_th: "อัปเดตเคสสำเร็จ",
      message_en: "Case updated successfully",
      data: updated,
    });
  } catch (err: unknown) {
    console.error("PATCH /api/v1/support/crm/update error:", err);
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
