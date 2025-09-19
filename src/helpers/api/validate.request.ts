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
      error: {
        status: 400,
        message_en: "Invalid JSON body",
        message_th: "ข้อมูล JSON ไม่ถูกต้อง",
        error_code: "MUJWSOM_INVALID_JSON",
      },
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errorObj = {
      status: 400,
      message_en: "Validation failed",
      message_th: "การตรวจสอบไม่ผ่าน",
      errors: parsed.error.issues,
      error_code: "MUJWSOM_VALIDATION_ERROR",
    };
    console.error(errorObj);
    return {
      error: errorObj,
    };
  }

  return { data: parsed.data };
}
