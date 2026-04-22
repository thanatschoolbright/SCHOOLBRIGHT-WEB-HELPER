import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import { updateSchoolGroupService } from "../_service/school-id-service";
import { updateSchoolGroupSchema } from "../_validation/school-id-schema";

/**
 * ✨ PATCH handler — แก้ไขข้อมูลกลุ่ม LINE
 */
export async function PATCH(request: NextRequest) {
  // 1️⃣ ตรวจสอบความถูกต้องของ Request
  const { data, error } = await validateRequest(request, updateSchoolGroupSchema);
  if (error) return error;

  try {
    // 2️⃣ เรียกใช้ Service เพื่อแก้ไขข้อมูล
    const result = await updateSchoolGroupService(data);

    // 3️⃣ ส่งข้อมูลกลับ
    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "แก้ไขข้อมูลกลุ่ม LINE สำเร็จ",
        message_en: "Successfully updated LINE group data",
      }),
      { status: 200 }
    );
  } catch (err: any) {
    // 4️⃣ จัดการข้อผิดพลาด
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลกลุ่ม LINE",
        message_en: "Failed to update LINE group data",
        error: err.message,
      }),
      { status: 500 }
    );
  }
}
