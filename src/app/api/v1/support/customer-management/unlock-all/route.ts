import { auth } from "@/auth";
import { errorResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { PERMISSIONS } from "@/constants/permission.constant";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { unlockAllCustomers } from "../customer-management.service";

const BodySchema = z.object({
  company_id: z.number().int().positive().optional(),
});

// ปลดล็อกบัญชีลูกค้าทั้งหมด — ส่ง SSE stream แสดง % ความคืบหน้า
export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    const dto = parsed.success ? parsed.data : {};
    const u = session.user as any;
    const calledBy = String(u.id ?? "unknown");
    const operatorMeta = {
      name: `${u.firstname_th ?? ""} ${u.lastname_th ?? ""}`.trim() || u.username,
      employee_code: u.employee_code,
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          send({ type: "start", unlocked: 0, total: 0, percent: 0 });

          const result = await unlockAllCustomers(dto, calledBy, operatorMeta, (unlocked, total) => {
            const percent = Math.min(Math.round((unlocked / total) * 100), 99);
            send({ type: "progress", unlocked, total, percent });
          });

          send({ type: "done", unlocked: result.unlocked, total: result.total, percent: 100 });
        } catch (err: any) {
          send({ type: "error", message: err?.message ?? "เกิดข้อผิดพลาด" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return handleError(err, "[CUSTOMER_UNLOCK_ALL_ERROR]");
  }
}
