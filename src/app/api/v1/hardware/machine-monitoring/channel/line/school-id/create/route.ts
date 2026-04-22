import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import { createSchoolGroupService } from "../_service/school-id-service";
import { createSchoolGroupSchema } from "../_validation/school-id-schema";

/**
 * ✨ POST handler — สร้างกลุ่ม LINE ใหม่
 */
export async function POST(request: NextRequest) {
  // 1️⃣ ตรวจสอบความถูกต้องของ Request
  const { data, error } = await validateRequest(request, createSchoolGroupSchema);
  if (error) return error;

  try {
    // 2️⃣ เรียกใช้ Service เพื่อสร้างข้อมูล
    const result = await createSchoolGroupService(data);

    // 3️⃣ ส่งข้อมูลกลับ
    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "สร้างข้อมูลกลุ่ม LINE สำเร็จ",
        message_en: "Successfully created LINE group data",
      }),
      { status: 201 }
    );
  } catch (err: any) {
    // 4️⃣ จัดการข้อผิดพลาด
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการสร้างข้อมูลกลุ่ม LINE",
        message_en: "Failed to create LINE group data",
        error: err.message,
      }),
      { status: 500 }
    );
  }
}
