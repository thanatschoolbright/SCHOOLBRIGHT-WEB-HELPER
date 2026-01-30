import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

/**
 * [API] ดึงข้อมูลรายชื่อพนักงานทั้งหมดจากระบบฐานข้อมูลภายใน
 * [API] Fetch all employee records from the internal database
 */
export async function GET(request: NextRequest) {
  try {
    // 1. ดึง Query Parameters (ถ้ามีในอนาคต เช่น การค้นหาหรือการแบ่งหน้า)
    // 1. Extract Query Parameters (for future use like search or pagination)
    const { searchParams } = new URL(request.url);
    const searchKeyword = searchParams.get("search") || "";

    // 2. ดึงข้อมูลผู้ใช้งานจาก Prisma โดยตรง พร้อมข้อมูลที่เกี่ยวข้อง (Relations)
    // 2. Fetch users directly from Prisma with related data
    const userRecords = await PrismaTimesheet.user.findMany({
      where: {
        is_deleted: false,
        OR: searchKeyword
          ? [
              { firstname_th: { contains: searchKeyword } },
              { lastname_th: { contains: searchKeyword } },
              { employee_code: { contains: searchKeyword } },
              { username: { contains: searchKeyword } },
            ]
          : undefined,
      },
      include: {
        position_ref: {
          select: {
            id: true,
            name_th: true,
            name_en: true,
          },
        },
        department: {
          select: {
            id: true,
            name_th: true,
            name_en: true,
          },
        },
        role: {
          select: {
            id: true,
            role_name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // 3. ส่งข้อมูลกลับในรูปแบบมาตรฐานของระบบ
    // 3. Return response in standard system format
    const responsePayload = {
      items: userRecords,
      total: userRecords.length,
    };

    return NextResponse.json(
      successResponse({
        data: responsePayload,
        status: 200,
      }),
    );
  } catch (caughtError: any) {
    console.error("[API] Get System Users Fatal Error:", caughtError);
    return NextResponse.json(
      errorResponse({
        message_en: caughtError.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งานภายในระบบ",
        status: 500,
        error: caughtError,
      }),
      { status: 500 },
    );
  }
}
