import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { SummaryService } from "@/services/backend/timesheet/summary.service";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import z from "zod";
import dayjs from "dayjs";

/**
 * Validator สำหรับ Request Body
 */
const Schema = z.object({
  user_id: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  month: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val ? Number(val) : dayjs().month() + 1)),
  year: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => (val ? Number(val) : dayjs().year())),
  target_hours: z.number().optional().default(8),
});

/**
 * API สำหรับคำนวณข้อมูลสรุปรายเดือนของพนักงาน
 * เพื่อใช้ในหน้า Dashboard / Heatmap
 */
export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, Schema);

  if (error) {
    return error;
  }

  try {
    const { user_id, month, year, target_hours } = data;

    // 1. ตรวจสอบว่าพนักงานมีตัวตนหรือไม่ (Optional แต่ดีสำหรับ Error Handling)
    // เราอนุญาตให้ใช้ admin_id ตรงๆ

    // 2. เรียกใช้ Service เพื่อคำนวณ
    const result = await SummaryService.calculateMonthly(
      user_id,
      month,
      year,
      target_hours,
    );

    return NextResponse.json(
      successResponse({
        data: result,
      }),
    );
  } catch (caughtError: any) {
    console.error("[API] calculate-summary-month Fatal Error:", caughtError);
    return NextResponse.json(
      errorResponse({
        message_en: caughtError.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดในการคำนวณข้อมูลสรุปรายเดือน",
        status: 500,
        error: caughtError,
      }),
      { status: 500 },
    );
  }
}
