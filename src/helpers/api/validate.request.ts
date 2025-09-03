import { ZodSchema } from "zod";
import { errorResponse } from "./response";
import { NextRequest, NextResponse } from "next/server";

export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return {
      error: NextResponse.json(
        errorResponse({
          message_en: "Invalid JSON body",
          message_th: "ข้อมูล JSON ไม่ถูกต้อง",
        }),
        { status: 400 }
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: NextResponse.json(
        {
          status: 400,
          message_en: "Validation failed",
          message_th: "การตรวจสอบไม่ผ่าน",
          errors: parsed.error.issues,
        },
        { status: 400 }
      ),
    };
  }

  return { data: parsed.data };
}
