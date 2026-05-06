import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BOT_KEY = "line_bot_enabled";

// ดึงหรือสร้าง row ใน bot_setting — default เปิดใช้งาน (true)
async function getBotEnabledRow() {
  return PrismaTimesheet.botSetting.upsert({
    where: { key: BOT_KEY },
    create: {
      key: BOT_KEY,
      value: "true",
      description: "เปิด/ปิดการแจ้งเตือน LINE Bot สำหรับระบบตรวจสอบอุปกรณ์",
    },
    update: {},
  });
}

// GET handler — ดึงสถานะเปิด/ปิด Bot
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบก่อน", message_en: "Unauthorized" }),
        { status: 401 },
      );
    }

    const row = await getBotEnabledRow();
    const enabled = row.value === "true";

    return NextResponse.json(
      successResponse({
        data: {
          enabled,
          updated_by: row.updated_by,
          updated_at: row.updated_at.toISOString(),
        },
        message_th: "ดึงสถานะ Bot สำเร็จ",
        message_en: "Bot setting fetched",
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      errorResponse({ status: 500, message_th: "ไม่สามารถดึงสถานะ Bot ได้", message_en: message }),
      { status: 500 },
    );
  }
}

const updateSchema = z.object({
  enabled: z.boolean({ required_error: "enabled จำเป็น" }),
});

// PATCH handler — เปิด/ปิด Bot (เฉพาะ role ADMIN)
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบก่อน", message_en: "Unauthorized" }),
        { status: 401 },
      );
    }

    const user = session.user as { id?: string; role_name?: string; admin_id?: number };
    const isAdmin = user.admin_id === 117 || user.role_name?.toUpperCase() === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        errorResponse({ status: 403, message_th: "เฉพาะ Admin เท่านั้นที่สามารถเปลี่ยนสถานะ Bot ได้", message_en: "Forbidden" }),
        { status: 403 },
      );
    }

    const { error, data } = await validateRequest(request, updateSchema);
    if (error) return error;

    const updatedById = user.id ? parseInt(user.id, 10) : null;

    const row = await PrismaTimesheet.botSetting.upsert({
      where: { key: BOT_KEY },
      create: {
        key: BOT_KEY,
        value: data.enabled ? "true" : "false",
        description: "เปิด/ปิดการแจ้งเตือน LINE Bot สำหรับระบบตรวจสอบอุปกรณ์",
        updated_by: updatedById,
      },
      update: {
        value: data.enabled ? "true" : "false",
        updated_by: updatedById,
      },
    });

    return NextResponse.json(
      successResponse({
        data: {
          enabled: row.value === "true",
          updated_by: row.updated_by,
          updated_at: row.updated_at.toISOString(),
        },
        message_th: data.enabled
          ? "เปิดการทำงานของ LINE Bot สำเร็จ"
          : "ปิดการทำงานของ LINE Bot สำเร็จ",
        message_en: data.enabled ? "LINE Bot enabled" : "LINE Bot disabled",
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      errorResponse({ status: 500, message_th: "ไม่สามารถบันทึกการตั้งค่าได้", message_en: message }),
      { status: 500 },
    );
  }
}
