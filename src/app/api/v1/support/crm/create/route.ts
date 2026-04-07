import { NextRequest, NextResponse } from "next/server";
import { createCrmCase } from "../service/crm-service";
import { CrmCreateSchema } from "../validation/crm-schema";

// ✨ สร้างเคส CRM Support ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CrmCreateSchema.safeParse(body);

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

    const created = await createCrmCase(parsed.data);

    return NextResponse.json(
      {
        status_code: 201,
        message_th: "สร้างเคสสำเร็จ",
        message_en: "Case created successfully",
        data: created,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    console.error("POST /api/v1/support/crm/create error:", err);
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
