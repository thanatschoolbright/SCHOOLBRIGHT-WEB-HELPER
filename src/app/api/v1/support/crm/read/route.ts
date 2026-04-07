import { NextRequest, NextResponse } from "next/server";
import { getCrmList, getCrmSummary } from "../service/crm-service";
import { CrmReadQuerySchema } from "../validation/crm-schema";

// ✨ ดึงรายการเคส CRM Support พร้อม Summary Dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const parsed = CrmReadQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      return NextResponse.json(
        {
          status_code: 400,
          message_th: "พารามิเตอร์ไม่ถูกต้อง",
          message_en: "Invalid query parameters",
          data: null,
        },
        { status: 400 },
      );
    }

    const [listResult, summary] = await Promise.all([
      getCrmList(parsed.data),
      getCrmSummary(),
    ]);

    return NextResponse.json({
      status_code: 200,
      message_th: "ดึงข้อมูลสำเร็จ",
      message_en: "Fetched successfully",
      data: {
        summary,
        items: listResult.items,
        pagination: {
          page: listResult.page,
          page_size: listResult.page_size,
          total: listResult.total,
          total_pages: Math.ceil(listResult.total / listResult.page_size),
        },
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/support/crm/read error:", err);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        message_en: "Internal server error",
        data: null,
      },
      { status: 500 },
    );
  }
}
