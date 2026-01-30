import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import { auth } from "@/auth";

/**
 * @notice API ปลดล็อกผู้ใช้งาน (Reset failed_login_attempts)
 * สำหรับกรณีโดนระงับอัตโนมัติเนื่องจากระบุรหัสผ่านผิดเกิน 5 ครั้ง
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message_th: "ไม่พบรหัสผู้ใช้งาน", message_en: "User ID is required" },
        { status: 400 },
      );
    }

    const updatedBy = (session.user as any)?.admin_id;

    const result = await UserManagementService.unlock(Number(id), updatedBy);

    return NextResponse.json({
      status: 200,
      message_th: "ปลดล็อกบัญชีผู้ใช้งานสำเร็จ",
      message_en: "Account unlocked successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ [USER_UNLOCK_ERROR]:", error);
    return NextResponse.json(
      {
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการปลดล็อกบัญชี",
        message_en: "Internal server error during account unlock",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
