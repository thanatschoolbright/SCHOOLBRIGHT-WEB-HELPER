import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { buildSchoolDeviceReport } from "@services/line/line-push.service";
import { NextRequest, NextResponse } from "next/server";

// GET handler — ดึงข้อมูล Preview สำหรับรายงานสถานะฮาร์ดแวร์ของโรงเรียน (โดยไม่ส่งจริง)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ school_id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      errorResponse({
        status: 401,
        message_th: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
        message_en: "Unauthorized",
      }),
      { status: 401 },
    );
  }

  const { school_id } = await params;

  // ตรวจสอบว่า school_id เป็นตัวเลขที่ถูกต้อง
  const schoolIdNum = parseInt(school_id, 10);
  if (isNaN(schoolIdNum) || schoolIdNum <= 0) {
    return NextResponse.json(
      errorResponse({
        status: 400,
        message_th: "รหัสโรงเรียนไม่ถูกต้อง กรุณาระบุตัวเลขที่มากกว่า 0",
        message_en: "Invalid school_id parameter",
      }),
      { status: 400 },
    );
  }

  try {
    // ✨ ดึงข้อมูลรายงานโดยไม่ส่งเข้า LINE API
    const { messages, schoolName, total, online, offline } =
      await buildSchoolDeviceReport(schoolIdNum);

    return NextResponse.json(
      successResponse({
        status: 200,
        message_th: `ดึงข้อมูล Preview ของ ${schoolName} สำเร็จ`,
        message_en: "School device report preview generated successfully",
        data: {
          school_id: schoolIdNum,
          school_name: schoolName,
          total_devices: total,
          online_devices: online,
          offline_devices: offline,
          preview_messages: messages,
        },
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดขณะดึงข้อมูล Preview",
        message_en: message,
      }),
      { status: 500 },
    );
  }
}
