import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

/**
 * @description API Path: /api/v2/admin/user-management/bulk-update-role
 * @method POST
 * @param {number[]} userIds - The IDs of the users to update role for
 * @param {number} roleId - The ID of the new role
 * @param {number} adminId - The ID of the admin performing the action
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userIds, roleId, adminId } = body;

    if (!userIds || userIds.length === 0) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไม่พบ User IDs",
          message_en: "User IDs not found",
          status: 400,
        }),
        { status: 400 },
      );
    }

    if (!roleId) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไม่พบ Role ID",
          message_en: "Role ID not found",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const result = await UserManagementService.bulkUpdateRole(
      userIds,
      Number(roleId),
      adminId ? Number(adminId) : undefined,
    );

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ปรับปรุงสิทธิ์การใช้งานแบบกลุ่มสำเร็จ",
        message_en: "Successfully updated roles in bulk",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: err.message || "เกิดข้อผิดพลาดในการปรับปรุงสิทธิ์",
      message_en: "Failed to update roles in bulk",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
