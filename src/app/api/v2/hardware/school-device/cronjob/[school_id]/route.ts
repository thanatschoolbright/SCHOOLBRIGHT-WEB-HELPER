import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
import {
  buildSchoolDeviceReport,
  buildSchoolDeviceStatusData,
  linePushMessage,
} from "@services/line/line-push.service";
import { NextRequest, NextResponse } from "next/server";

// GET handler — ดึงสถานะเครื่องทุกเครื่องของโรงเรียน พร้อมส่งรายงานไปยัง LINE Group และคืน response รวม
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ school_id: string }> },
): Promise<NextResponse> {
  const { school_id } = await params;

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      errorResponse({
        status: 401,
        message_th: "ไม่มีสิทธิ์เข้าถึง",
        message_en: "Unauthorized",
      }),
      { status: 401 },
    );
  }

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
    // ดึงข้อมูลสถานะเครื่องและ LINE group พร้อมกัน
    const [deviceData, schoolLineGroup] = await Promise.all([
      buildSchoolDeviceStatusData(schoolIdNum),
      PrismaJabjaiMaster.tLineGroup
        .findFirst({
          where: { SchoolId: schoolIdNum },
          orderBy: { CreateDate: "desc" },
        })
        .catch(() => null),
    ]);

    if (!deviceData) {
      return NextResponse.json(
        errorResponse({
          status: 404,
          message_th: `ไม่พบข้อมูลโรงเรียน รหัส ${schoolIdNum}`,
          message_en: `School ${schoolIdNum} not found`,
        }),
        { status: 404 },
      );
    }

    // ส่ง LINE notification ถ้ามี group ที่กำหนด
    const { searchParams } = new URL(request.url);
    const groupId =
      schoolLineGroup?.GroupId ??
      searchParams.get("group_id") ??
      process.env.LINE_MONITORING_GROUP_ID ??
      null;

    let lineResult: { success: boolean; group_id: string | null; error?: string } = {
      success: false,
      group_id: null,
    };

    if (groupId) {
      try {
        const { messages } = await buildSchoolDeviceReport(schoolIdNum);
        await linePushMessage(groupId, messages);
        lineResult = { success: true, group_id: groupId };
      } catch (lineErr: unknown) {
        lineResult = {
          success: false,
          group_id: groupId,
          error: lineErr instanceof Error ? lineErr.message : "LINE push failed",
        };
      }
    }

    return NextResponse.json(
      successResponse({
        message_th: `ดึงข้อมูลสถานะเครื่องของ ${deviceData.school_name} สำเร็จ`,
        message_en: "School device status retrieved successfully",
        data: {
          ...deviceData,
          line: lineResult,
        },
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleError(err, "GET /api/v2/hardware/school-device/cronjob/[school_id]");
  }
}
