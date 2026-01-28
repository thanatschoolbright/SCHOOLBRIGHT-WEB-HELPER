import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

/**
 * @description API Path: /api/v2/admin/user-management/reset-password-to-phone
 * @method POST
 * @param {number} userId - The ID of the user to reset password for
 * @param {number} adminId - The ID of the admin performing the action
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userIds, adminId } = body;

    if (!userId && (!userIds || userIds.length === 0)) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไม่พบ User ID(s)",
          message_en: "User ID(s) not found",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const finalIds = userIds || [userId];
    const result = await UserManagementService.resetPasswordToPhone(
      finalIds,
      adminId ? Number(adminId) : undefined,
    );

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "รีเซ็ตรหัสผ่านเป็นเบอร์โทรศัพท์สำเร็จ",
        message_en: "Successfully reset password to phone number",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: err.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน",
      message_en: "Failed to reset password",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
