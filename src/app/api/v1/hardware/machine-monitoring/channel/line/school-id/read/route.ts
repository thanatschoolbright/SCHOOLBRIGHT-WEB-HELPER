import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import { getSchoolGroupService } from "../_service/school-id-service";
import { schoolIdSchema } from "../_validation/school-id-schema";

/**
 * ✨ POST handler — ดึงข้อมูลกลุ่ม LINE จาก Jabjai Master DB พร้อมระบบแบ่งหน้า
 */
export async function POST(request: NextRequest) {
  // 1️⃣ ตรวจสอบความถูกต้องของ Request
  const { data, error } = await validateRequest(request, schoolIdSchema);
  if (error) return error;

  try {
    const { page, limit, school_id } = data;
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    // 2️⃣ เรียกใช้ Service เพื่อดึงข้อมูล
    const { items, total } = await getSchoolGroupService({
      limit: take,
      skip,
      school_id,
    });

    const total_pages = Math.ceil(total / take);

    // 3️⃣ ส่งข้อมูลกลับพร้อม Pagination
    return NextResponse.json(
      successResponse({
        data: items,
        pagination: {
          page: Number(page),
          page_size: take,
          total,
          total_pages,
        },
        message_th: "ดึงข้อมูลกลุ่ม LINE สำเร็จ",
        message_en: "Successfully fetched LINE group data",
      }),
      { status: 200 }
    );
  } catch (err: any) {
    // 4️⃣ จัดการข้อผิดพลาด
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูลกลุ่ม LINE",
        message_en: "Failed to fetch LINE group data",
        error: err.message,
      }),
      { status: 500 }
    );
  }
}
