import { UserManagementService } from "@/app/api/v2/admin/user-management/service/user-management.service";
import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ChangePasswordSchema = z.object({
  old_password: z.string().min(1, "กรุณาระบุรหัสผ่านปัจจุบัน"),
  new_password: z
    .string()
    .min(8, "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร"),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      errorResponse({
        message_th: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
        message_en: "Unauthorized",
      }),
      { status: 401 },
    );
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        errorResponse({
          message_en: "Invalid JSON body",
          message_th: "ข้อมูล JSON ไม่ถูกต้อง",
          status: 400,
        }),
        { status: 400 },
      );
    }
    const validated = ChangePasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        errorResponse({
          message_th: validated.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง",
          message_en: "Validation Error",
        }),
        { status: 400 },
      );
    }

    const userId = (session.user as any).id;
    const { old_password, new_password } = validated.data;

    await UserManagementService.changePassword(
      Number(userId),
      old_password,
      new_password,
    );

    return NextResponse.json(
      successResponse({
        data: { success: true },
        message_th: "เปลี่ยนรหัสผ่านสำเร็จแล้ว",
        message_en: "Password changed successfully",
      }),
    );
  } catch (error: any) {
    console.error("[API Change Password Error]:", error);

    let messageTh = "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน";
    let status = 500;

    if (error.message === "INVALID_OLD_PASSWORD") {
      messageTh = "รหัสผ่านปัจจุบันไม่ถูกต้อง";
      status = 400;
    } else if (error.message === "USER_NOT_FOUND") {
      messageTh = "ไม่พบข้อมูลผู้ใช้งาน";
      status = 404;
    }

    return NextResponse.json(
      errorResponse({
        message_th: messageTh,
        message_en: error.message,
      }),
      { status },
    );
  }
}
