import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import prisma from "@helpers/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateNoteSchema = z.object({
  school_id: z.number({ required_error: "school_id จำเป็น" }),
  device_id: z.string().min(1, "device_id จำเป็น"),
  note: z.string().max(200, "ชื่อเล่นต้องไม่เกิน 200 ตัวอักษร").nullable(),
});

// PATCH handler — อัพเดทชื่อเล่น (Note) ของอุปกรณ์ใน DeviceDailyStatus
export async function PATCH(request: NextRequest): Promise<NextResponse> {
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

    const { error, data } = await validateRequest(request, updateNoteSchema);
    if (error) return error;

    const noteValue = data.note?.trim() || null;

    const result = await prisma.deviceDailyStatus.updateMany({
      where: {
        SchoolID: data.school_id,
        DeviceID: data.device_id,
      },
      data: { Note: noteValue },
    });

    if (result.count === 0) {
      return NextResponse.json(
        errorResponse({
          status: 404,
          message_th: "ไม่พบอุปกรณ์ที่ระบุ",
          message_en: "Device not found",
        }),
        { status: 404 },
      );
    }

    // บันทึก activity log ลงตาราง api_log (timesheet DB)
    PrismaTimesheet.apiLog.create({
      data: {
        request_time: new Date(),
        method: "PATCH",
        endpoint: "/api/v2/hardware/school-device/note",
        url: "/api/v2/hardware/school-device/note",
        service_name: "machine-monitoring",
        request_body: { school_id: data.school_id, device_id: data.device_id, note: noteValue },
        status_code: 200,
        is_success: true,
        called_by: String(session.user.id ?? "unknown"),
      },
    }).catch(() => undefined);

    return NextResponse.json(
      successResponse({
        data: {
          school_id: data.school_id,
          device_id: data.device_id,
          note: noteValue,
          updated_count: result.count,
        },
        message_th: "บันทึกชื่อเล่นอุปกรณ์สำเร็จ",
        message_en: "Device note updated successfully",
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "ไม่สามารถบันทึกชื่อเล่นได้",
        message_en: message,
      }),
      { status: 500 },
    );
  }
}
