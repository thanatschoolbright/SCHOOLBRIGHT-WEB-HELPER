import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import {
  MonthlySummarySchema,
  SummaryService,
} from "@/services/timesheet/summary.service";

const validator = MonthlySummarySchema.extend({
  user_id: z.union([z.string(), z.number()]).transform((v) => String(v)),
});

export async function POST(request: NextRequest, response: NextResponse) {
  const { data, error } = await validateRequest(request, validator);
  if (error) return error;

  try {
    console.log("[API] find-ranking POST called", { path: request.nextUrl?.pathname, bodyPreview: JSON.stringify(data).slice(0,200) });
    const { user_id, month, year, scope } = data as unknown as {
      user_id: string;
      month: string;
      year: string;
      scope?: "elapsed" | "full";
    };

    const { records, metadata } = await SummaryService.generateMonthlySummary({
      month,
      year,
      scope: scope ?? "elapsed",
    });

    const found = (records || []).find(
      (r: any) => String(r.admin_id) === String(user_id)
    );

    const mappedData = found || null;

    return Response.json(
      successResponse({
        data: { record: mappedData, metadata },
        status: 200,
      })
    );
  } catch (error: any) {
    return Response.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        status: error?.response?.status || 500,
        error,
      }),
      { status: error?.response?.status || 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return Response.json(
    successResponse({ data: { ok: true }, status: 200 })
  );
}
