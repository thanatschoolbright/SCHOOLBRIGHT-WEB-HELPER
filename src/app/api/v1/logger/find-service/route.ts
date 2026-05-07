import { NextRequest, NextResponse } from "next/server";
import { ApiLogService } from "@/services/backend/api-log/api-log.service";
import { ApiErrorResponse, ApiResponse } from "@/types/api-log.types";
import dayjs from "dayjs";

/**
 * API Route สำหรับดึงรายชื่อ Service ทั้งหมดที่มีใน API Logs
 * GET /api/v1/logger/find-service
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const servicesFromDb = await ApiLogService.findAllServices();

    const services = servicesFromDb.map((service) => ({
      service_name: service.service_name,
      name: service.service_name,
    }));

    const responseData: ApiResponse<any> = {
      data: services,
      message: "ดึงรายชื่อ service สำเร็จ",
      success: true,
      statusCode: 200,
      timestamp: dayjs().format("DD/MM/YYYY HH:mm:ss"),
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    const errorResponse: ApiErrorResponse = {
      message: error?.message || "เกิดข้อผิดพลาดในการดึงรายชื่อ service",
      error: "Internal Server Error",
      statusCode: 500,
      timestamp: dayjs().format("DD/MM/YYYY HH:mm:ss"),
      success: false,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
