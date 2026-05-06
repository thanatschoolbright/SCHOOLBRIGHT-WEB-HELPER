import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import prisma from "@helpers/prisma";
import { NextResponse } from "next/server";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// DELETE handler — ลบเครื่องที่ OnlineTime เกิน 7 วัน หรือ OnlineTime เป็น null
export async function DELETE(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({
          status: 401,
          message_th: "กรุณาเข้าสู่ระบบก่อน",
          message_en: "Unauthorized",
        }),
        { status: 401 },
      );
    }

    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

    // ดึงรายการก่อนลบ เพื่อนับและ preview
    const candidates = await prisma.deviceDailyStatus.findMany({
      where: {
        OR: [
          { OnlineTime: { lt: cutoff } },
          { OnlineTime: null },
        ],
      },
      select: {
        DeviceStatusID: true,
        SchoolID: true,
        DeviceID: true,
        AppName: true,
        Note: true,
        OnlineTime: true,
      },
    });

    if (candidates.length === 0) {
      return NextResponse.json(
        successResponse({
          data: { deleted: 0, schools_affected: 0, preview: [] },
          message_th: "ไม่พบเครื่องที่ Offline เกิน 7 วัน",
          message_en: "No devices to delete",
        }),
        { status: 200 },
      );
    }

    const ids = candidates.map((d) => d.DeviceStatusID);
    const result = await prisma.deviceDailyStatus.deleteMany({
      where: { DeviceStatusID: { in: ids } },
    });

    const schoolsAffected = new Set(candidates.map((d) => d.SchoolID)).size;

    return NextResponse.json(
      successResponse({
        data: {
          deleted: result.count,
          schools_affected: schoolsAffected,
          cutoff_date: cutoff.toISOString(),
          preview: candidates.slice(0, 5).map((d) => ({
            school_id: d.SchoolID,
            device_id: d.DeviceID,
            app_name: d.AppName ?? "ไม่ระบุ",
            note: d.Note?.trim() ?? null,
            last_online: d.OnlineTime?.toISOString() ?? null,
          })),
        },
        message_th: `ลบเครื่องที่ไม่ได้ใช้งานเกิน 7 วันสำเร็จ จำนวน ${result.count} เครื่อง`,
        message_en: `Deleted ${result.count} inactive devices`,
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "ไม่สามารถลบข้อมูลเครื่องได้",
        message_en: message,
      }),
      { status: 500 },
    );
  }
}

// GET handler — preview รายการที่จะถูกลบ โดยยังไม่ลบจริง
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({
          status: 401,
          message_th: "กรุณาเข้าสู่ระบบก่อน",
          message_en: "Unauthorized",
        }),
        { status: 401 },
      );
    }

    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

    const candidates = await prisma.deviceDailyStatus.findMany({
      where: {
        OR: [
          { OnlineTime: { lt: cutoff } },
          { OnlineTime: null },
        ],
      },
      select: {
        SchoolID: true,
        DeviceID: true,
        AppName: true,
        Note: true,
        OnlineTime: true,
      },
      orderBy: [{ SchoolID: "asc" }, { OnlineTime: "asc" }],
    });

    const schoolsAffected = new Set(candidates.map((d) => d.SchoolID)).size;

    return NextResponse.json(
      successResponse({
        data: {
          count: candidates.length,
          schools_affected: schoolsAffected,
          cutoff_date: cutoff.toISOString(),
          items: candidates.map((d) => ({
            school_id: d.SchoolID,
            device_id: d.DeviceID,
            app_name: d.AppName ?? "ไม่ระบุ",
            note: d.Note?.trim() ?? null,
            last_online: d.OnlineTime?.toISOString() ?? null,
          })),
        },
        message_th: "ดึงรายการเครื่องที่จะถูกลบสำเร็จ",
        message_en: "Preview of devices to be deleted",
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "ไม่สามารถดึงข้อมูลได้",
        message_en: message,
      }),
      { status: 500 },
    );
  }
}
