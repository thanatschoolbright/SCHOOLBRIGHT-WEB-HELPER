import { auth } from "@/auth";
import { buildPagination } from "@/helpers/controller/build-pagination.params";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

// ✨ ดึงประวัติการทำงานของ Bot (cronjob device-monitor-line) จาก api_log
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบก่อน", message_en: "Unauthorized" }),
        { status: 401 },
      );
    }

    const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = QuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "พารามิเตอร์ไม่ถูกต้อง", message_en: "Invalid query params" }),
        { status: 400 },
      );
    }

    const { page, page_size, date_from, date_to } = parsed.data;
    const offset = (page - 1) * page_size;

    const where: Parameters<typeof PrismaTimesheet.apiLog.findMany>[0]["where"] = {
      service_name: "cronjob",
      endpoint: "cronjob/device-monitor-line",
    };

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) {
        const end = new Date(date_to);
        end.setHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      PrismaTimesheet.apiLog.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: offset,
        take: page_size,
        select: {
          id: true,
          request_time: true,
          response_time: true,
          duration_ms: true,
          status_code: true,
          is_success: true,
          response_body: true,
          created_at: true,
        },
      }),
      PrismaTimesheet.apiLog.count({ where }),
    ]);

    const formatted = logs.map((log) => {
      const body = (log.response_body ?? {}) as Record<string, unknown>;
      return {
        id: log.id.toString(),
        run_at: log.created_at,
        duration_ms: log.duration_ms ?? null,
        is_success: log.is_success,
        success: typeof body.success === "number" ? body.success : 0,
        failed: typeof body.failed === "number" ? body.failed : 0,
        skipped: typeof body.skipped === "number" ? body.skipped : 0,
        total_active_groups: typeof body.total_active_groups === "number" ? body.total_active_groups : 0,
      };
    });

    return NextResponse.json(
      successResponse({
        data: formatted,
        message_th: "ดึงประวัติ Bot สำเร็จ",
        message_en: "Bot run log retrieved",
        pagination: buildPagination(offset, page_size, total),
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      errorResponse({ status: 500, message_th: "เกิดข้อผิดพลาดภายในระบบ", message_en: message }),
      { status: 500 },
    );
  }
}
