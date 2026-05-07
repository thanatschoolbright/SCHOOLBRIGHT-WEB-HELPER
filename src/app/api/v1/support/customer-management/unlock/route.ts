import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { validateRequest } from "@/helpers/api/validate.request";
import { PERMISSIONS } from "@/constants/permission.constant";
import { NextRequest, NextResponse } from "next/server";
import { UnlockCustomerSchema } from "../customer-management.schema";
import { unlockCustomer } from "../customer-management.service";

// ปลดล็อกบัญชีลูกค้ารายเดียว
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

    const validated = await validateRequest(request, UnlockCustomerSchema);
    if ("error" in validated) return validated.error;

    const u = session.user as any;
    const calledBy = String(u.id ?? "unknown");
    const operatorMeta = {
      name: `${u.firstname_th ?? ""} ${u.lastname_th ?? ""}`.trim() || u.username,
      employee_code: u.employee_code,
    };
    const updatedUser = await unlockCustomer(validated.data, calledBy, operatorMeta);

    return NextResponse.json(
      successResponse({
        data: updatedUser,
        message_th: `ปลดล็อกบัญชีลูกค้า "${updatedUser.sName} ${updatedUser.sLastname}" สำเร็จ`,
        message_en: "Customer account unlocked successfully",
      }),
      { status: 200 },
    );
  } catch (err) {
    return handleError(err, "[CUSTOMER_UNLOCK_ERROR]");
  }
}
