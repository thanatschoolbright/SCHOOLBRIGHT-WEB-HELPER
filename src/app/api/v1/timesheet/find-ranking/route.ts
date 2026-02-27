import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import {
  MonthlySummarySchema,
  SummaryService,
} from "@/services/timesheet/summary.service";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

const rankingValidator = MonthlySummarySchema.extend({
  user_id: z
    .union([z.string(), z.number()])
    .transform((value) => String(value)),
});

export async function POST(request: NextRequest) {
  const { data: validationData, error: validationError } =
    await validateRequest(request, rankingValidator);

  if (validationError) {
    return validationError;
  }

  try {
    const { user_id, month, year, scope } = validationData;

    // 1. ค้นหาข้อมูลผู้ใช้งานจากตาราง user ภายในเพื่อดึง admin_id (ใช้เป็นตัวเชื่อมต่อข้อมูล)
    // 1. Find user from internal user table to get admin_id as the connector
    const internalUserLookup = await PrismaTimesheet.user.findFirst({
      where: {
        OR: [
          { id: !isNaN(Number(user_id)) ? Number(user_id) : undefined },
          { admin_id: !isNaN(Number(user_id)) ? Number(user_id) : undefined },
          { employee_code: String(user_id) },
        ],
      },
      select: {
        admin_id: true,
      },
    });

    if (!internalUserLookup) {
      return NextResponse.json(
        errorResponse({
          message_en: "User not found in internal database",
          message_th: "ไม่พบข้อมูลผู้ใช้งานในระบบฐานข้อมูลภายใน",
          status: 404,
        }),
        { status: 404 },
      );
    }

    const targetAdminId = internalUserLookup.admin_id;

    // 2. ประมวลผล Ranking โดยอาศัย Service ภายใน
    const { records: rankingRecords, metadata: rankingMetadata } =
      await SummaryService.generateMonthlySummary({
        month,
        year,
        scope: scope ?? "elapsed",
      });

    // 3. ค้นหาอันดับของผู้ใช้งานรายนี้โดยใช้ admin_id เป็นตัวเชื่อม
    const foundRankingRecord = (rankingRecords || []).find(
      (record: any) => String(record.admin_id) === String(targetAdminId),
    );

    const finalRankingResult = foundRankingRecord || null;

    return NextResponse.json(
      successResponse({
        data: { record: finalRankingResult, metadata: rankingMetadata },
        status: 200,
      }),
    );
  } catch (caughtError: any) {
    console.error("[API] find-ranking Fatal Error:", caughtError);
    return NextResponse.json(
      errorResponse({
        message_en: caughtError.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดรุนแรงภายในระบบ",
        status: caughtError?.response?.status || 500,
        error: caughtError,
      }),
      { status: caughtError?.response?.status || 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    successResponse({
      data: {
        status: "online",
        message: "Ranking API is ready",
      },
      status: 200,
    }),
  );
}
