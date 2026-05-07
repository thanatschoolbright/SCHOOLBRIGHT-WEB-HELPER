import { auth } from "@/auth";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  user_id: z.coerce.number().int().positive(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

// ดึงประวัติ Login / Logout ของ user คนหนึ่งจากตาราง api_log
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ status: 401, message_th: "กรุณาเข้าสู่ระบบ", message_en: "Unauthorized" }, { status: 401 });
  }

  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = QuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json({ status: 400, message_th: "พารามิเตอร์ไม่ถูกต้อง", message_en: "Invalid parameters" }, { status: 400 });
  }

  const { user_id, page, page_size } = parsed.data;
  const offset = (page - 1) * page_size;

  const where = {
    service_name: "authentication",
    endpoint: { in: ["AUTH_LOGIN", "AUTH_LOGOUT"] },
    called_by: String(user_id),
  };

  const [logs, total] = await Promise.all([
    PrismaTimesheet.apiLog.findMany({
      where,
      orderBy: { request_time: "desc" },
      skip: offset,
      take: page_size,
      select: {
        id: true,
        endpoint: true,
        request_time: true,
        is_success: true,
        ip_address: true,
        user_agent: true,
      },
    }),
    PrismaTimesheet.apiLog.count({ where }),
  ]);

  const data = logs.map((log) => ({
    id: log.id.toString(),
    action: log.endpoint === "AUTH_LOGIN" ? "LOGIN" : "LOGOUT",
    request_time: log.request_time,
    is_success: log.is_success,
    ip_address: log.ip_address ?? null,
    user_agent: log.user_agent ?? null,
  }));

  return NextResponse.json({
    status: 200,
    message_th: "ดึงข้อมูลสำเร็จ",
    message_en: "Success",
    data,
    pagination: {
      page,
      page_size,
      total,
      total_pages: Math.ceil(total / page_size),
    },
  }, { status: 200 });
}
