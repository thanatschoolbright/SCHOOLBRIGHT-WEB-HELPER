import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@helpers/controller/handle-error.params";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema สำหรับสร้าง log entry
const CreateLogSchema = z.object({
  overtime_id: z.number().int().positive(),
  changed_by: z.number().int().optional(),
  from_status: z.string().optional(),
  to_status: z.string(),
  note: z.string().optional(),
});

/**
 * GET /api/v1/timesheet/overtime/status-log?overtime_id=xxx
 * ดึงประวัติการเปลี่ยนแปลงสถานะของ OT request
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const overtimeIdParam = url.searchParams.get("overtime_id");

    if (!overtimeIdParam) {
      return NextResponse.json(
        errorResponse({
          message_en: "Missing overtime_id parameter",
          message_th: "ต้องระบุ overtime_id",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const overtimeId = Number(overtimeIdParam);
    if (Number.isNaN(overtimeId) || overtimeId <= 0) {
      return NextResponse.json(
        errorResponse({
          message_en: "Invalid overtime_id",
          message_th: "overtime_id ไม่ถูกต้อง",
          status: 400,
        }),
        { status: 400 },
      );
    }

    // ดึง log พร้อมข้อมูลผู้เปลี่ยนสถานะ (join กับ user table)
    const logs = await (PrismaTimesheet as any).overtimeStatusLog.findMany({
      where: { overtime_id: overtimeId },
      orderBy: { created_at: "asc" },
    });

    // ดึงข้อมูลชื่อผู้ใช้สำหรับแต่ละ changed_by
    const userIds = [...new Set(logs.map((l: any) => l.changed_by).filter(Boolean))] as number[];
    let userMap: Record<number, string> = {};
    if (userIds.length > 0) {
      const users = await (PrismaTimesheet as any).user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstname_th: true, lastname_th: true },
      });
      users.forEach((u: any) => {
        userMap[u.id] = `${u.firstname_th ?? ""} ${u.lastname_th ?? ""}`.trim() || String(u.id);
      });
    }

    const enrichedLogs = logs.map((log: any) => ({
      id: log.id,
      overtime_id: log.overtime_id,
      changed_by: log.changed_by,
      changed_by_name: log.changed_by ? (userMap[log.changed_by] ?? String(log.changed_by)) : null,
      from_status: log.from_status,
      to_status: log.to_status,
      note: log.note,
      changed_at: log.created_at,
    }));

    return NextResponse.json(
      successResponse({
        data: enrichedLogs,
        status: 200,
        message_en: "Fetched status logs",
        message_th: "ดึงประวัติสถานะสำเร็จ",
      }),
      { status: 200 },
    );
  } catch (err: any) {
    return handleError(err, "GET /api/v1/timesheet/overtime/status-log error");
  }
}

/**
 * POST /api/v1/timesheet/overtime/status-log
 * บันทึก log การเปลี่ยนแปลงสถานะ
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({
          message_en: "Invalid request body",
          message_th: "ข้อมูลไม่ถูกต้อง",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const { overtime_id, changed_by, from_status, to_status, note } = parsed.data;

    const created = await (PrismaTimesheet as any).overtimeStatusLog.create({
      data: {
        overtime_id,
        changed_by: changed_by ?? null,
        from_status: from_status ?? null,
        to_status,
        note: note ?? null,
      },
    });

    return NextResponse.json(
      successResponse({
        data: created,
        status: 201,
        message_en: "Status log created",
        message_th: "บันทึก log สำเร็จ",
      }),
      { status: 201 },
    );
  } catch (err: any) {
    return handleError(err, "POST /api/v1/timesheet/overtime/status-log error");
  }
}
