import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import { DeleteUserSchema } from "../validation/user-management.validation";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";

// ลบผู้ใช้งาน (Soft Delete)
export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, DeleteUserSchema);
  if (error) return error;

  const { id, deleted_by } = data;

  try {
    await UserManagementService.delete(id, deleted_by);

    return NextResponse.json(
      successResponse({
        data: { id },
        message_th: "ลบผู้ใช้งานสำเร็จ",
        message_en: "User deleted successfully",
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการลบผู้ใช้งาน",
        message_en: err.message,
        error: err,
      }),
    );
  }
}
