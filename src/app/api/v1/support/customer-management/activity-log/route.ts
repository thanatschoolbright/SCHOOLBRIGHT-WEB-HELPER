import { auth } from "@/auth";
import { buildPagination } from "@/helpers/controller/build-pagination.params";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { PERMISSIONS } from "@/constants/permission.constant";
import { NextRequest, NextResponse } from "next/server";
import { ActivityLogQuerySchema } from "../customer-management.schema";
import { getActivityLogs } from "../customer-management.service";

// ดึง activity log ของ customer-management พร้อม join ชื่อ User ผู้ดำเนินการ
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบ", message_en: "Unauthorized" }), { status: 401 });
    }
    const permissions: string[] = (session.user as any).permissions ?? [];
    const isAdmin = (session.user as any).admin_id === 117;
    if (!isAdmin && !permissions.includes(PERMISSIONS.MENU_SUPPORT_CUSTOMER) && !permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
      return NextResponse.json(errorResponse({ status: 403, message_th: "ไม่มีสิทธิ์เข้าถึง", message_en: "Forbidden" }), { status: 403 });
    }

    const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = ActivityLogQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(errorResponse({ status: 400, message_th: "พารามิเตอร์ไม่ถูกต้อง", message_en: "Invalid parameters" }), { status: 400 });
    }

    const { logs, total } = await getActivityLogs(parsed.data);
    const { page, page_size } = parsed.data;

    return NextResponse.json(
      successResponse({ data: logs, pagination: buildPagination((page - 1) * page_size, page_size, total), message_th: "ดึงข้อมูลสำเร็จ", message_en: "Success" }),
      { status: 200 },
    );
  } catch (err) {
    return handleError(err, "[CUSTOMER_ACTIVITY_LOG_ERROR]");
  }
}
