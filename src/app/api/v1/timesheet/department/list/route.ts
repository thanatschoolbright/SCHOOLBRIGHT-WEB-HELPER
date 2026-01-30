import { NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export async function GET() {
  try {
    const departments = await PrismaTimesheet.department.findMany({
      where: {
        is_deleted: false,
        is_active: true,
      },
      orderBy: {
        name_th: "asc",
      },
      select: {
        id: true,
        name_th: true,
        name_en: true,
      },
    });

    return NextResponse.json(
      successResponse({
        data: departments,
      }),
    );
  } catch (error: any) {
    console.error("[Department][list]", error);
    return NextResponse.json(
      errorResponse({
        message_en: error.message,
        message_th: "ไม่สามารถดึงข้อมูลแผนกได้",
        error,
      }),
      { status: 500 },
    );
  }
}
