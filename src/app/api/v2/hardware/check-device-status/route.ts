import { NextRequest, NextResponse } from "next/server";
import { DeviceDailyStatusService } from "@/services/backend/device-daily-status.service";
import { FindAllDeviceStatusOptions } from "@/types/device-daily-status.types";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const options: FindAllDeviceStatusOptions = {
      page: body.page,
      limit: body.limit,
      isOnline: body.isOnline,
      isLogin: body.isLogin,
      startDate: body.startDate,
      endDate: body.endDate,
      keyword: body.keyword,
    };

    const result = await DeviceDailyStatusService.findAll(options);

    return NextResponse.json(
      successResponse({
        data: result.data,
        // แก้ไขตรงนี้: เปลี่ยนจาก meta เป็น pagination และ Map field ให้ตรงกับ Helper
        pagination: {
          page: Number(result.meta.page),
          page_size: Number(result.meta.limit), // Service ใช้ limit แต่ Helper ใช้ page_size
          total: result.meta.total,
          total_pages: result.meta.totalPages,  // Service ใช้ totalPages แต่ Helper ใช้ total_pages
        },
        message_th: "ดึงข้อมูลสถานะอุปกรณ์สำเร็จ",
        message_en: "Device status retrieved successfully",
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Check Device Status Error:", error);

    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
        message_en: "Internal Server Error",
        error: error.message || error,
      }),
      { status: 500 }
    );
  }
}