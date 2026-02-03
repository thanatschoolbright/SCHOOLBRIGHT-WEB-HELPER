import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import { CapturableDetailsService } from "../service/capturable-details.service";
import { ReadCapturableDetailsSchema } from "../validation/capturable-details.validation";

/**
 * API สำหรับดึงรายละเอียดรายการลงเวลาของโครงการ (Tracking รายคน)
 * รองรับการวิเคราะห์ Capitalization
 */
export async function POST(request: NextRequest) {
  // 1. ตรวจสอบความถูกต้องของ Request Body
  const { data, error } = await validateRequest(
    request,
    ReadCapturableDetailsSchema,
  );
  if (error) {
    return error;
  }

  try {
    // 2. เรียกใช้งาน Service เพื่อดึงข้อมูลประกอบ
    const result = await CapturableDetailsService.getEntriesByProject(
      data.project_id,
      data.start_date,
      data.end_date,
    );

    // 3. ส่งข้อมูลกลับรูปแบบมาตรฐาน
    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงข้อมูลรายละเอียดสำเร็จ",
        message_en: "Get project tracking details successfully",
      }),
    );
  } catch (error: any) {
    // 4. กรณีเกิดข้อผิดพลาด
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        message_en: "Error fetching details",
        error,
      }),
    );
  }
}
