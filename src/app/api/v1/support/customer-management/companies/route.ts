import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { PERMISSIONS } from "@/constants/permission.constant";
import { NextResponse } from "next/server";
import { getAllCompanies } from "../customer-management.service";

// ดึงรายชื่อโรงเรียนทั้งหมดสำหรับ dropdown filter
export async function GET() {
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

    const companies = await getAllCompanies();
    return NextResponse.json(
      successResponse({ data: companies, message_th: "ดึงข้อมูลสำเร็จ", message_en: "Success" }),
      { status: 200 },
    );
  } catch (err) {
    return handleError(err, "[CUSTOMER_COMPANIES_ERROR]");
  }
}
