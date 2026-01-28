import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import { UpdateUserSchema } from "../validation/user-management.validation";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";

// อัปเดตข้อมูลผู้ใช้งาน
export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, UpdateUserSchema);
  if (error) return error;

  const { id, ...updateData } = data;

  try {
    console.log("request data", data);
    const updatedUser = await UserManagementService.update(id, updateData);

    return NextResponse.json(
      successResponse({
        data: updatedUser,
        message_th: "อัปเดตข้อมูลผู้ใช้งานสำเร็จ",
        message_en: "User updated successfully",
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
        message_en: err.message,
        error: err,
      }),
    );
  }
}
