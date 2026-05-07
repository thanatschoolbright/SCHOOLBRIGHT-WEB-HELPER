import { auth } from "@/auth";
import { buildPagination } from "@/helpers/controller/build-pagination.params";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  action: z.enum(["rename", "notify", "all"]).default("all"),
  keyword: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

const ACTIVITY_ENDPOINTS = [
  "/api/v1/hardware/machine-monitoring/device-notify-setting/toggle",
  "/api/v2/hardware/school-device/note",
];

// ✨ ดึงประวัติการกระทำของ User ในหน้า Online Status (เปลี่ยนชื่อเครื่อง / เปิดปิดแจ้งเตือน)
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

    const { page, page_size, action, keyword, date_from, date_to } = parsed.data;
    const offset = (page - 1) * page_size;

    // กำหนด endpoint ที่จะ filter ตาม action
    let endpointFilter: string[];
    if (action === "rename") {
      endpointFilter = ["/api/v2/hardware/school-device/note"];
    } else if (action === "notify") {
      endpointFilter = ["/api/v1/hardware/machine-monitoring/device-notify-setting/toggle"];
    } else {
      endpointFilter = ACTIVITY_ENDPOINTS;
    }

    const where: any = {
      endpoint: { in: endpointFilter },
      is_success: true,
    };

    if (keyword) {
      where.OR = [
        { called_by: { contains: keyword } },
        { request_body: { path: ["device_id"], string_contains: keyword } },
      ];
    }

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
          endpoint: true,
          method: true,
          status_code: true,
          request_body: true,
          called_by: true,
          is_success: true,
          created_at: true,
        },
      }),
      PrismaTimesheet.apiLog.count({ where }),
    ]);

    // รวบรวม user_id ที่ไม่ซ้ำเพื่อ batch query ข้อมูล User
    const userIds = [
      ...new Set(
        logs
          .map((l) => Number(l.called_by))
          .filter((id) => !isNaN(id) && id > 0),
      ),
    ];

    const users = userIds.length > 0
      ? await PrismaTimesheet.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, employee_code: true, firstname_th: true, lastname_th: true },
        })
      : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const formatted = logs.map((log) => {
      const body = (log.request_body ?? {}) as Record<string, any>;
      const isNotify = log.endpoint === "/api/v1/hardware/machine-monitoring/device-notify-setting/toggle";
      const userId = Number(log.called_by);
      const user = userMap.get(userId);
      return {
        id: log.id.toString(),
        action_type: isNotify ? "notify" : "rename",
        action_label: isNotify
          ? body.notify_enabled === true ? "เปิดการแจ้งเตือน" : "ปิดการแจ้งเตือน"
          : "เปลี่ยนชื่อเครื่อง",
        device_id: body.device_id ?? null,
        school_id: body.school_id ?? null,
        value: isNotify ? body.notify_enabled : body.note,
        called_by: log.called_by ?? "—",
        user_employee_code: user?.employee_code ?? null,
        user_fullname: user ? `${user.firstname_th ?? ""} ${user.lastname_th ?? ""}`.trim() : null,
        is_success: log.is_success,
        created_at: log.created_at,
      };
    });

    return NextResponse.json(
      successResponse({
        data: formatted,
        message_th: "ดึงประวัติการกระทำสำเร็จ",
        message_en: "Activity log retrieved",
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
