import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { buildPagination } from "@/helpers/controller/build-pagination.params";
import { handleError } from "@/helpers/controller/handle-error.params";

// ✨ Schema ตรวจสอบ query parameters สำหรับดึง log สถานะ Server
const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  page_size: z.coerce.number().min(1).max(100).default(20),
  server_name: z.string().optional(),
  status: z.enum(["Online", "Offline"]).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

// ✨ Schema สำหรับ body ของ POST (บันทึก log ชุดใหม่)
const SaveLogBodySchema = z.object({
  checked_at: z.string(),
  results: z.array(
    z.object({
      server: z.string(),
      server_name_th: z.string(),
      endpoint: z.string(),
      status: z.enum(["Online", "Offline"]),
      status_code: z.number(),
      response_time: z.number(),
      environment: z.string(),
      url: z.string(),
      message: z.string().optional(),
    })
  ),
});

// ✨ ดึงรายการ log การตรวจสอบสถานะ Server พร้อม filter และ pagination
export async function GET(request: NextRequest) {
  try {
    const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = QuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "พารามิเตอร์ไม่ถูกต้อง", message_en: "Invalid query parameters" }),
        { status: 400 }
      );
    }

    const { page, page_size, server_name, status, date_from, date_to } = parsed.data;
    const offset = (page - 1) * page_size;

    // สร้าง filter conditions
    const where: any = {
      service_name: "SERVER_STATUS_MONITOR",
      is_archived: false,
    };

    if (server_name) {
      where.endpoint = { contains: server_name, mode: "insensitive" };
    }

    if (status) {
      // เก็บ status ไว้ใน called_by field: "Online" หรือ "Offline"
      where.called_by = status;
    }

    if (date_from || date_to) {
      where.request_time = {};
      if (date_from) where.request_time.gte = new Date(date_from);
      if (date_to) {
        const toDate = new Date(date_to);
        toDate.setHours(23, 59, 59, 999);
        where.request_time.lte = toDate;
      }
    }

    const [logs, total] = await Promise.all([
      PrismaTimesheet.apiLog.findMany({
        where,
        orderBy: { request_time: "desc" },
        skip: offset,
        take: page_size,
        select: {
          id: true,
          request_time: true,
          duration_ms: true,
          status_code: true,
          url: true,
          endpoint: true,
          called_by: true,
          error_message: true,
          is_success: true,
          created_at: true,
          trace_id: true,
          response_body: true,
        },
      }),
      PrismaTimesheet.apiLog.count({ where }),
    ]);

    return NextResponse.json(
      successResponse({
        data: logs,
        pagination: buildPagination(offset, page_size, total),
        message_th: "ดึงข้อมูล log สำเร็จ",
        message_en: "Logs fetched successfully",
      }),
      { status: 200 }
    );
  } catch (err) {
    return handleError(err, "[SERVER_STATUS_LOG_GET_ERROR]");
  }
}

// ✨ บันทึกผลการตรวจสอบสถานะ Server ทุกตัวลงตาราง api_log (ครั้งละหลาย records)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "ข้อมูลไม่ถูกต้อง", message_en: "Invalid request body" }),
        { status: 400 }
      );
    }

    const parsed = SaveLogBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "รูปแบบข้อมูลไม่ถูกต้อง", message_en: "Invalid body schema" }),
        { status: 400 }
      );
    }

    const { checked_at, results } = parsed.data;
    const checkedAtDate = new Date(checked_at);

    // ลบ log เก่าเกิน 30 วันออกก่อน (เก็บไว้ไม่เกิน 30 วัน)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    await PrismaTimesheet.apiLog.deleteMany({
      where: {
        service_name: "SERVER_STATUS_MONITOR",
        request_time: { lt: cutoffDate },
      },
    });

    // บันทึก log ใหม่ทุก server พร้อมกัน
    const insertData = results.map((r) => ({
      request_time: checkedAtDate,
      response_time: new Date(),
      duration_ms: Math.round(r.response_time * 1000),
      method: "GET",
      status_code: r.status_code,
      url: r.url,
      endpoint: r.endpoint,
      service_name: "SERVER_STATUS_MONITOR",
      called_by: r.status, // "Online" | "Offline"
      trace_id: r.server,
      is_success: r.status === "Online",
      error_message: r.message ?? null,
      response_body: { server_name_th: r.server_name_th, environment: r.environment },
    }));

    await PrismaTimesheet.apiLog.createMany({ data: insertData });

    return NextResponse.json(
      successResponse({
        data: { saved: insertData.length },
        message_th: `บันทึก log สำเร็จ ${insertData.length} รายการ`,
        message_en: `Saved ${insertData.length} log entries`,
      }),
      { status: 200 }
    );
  } catch (err) {
    return handleError(err, "[SERVER_STATUS_LOG_POST_ERROR]");
  }
}
