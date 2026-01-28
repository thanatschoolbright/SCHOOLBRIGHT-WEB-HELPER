import { NextRequest, NextResponse } from "next/server";
import { PermissionManagementService } from "../service/permission-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

/**
 * @description API Path: /api/v2/admin/permission-management/delete
 * @method POST
 * @param {number} id - The ID of the permission to delete
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ids } = body;

    if (!id && (!ids || ids.length === 0)) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไม่พบรหัส Permission ID(s)",
          message_en: "Permission ID(s) not found",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const targetIds = ids || [id];
    const result = await PermissionManagementService.delete(targetIds);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ลบสิทธิ์สำเร็จ",
        message_en: "Successfully deleted permission(s)",
        status: 200,
      }),
    );
  } catch (err: any) {
    const errorBody = errorResponse({
      message_th: "ไม่สามารถลบสิทธิ์ได้",
      message_en: "Failed to delete permission",
      error: err,
    });
    return NextResponse.json(errorBody, { status: errorBody.status || 500 });
  }
}
