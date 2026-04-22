import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
import { NextRequest, NextResponse } from "next/server";

// GET handler ดึงรายชื่อ LINE Group ทั้งหมดจาก TLineGroup (Jabjai Master) รวมกับ active group จาก Timesheet DB
export async function GET() {
  try {
    const [tLineGroups, timesheetGroups] = await Promise.all([
      PrismaJabjaiMaster.tLineGroup.findMany({
        orderBy: { CreateDate: "desc" },
      }),
      PrismaTimesheet.lineGroup.findMany({
        orderBy: { created_at: "desc" },
      }),
    ]);

    const activeGroupId = process.env.LINE_MONITORING_GROUP_ID ?? null;
    const activeTimesheetGroupId =
      timesheetGroups.find((g) => g.is_active)?.group_id ?? activeGroupId;

    return NextResponse.json(
      successResponse({
        data: {
          groups: tLineGroups.map((g) => ({
            id: g.LineGroupId,
            group_id: g.GroupId,
            school_id: g.SchoolId,
            group_name: null,
            group_type: g.GroupType,
            has_token: !!g.LineNotificationAccessToken,
            is_active: g.GroupId === activeTimesheetGroupId,
            created_at: g.CreateDate,
          })),
          bot_groups: timesheetGroups.map((g) => ({
            id: g.id,
            group_id: g.group_id,
            group_name: g.group_name,
            is_active: g.is_active,
            created_at: g.created_at,
          })),
          active_group_id: activeTimesheetGroupId,
          total: tLineGroups.length,
        },
        message_th: "ดึงรายชื่อ LINE Group สำเร็จ",
        message_en: "LINE groups retrieved successfully",
      }),
      { status: 200 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
        message_en: "Internal Server Error",
        error: msg,
      }),
      { status: 500 },
    );
  }
}

// PUT handler ตั้งค่า active group สำหรับส่งรายงาน (บันทึกลง .env runtime)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { group_id } = body as { group_id: string };

    if (!group_id) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_th: "กรุณาระบุ group_id",
          message_en: "group_id is required",
        }),
        { status: 400 },
      );
    }

    const group = await PrismaTimesheet.lineGroup.findUnique({
      where: { group_id },
    });

    if (!group) {
      return NextResponse.json(
        errorResponse({
          status: 404,
          message_th: "ไม่พบ LINE Group นี้ในระบบ",
          message_en: "LINE Group not found",
        }),
        { status: 404 },
      );
    }

    // อัพเดท runtime env และ mark active ใน DB เพื่อให้ persist ข้าม serverless instance
    process.env.LINE_MONITORING_GROUP_ID = group_id;
    await PrismaTimesheet.lineGroup.updateMany({
      where: { is_active: true },
      data: { is_active: false },
    });
    await PrismaTimesheet.lineGroup.update({
      where: { group_id },
      data: { is_active: true },
    });

    return NextResponse.json(
      successResponse({
        data: {
          group_id: group.group_id,
          group_name: group.group_name,
        },
        message_th: `ตั้งค่ากลุ่ม "${
          group.group_name ?? group.group_id
        }" สำเร็จ`,
        message_en: "Active LINE group updated successfully",
      }),
      { status: 200 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
        message_en: "Internal Server Error",
        error: msg,
      }),
      { status: 500 },
    );
  }
}
