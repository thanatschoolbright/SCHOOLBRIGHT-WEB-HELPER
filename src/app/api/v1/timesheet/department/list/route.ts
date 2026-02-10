import { errorResponse, successResponse } from "@/helpers/api/response";
import prisma from "@/helpers/prisma-timesheet";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
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
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      { status: 500 },
    );
  }
}
