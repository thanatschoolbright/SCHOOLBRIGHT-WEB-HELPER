import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// รายการ Bot ทั้งหมดในระบบ — กำหนด static เพราะมาจาก CronJob YAML
const BOT_DEFINITIONS = [
  {
    key: "line_bot_enabled",
    name_th: "LINE Bot แจ้งเตือนอุปกรณ์",
    description: "ส่งรายงานสถานะอุปกรณ์ทุก 1 นาทีไปยัง LINE Group",
    schedule: "*/1 * * * *",
    schedule_th: "ทุก 1 นาที",
    cronjob_name: "cronjob-monitor-line",
  },
  {
    key: "mobile_api_check_enabled",
    name_th: "ตรวจสอบ Mobile API",
    description: "ตรวจสอบสถานะ API ของแอปมือถือและแจ้งเตือน Discord เมื่อพบปัญหา",
    schedule: "*/1 * * * *",
    schedule_th: "ทุก 1 นาที",
    cronjob_name: "cronjob-mobile-api-check",
  },
  {
    key: "summary_downtime_enabled",
    name_th: "สรุป Downtime รายวัน",
    description: "สรุปข้อมูล log สถานะ Server ประจำวันและล้าง log เก่าทุกคืนเวลา 00:05 น.",
    schedule: "5 17 * * *",
    schedule_th: "ทุกวัน เวลา 00:05 น.",
    cronjob_name: "cronjob-summary-downtime",
  },
];

// ดึงสถานะ Bot ทั้งหมดจาก DB พร้อม upsert ค่า default
async function getAllBotSettings() {
  const keys = BOT_DEFINITIONS.map((b) => b.key);
  const rows = await PrismaTimesheet.botSetting.findMany({
    where: { key: { in: keys } },
  });

  const rowMap = new Map(rows.map((r) => [r.key, r]));

  const upsertPromises = BOT_DEFINITIONS.filter((b) => !rowMap.has(b.key)).map((b) =>
    PrismaTimesheet.botSetting.upsert({
      where: { key: b.key },
      create: { key: b.key, value: "true", description: b.description },
      update: {},
    }),
  );

  if (upsertPromises.length > 0) {
    const created = await Promise.all(upsertPromises);
    created.forEach((r) => rowMap.set(r.key, r));
  }

  return BOT_DEFINITIONS.map((def) => {
    const row = rowMap.get(def.key);
    return {
      key: def.key,
      name_th: def.name_th,
      description: def.description,
      schedule: def.schedule,
      schedule_th: def.schedule_th,
      cronjob_name: def.cronjob_name,
      enabled: row ? row.value === "true" : true,
      updated_by: row?.updated_by ?? null,
      updated_at: row?.updated_at.toISOString() ?? null,
    };
  });
}

// GET handler — ดึงรายการ Bot ทั้งหมดพร้อมสถานะ
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบก่อน", message_en: "Unauthorized" }),
        { status: 401 },
      );
    }

    const bots = await getAllBotSettings();

    return NextResponse.json(
      successResponse({ data: bots, message_th: "ดึงรายการ Bot สำเร็จ", message_en: "Bot list fetched" }),
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      errorResponse({ status: 500, message_th: "ไม่สามารถดึงรายการ Bot ได้", message_en: message }),
      { status: 500 },
    );
  }
}

const toggleSchema = z.object({
  key: z.string().min(1, "key จำเป็น"),
  enabled: z.boolean({ message: "enabled จำเป็น" }),
});

// PATCH handler — เปิด/ปิด Bot ตาม key (เฉพาะ Admin)
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

    const { error, data } = await validateRequest(request, toggleSchema);
    if (error) return error;

    const validKey = BOT_DEFINITIONS.find((b) => b.key === data.key);
    if (!validKey) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "ไม่พบ Bot key ที่ระบุ", message_en: "Invalid bot key" }),
        { status: 400 },
      );
    }

    const updatedById = user.id ? parseInt(user.id, 10) : null;

    const row = await PrismaTimesheet.botSetting.upsert({
      where: { key: data.key },
      create: {
        key: data.key,
        value: data.enabled ? "true" : "false",
        description: validKey.description,
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
          key: row.key,
          enabled: row.value === "true",
          updated_by: row.updated_by,
          updated_at: row.updated_at.toISOString(),
        },
        message_th: data.enabled ? `เปิด ${validKey.name_th} สำเร็จ` : `ปิด ${validKey.name_th} สำเร็จ`,
        message_en: data.enabled ? "Bot enabled" : "Bot disabled",
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
