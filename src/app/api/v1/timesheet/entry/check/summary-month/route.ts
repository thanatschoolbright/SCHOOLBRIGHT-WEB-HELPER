import {NextResponse} from "next/server";

import {errorResponse, successResponse} from "@/helpers/api/response";
import {describeAxiosError, MonthlySummarySchema, SummaryService,} from "@/services/timesheet/summary.service";

//** Endpoint หลัก: รับ month/year แล้วสรุป Rank รายเดือนของทุกคน
export async function POST(request: Request) {
    try {
        const requestBody = await request.json().catch(() => ({}));
        const validationResult = MonthlySummarySchema.safeParse(requestBody);

        if (!validationResult.success) {
            return NextResponse.json(
                errorResponse({
                    status: 400,
                    message_th: validationResult.error.issues.map(
                        (issue) => issue.message
                    ),
                    message_en: "Invalid request payload",
                    error: validationResult.error,
                }),
                {status: 400}
            );
        }

        const {records, metadata} = await SummaryService.generateMonthlySummary(
            validationResult.data
        );

        return NextResponse.json(
            successResponse({
                data: {
                    records,
                    metadata,
                },
            })
        );
    } catch (error: unknown) {
        const message = describeAxiosError(error);
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

        console.error("[Timesheet][summary-month]", errorMessage, error);

        if (message.includes("SB Helper")) {
            return NextResponse.json(
                errorResponse({
                    status: 502,
                    message_en: "Failed to fetch user directory from SB Helper",
                    message_th: "ไม่สามารถโหลดข้อมูลผู้ใช้จาก SB Helper ได้",
                    error,
                }),
                {status: 502}
            );
        }

        return NextResponse.json(
            errorResponse({
                message_en: errorMessage,
                message_th: "เกิดข้อผิดพลาด",
                error,
            })
        );
    }
}
