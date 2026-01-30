import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

/**
 * @description API Path: /api/v2/admin/user-management/bulk-update-employment-type
 * @method POST
 * @param {number[]} userIds - The IDs of the users to update employment type for
 * @param {string} employmentType - The new employment type (FULL_TIME, PART_TIME, CONTRACT, INTERN)
 * @param {number} adminId - The ID of the admin performing the action
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userIds, employmentType, adminId } = body;

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

    if (!employmentType) {
      return NextResponse.json(
        errorResponse({
          message_th: "กรุณาระบุประเภทการจ้างงาน",
          message_en: "Employment type is required",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const result = await UserManagementService.bulkUpdateEmploymentType(
      userIds,
      employmentType,
      adminId ? Number(adminId) : undefined,
    );

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ปรับปรุงประเภทการจ้างงานแบบกลุ่มสำเร็จ",
        message_en: "Successfully updated employment types in bulk",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: err.message || "เกิดข้อผิดพลาดในการปรับปรุงประเภทการจ้างงาน",
      message_en: "Failed to update employment types in bulk",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
