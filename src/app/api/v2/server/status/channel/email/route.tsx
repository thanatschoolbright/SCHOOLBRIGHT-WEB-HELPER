import { errorResponse, successResponse } from "@/helpers/api/response";
import { NextResponse } from "next/server";
import { fetchAndSendServerStatusEmail } from "./_service/server-email-service";

/**
 * GET Handler สำหรับการส่งรายงานสถานะ Server ทาง Email
 * Business Logic ทั้งหมดจะถูกจัดการใน Service ตามมาตรฐาน Clean Architecture
 */
export async function GET() {
  try {
    const result = await fetchAndSendServerStatusEmail();

    if (!result.success) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_th: "ส่งอีเมลรายงานสถานะ Server ไม่สำเร็จ",
          message_en: "Failed to send server status report email",
          error: result.error,
        }),
        { status: 500 },
      );
    }

    return NextResponse.json(
      successResponse({
        data: result.data,
        message_th: "ส่งอีเมลรายงานสถานะ Server สำเร็จแล้ว",
        message_en: "Server status report email sent successfully",
      }),
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการประมวลผลการส่งอีเมล",
        message_en: "Error processing email delivery",
        error: message,
      }),
      { status: 500 },
    );
  }
}
