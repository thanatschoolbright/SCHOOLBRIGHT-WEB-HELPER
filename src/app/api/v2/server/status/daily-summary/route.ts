import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";

// ✨ Schema ตรวจสอบ query parameters สำหรับดึง daily summary
const QuerySchema = z.object({
  days: z.coerce.number().min(1).max(90).default(30),
  server_key: z.string().optional(),
});

// ✨ ดึงข้อมูลสรุป Uptime/Downtime รายวันสำหรับแสดงผล Graph
export async function GET(request: NextRequest) {
  try {
    const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = QuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "พารามิเตอร์ไม่ถูกต้อง", message_en: "Invalid parameters" }),
        { status: 400 }
      );
    }

    const { days, server_key } = parsed.data;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    dateFrom.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = {
      summary_date: { gte: dateFrom },
    };
    if (server_key) {
      where.server_key = server_key;
    }

    const summaries = await PrismaTimesheet.serverStatusDailySummary.findMany({
      where,
      orderBy: [{ summary_date: "asc" }, { server_key: "asc" }],
    });

    // จัดกลุ่มตาม server_key เพื่อสะดวกต่อการวาด Graph
    const grouped: Record<string, {
      server_key: string;
      server_name_th: string;
      data: Array<{
        date: string;
        uptime_percent: number;
        online_count: number;
        offline_count: number;
        avg_response_time_ms: number;
      }>;
    }> = {};

    for (const row of summaries) {
      const key = row.server_key;
      if (!grouped[key]) {
        grouped[key] = { server_key: key, server_name_th: row.server_name_th, data: [] };
      }
      grouped[key].data.push({
        date: row.summary_date.toISOString().split("T")[0],
        uptime_percent: row.uptime_percent,
        online_count: row.online_count,
        offline_count: row.offline_count,
        avg_response_time_ms: row.avg_response_time_ms,
      });
    }

    return NextResponse.json(
      successResponse({
        data: Object.values(grouped),
        message_th: "ดึงข้อมูลสรุปรายวันสำเร็จ",
        message_en: "Daily summary fetched successfully",
      }),
      { status: 200 }
    );
  } catch (err) {
    return handleError(err, "[SERVER_STATUS_DAILY_SUMMARY_GET_ERROR]");
  }
}
