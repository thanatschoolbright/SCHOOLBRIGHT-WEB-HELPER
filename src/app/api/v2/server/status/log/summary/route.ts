import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";

// ✨ Schema ตรวจสอบ query parameters สำหรับ summary
const QuerySchema = z.object({
  days: z.coerce.number().min(1).max(30).default(7),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

// ✨ ดึงสรุปสถิติ Uptime/Downtime ของแต่ละ Server ในช่วงเวลาที่กำหนด
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

    const { days, date_from, date_to } = parsed.data;

    // คำนวณช่วงเวลา
    let fromDate: Date;
    let toDate: Date;

    if (date_from && date_to) {
      fromDate = new Date(date_from);
      toDate = new Date(date_to);
      toDate.setHours(23, 59, 59, 999);
    } else {
      toDate = new Date();
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      fromDate.setHours(0, 0, 0, 0);
    }

    // ดึง log ทั้งหมดในช่วงเวลา
    const logs = await PrismaTimesheet.apiLog.findMany({
      where: {
        service_name: "SERVER_STATUS_MONITOR",
        is_archived: false,
        request_time: { gte: fromDate, lte: toDate },
      },
      select: {
        trace_id: true,       // server key
        called_by: true,      // "Online" | "Offline"
        duration_ms: true,    // response time in ms
        request_time: true,
        status_code: true,
        is_success: true,
        response_body: true,
      },
      orderBy: { request_time: "asc" },
    });

    if (logs.length === 0) {
      return NextResponse.json(
        successResponse({
          data: {
            period: { from: fromDate, to: toDate, days },
            overall: { total_checks: 0, uptime_percent: 0, downtime_percent: 0, total_downtime_count: 0 },
            servers: [],
          },
          message_th: "ไม่พบข้อมูล log ในช่วงเวลาดังกล่าว",
          message_en: "No log data in the specified period",
        }),
        { status: 200 }
      );
    }

    // จัดกลุ่มตาม server (trace_id = server key)
    const serverMap = new Map<string, { online: number; offline: number; response_times: number[]; server_name_th: string; last_checked: Date }>();

    for (const log of logs) {
      const key = log.trace_id ?? "UNKNOWN";
      const isOnline = log.called_by === "Online";
      const responseTime = log.duration_ms ?? 0;

      // ดึงชื่อภาษาไทยจาก response_body
      const body = log.response_body as { server_name_th?: string } | null;
      const serverNameTh = body?.server_name_th ?? key;

      if (!serverMap.has(key)) {
        serverMap.set(key, { online: 0, offline: 0, response_times: [], server_name_th: serverNameTh, last_checked: log.request_time });
      }

      const entry = serverMap.get(key)!;
      if (isOnline) {
        entry.online += 1;
        entry.response_times.push(responseTime);
      } else {
        entry.offline += 1;
      }
      if (log.request_time > entry.last_checked) {
        entry.last_checked = log.request_time;
      }
    }

    // คำนวณ stats ต่อ server
    const servers = Array.from(serverMap.entries()).map(([serverKey, data]) => {
      const total = data.online + data.offline;
      const uptimePercent = total > 0 ? Math.round((data.online / total) * 10000) / 100 : 0;
      const avgResponseTime = data.response_times.length > 0
        ? Math.round(data.response_times.reduce((a, b) => a + b, 0) / data.response_times.length)
        : 0;

      return {
        server_key: serverKey,
        server_name_th: data.server_name_th,
        total_checks: total,
        online_count: data.online,
        offline_count: data.offline,
        uptime_percent: uptimePercent,
        downtime_percent: Math.round((100 - uptimePercent) * 100) / 100,
        avg_response_time_ms: avgResponseTime,
        last_checked: data.last_checked,
      };
    });

    // สรุปภาพรวมทั้งหมด
    const totalChecks = logs.length;
    const totalOnline = logs.filter((l) => l.called_by === "Online").length;
    const totalOffline = totalChecks - totalOnline;
    const overallUptime = totalChecks > 0 ? Math.round((totalOnline / totalChecks) * 10000) / 100 : 0;

    return NextResponse.json(
      successResponse({
        data: {
          period: { from: fromDate, to: toDate, days },
          overall: {
            total_checks: totalChecks,
            uptime_percent: overallUptime,
            downtime_percent: Math.round((100 - overallUptime) * 100) / 100,
            total_downtime_count: totalOffline,
          },
          servers: servers.sort((a, b) => a.uptime_percent - b.uptime_percent), // เรียงจาก uptime น้อย→มาก
        },
        message_th: "ดึงสรุป log สำเร็จ",
        message_en: "Log summary fetched successfully",
      }),
      { status: 200 }
    );
  } catch (err) {
    return handleError(err, "[SERVER_STATUS_LOG_SUMMARY_GET_ERROR]");
  }
}
