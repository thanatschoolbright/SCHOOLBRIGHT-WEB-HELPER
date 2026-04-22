import { auth } from "@/auth";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { NextRequest, NextResponse } from "next/server";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "Asia/Bangkok";

/**
 * ตรวจสอบว่า description นั้นมีวันที่ผิดปกติหรือไม่
 * (end_date < start_date เนื่องจาก bug ข้ามเที่ยงคืน)
 */
function isDateAnomalous(
  startDate: Date | null,
  endDate: Date | null,
): boolean {
  if (!startDate || !endDate) return false;
  return dayjs(endDate).isBefore(dayjs(startDate));
}

/**
 * คำนวณ end_date ที่ถูกต้องโดยเพิ่ม 1 วันจาก end_date ที่ผิด
 * เพื่อแก้ปัญหากรณีที่ end_date ถูกบันทึกผิดวัน (-1 วัน)
 */
function computeCorrectEndDate(endDate: Date): Date {
  return dayjs(endDate).add(1, "day").toDate();
}

/**
 * GET /api/v1/timesheet/overtime/fix-dates
 * ดึงรายการ OvertimeDescription ที่มีวันที่ผิดปกติ (end_date < start_date)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไม่ได้รับอนุญาต",
          message_en: "Unauthorized",
          status: 401,
        }),
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const overtimeId = searchParams.get("overtime_id");

    // ดึง descriptions ทั้งหมดที่ end_date < start_date
    const descriptions = await PrismaTimesheet.overtimeDescription.findMany({
      where: {
        ...(overtimeId ? { overtimeId: Number(overtimeId) } : {}),
        startDate: { not: null },
        endDate: { not: null },
      },
      include: {
        overtime: {
          select: {
            id: true,
            requesterId: true,
            requestDate: true,
            status: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    // กรองเฉพาะที่ end_date < start_date (วันผิด)
    const anomalous = descriptions.filter((d) =>
      isDateAnomalous(d.startDate, d.endDate),
    );

    const result = anomalous.map((d) => ({
      description_id: d.id,
      overtime_id: d.overtimeId,
      overtime_status: (d as any).overtime?.status ?? "-",
      request_date: (d as any).overtime?.requestDate ?? null,
      start_date: d.startDate,
      end_date: d.endDate,
      suggested_end_date: computeCorrectEndDate(d.endDate!),
      duration: Number(d.duration),
      description: d.description,
    }));

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: `พบ ${result.length} รายการที่มีวันที่ผิดปกติ`,
        message_en: `Found ${result.length} anomalous date records`,
      }),
    );
  } catch (err) {
    return handleError(err, "GET /fix-dates");
  }
}

/**
 * PATCH /api/v1/timesheet/overtime/fix-dates
 * แก้ไข end_date ของ OvertimeDescription ที่ระบุ
 * Body: { description_ids: number[], mode: "auto" | "manual", manual_end_date?: string }
 * - mode "auto"   → เพิ่ม 1 วันจาก end_date เดิม
 * - mode "manual" → ใช้ manual_end_date ที่ส่งมา (ISO string)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({
          message_th: "ไม่ได้รับอนุญาต",
          message_en: "Unauthorized",
          status: 401,
        }),
        { status: 401 },
      );
    }

    const body = await req.json();
    const { description_ids, mode, manual_end_date } = body as {
      description_ids: number[];
      mode: "auto" | "manual";
      manual_end_date?: string;
    };

    if (!Array.isArray(description_ids) || description_ids.length === 0) {
      return NextResponse.json(
        errorResponse({
          message_th: "โปรดระบุ description_ids",
          message_en: "description_ids is required",
          status: 400,
        }),
        { status: 400 },
      );
    }

    if (mode === "manual" && !manual_end_date) {
      return NextResponse.json(
        errorResponse({
          message_th: "โปรดระบุ manual_end_date เมื่อใช้ mode manual",
          message_en: "manual_end_date is required for manual mode",
          status: 400,
        }),
        { status: 400 },
      );
    }

    // ดึงข้อมูลเดิมก่อนแก้ไข
    const existing = await PrismaTimesheet.overtimeDescription.findMany({
      where: { id: { in: description_ids } },
    });

    const results: Array<{
      description_id: number;
      success: boolean;
      new_end_date?: Date;
      error?: string;
    }> = [];

    for (const desc of existing) {
      try {
        let newEndDate: Date;

        if (mode === "auto") {
          if (!desc.endDate) {
            results.push({
              description_id: desc.id,
              success: false,
              error: "ไม่มี end_date เดิม",
            });
            continue;
          }
          newEndDate = computeCorrectEndDate(desc.endDate);
        } else {
          newEndDate = dayjs.tz(manual_end_date!, TZ).toDate();
        }

        // คำนวณ duration ใหม่จาก start_date และ new_end_date
        const newDurationHours = desc.startDate
          ? Number(
              (
                dayjs(newEndDate).diff(dayjs(desc.startDate), "minute") / 60
              ).toFixed(2),
            )
          : Number(desc.duration);

        await PrismaTimesheet.overtimeDescription.update({
          where: { id: desc.id },
          data: {
            endDate: newEndDate,
            duration:
              newDurationHours > 0 ? newDurationHours : Number(desc.duration),
          },
        });

        results.push({
          description_id: desc.id,
          success: true,
          new_end_date: newEndDate,
        });
      } catch (err: any) {
        results.push({
          description_id: desc.id,
          success: false,
          error: err?.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json(
      successResponse({
        data: results,
        message_th: `แก้ไขสำเร็จ ${successCount} รายการ${
          failCount > 0 ? `, ล้มเหลว ${failCount} รายการ` : ""
        }`,
        message_en: `Fixed ${successCount} records${
          failCount > 0 ? `, failed ${failCount}` : ""
        }`,
      }),
    );
  } catch (err) {
    return handleError(err, "PATCH /fix-dates");
  }
}
