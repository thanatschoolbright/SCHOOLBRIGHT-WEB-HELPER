import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import { deleteSchoolGroupService } from "../_service/school-id-service";
import { deleteSchoolGroupSchema } from "../_validation/school-id-schema";

/**
 * ✨ DELETE handler — ลบข้อมูลกลุ่ม LINE
 */
export async function DELETE(request: NextRequest) {
  // 1️⃣ ตรวจสอบความถูกต้องของ Request
  const { data, error } = await validateRequest(request, deleteSchoolGroupSchema);
  if (error) return error;

  try {
    // 2️⃣ เรียกใช้ Service เพื่อลบข้อมูล
    const result = await deleteSchoolGroupService(data.line_group_id);

    // 3️⃣ ส่งข้อมูลกลับ
    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ลบข้อมูลกลุ่ม LINE สำเร็จ",
        message_en: "Successfully deleted LINE group data",
      }),
      { status: 200 }
    );
  } catch (err: any) {
    // 4️⃣ จัดการข้อผิดพลาด
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการลบข้อมูลกลุ่ม LINE",
        message_en: "Failed to delete LINE group data",
        error: err.message,
      }),
      { status: 500 }
    );
  }
}
