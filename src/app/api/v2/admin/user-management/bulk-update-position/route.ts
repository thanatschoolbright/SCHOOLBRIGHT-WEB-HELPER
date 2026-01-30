import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

/**
 * @description API Path: /api/v2/admin/user-management/bulk-update-position
 * @method POST
 * @param {number[]} userIds - The IDs of the users to update position for
 * @param {number} positionId - The ID of the new position
 * @param {number} adminId - The ID of the admin performing the action
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userIds, positionId, adminId } = body;

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

    if (!positionId) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไม่พบ Position ID",
          message_en: "Position ID not found",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const result = await UserManagementService.bulkUpdatePosition(
      userIds,
      Number(positionId),
      adminId ? Number(adminId) : undefined,
    );

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ปรับปรุงตำแหน่งแบบกลุ่มสำเร็จ",
        message_en: "Successfully updated positions in bulk",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: err.message || "เกิดข้อผิดพลาดในการปรับปรุงตำแหน่ง",
      message_en: "Failed to update positions in bulk",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
