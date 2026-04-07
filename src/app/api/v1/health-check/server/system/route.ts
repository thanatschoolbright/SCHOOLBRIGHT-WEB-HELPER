import { errorResponse, successResponse } from "@/helpers/api/response";
import { NextRequest, NextResponse } from "next/server";
import {
  executeHealthChecksService,
  sendDiscordNotificationService,
} from "./service/health-check-service";
import { healthCheckRequestSchema } from "./validation/health-check-schema";

// ✨ POST /api/v1/health-check/server/system — ตรวจสอบสุขภาพระบบและส่งแจ้งเตือน Discord เมื่อ mode=discord
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => ({}));

    // 📝 ตรวจสอบ request body ด้วย Zod Schema
    const parsed = healthCheckRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({
          message_en: "Invalid request body",
          message_th: "ข้อมูล request ไม่ถูกต้อง",
          status: 400,
          error: parsed.error.flatten(),
        }),
        { status: 400 },
      );
    }

    const healthCheckResults = await executeHealthChecksService();

    if (parsed.data.mode === "discord") {
      await sendDiscordNotificationService(healthCheckResults);
    }

    return NextResponse.json(successResponse({ data: healthCheckResults }), {
      status: 200,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      errorResponse({
        message_en: message,
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        status: 500,
        error: null,
      }),
      { status: 500 },
    );
  }
}
