import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import {
  buildSchoolDeviceReport,
  linePushMessage,
} from "@services/line/line-push.service";
import { NextRequest, NextResponse } from "next/server";

// GET handler — ส่งรายงานสถานะฮาร์ดแวร์ของโรงเรียนเดียวไปยัง LINE Group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ school_id: string }> },
): Promise<NextResponse> {
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

  // ลำดับความสำคัญ: query param > env var > active group ใน DB
  const { searchParams } = new URL(request.url);
  let groupId =
    searchParams.get("group_id") ??
    process.env.LINE_MONITORING_GROUP_ID ??
    null;

  if (!groupId) {
    // fallback: ดึง group ล่าสุดที่ active จาก DB
    const activeGroup = await PrismaTimesheet.lineGroup
      .findFirst({
        where: { is_active: true },
        orderBy: { updated_at: "desc" },
      })
      .catch(() => null);
    groupId = activeGroup?.group_id ?? null;
  }

  if (!groupId) {
    return NextResponse.json(
      errorResponse({
        status: 503,
        message_th:
          "ยังไม่ได้ตั้งค่า LINE Group เป้าหมาย กรุณาเลือกกลุ่มก่อนส่งรายงาน",
        message_en: "LINE target group is not configured",
      }),
      { status: 503 },
    );
  }

  try {
    const { messages, schoolName, total, online, offline } =
      await buildSchoolDeviceReport(schoolIdNum);

    await linePushMessage(groupId, messages);

    return NextResponse.json(
      successResponse({
        status: 200,
        message_th: `ส่งรายงานสถานะเครื่องของ ${schoolName} ไปยัง LINE สำเร็จ`,
        message_en: "School device status report sent to LINE successfully",
        data: {
          school_id: schoolIdNum,
          school_name: schoolName,
          group_id: groupId,
          total_devices: total,
          online_devices: online,
          offline_devices: offline,
        },
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดขณะส่งรายงานไปยัง LINE",
        message_en: message,
      }),
      { status: 500 },
    );
  }
}
