import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import { CreateUserSchema } from "../validation/user-management.validation";
import { successResponse, errorResponse } from "@/helpers/api/response";
// Assuming validateRequest is available at this path or similar.
// If not, I will implement a local one or use the one from example.
// The example used: import { validateRequest } from "@helpers/api/validate.request";
import { validateRequest } from "@helpers/api/validate.request";

// สร้างผู้ใช้งานใหม่
export async function POST(request: NextRequest) {
  // Validate request body
  const { data, error } = await validateRequest(request, CreateUserSchema);
  if (error) return error;

  try {
    const newUser = await UserManagementService.create(data);

    return NextResponse.json(
      successResponse({
        data: newUser,
        message_th: "สร้างผู้ใช้งานสำเร็จ",
        message_en: "User created successfully",
        status: 201,
      }),
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน",
        message_en: err.message,
        error: err,
        status: 500,
      }),
    );
  }
}
