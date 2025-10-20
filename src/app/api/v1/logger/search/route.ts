import { NextRequest, NextResponse } from "next/server";
import { ApiLogService } from "@/services/backend/api-log/api-log.service";
import { ApiLogUtils } from "@/helpers/api-log.utils";
import { ApiResponse, ApiErrorResponse, GetApiLogsRequest } from "@/types/api-log.types";

/**
 * API Route สำหรับดึงข้อมูล API Logs ด้วย POST method
 * POST /api/v1/logger/search
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = new Date();
  let logData;

  try {
    //** การทำงาน: ดึงข้อมูลจาก request และสร้าง log data พื้นฐาน */
    logData = await ApiLogUtils.createLogData(request);

    //** การทำงาน: ดึง request body */
    const requestBody: GetApiLogsRequest = await request.json().catch(() => ({}));
    
    //** การทำงาน: ตั้งค่า default values และตรวจสอบ */
    const filters: GetApiLogsRequest = {
      page: requestBody.page || 1,
      limit: requestBody.limit || 10,
      serviceName: requestBody.serviceName,
      isSuccess: requestBody.isSuccess,
      method: requestBody.method,
      statusCode: requestBody.statusCode,
      endpoint: requestBody.endpoint,
      calledBy: requestBody.calledBy,
      traceId: requestBody.traceId,
      dateFrom: requestBody.dateFrom ? new Date(requestBody.dateFrom) : undefined,
      dateTo: requestBody.dateTo ? new Date(requestBody.dateTo) : undefined,
      isArchived: requestBody.isArchived,
      sortBy: requestBody.sortBy || 'request_time',
      sortOrder: requestBody.sortOrder || 'desc',
    };

    //** การทำงาน: ตรวจสอบ pagination parameters */
    if (filters.page! < 1 || filters.limit! < 1 || filters.limit! > 100) {
      const errorResponse: ApiErrorResponse = {
        message: "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };

      //** การทำงาน: บันทึก log สำหรับ error */
      const errorLogData = ApiLogUtils.updateLogDataWithResponse(
        logData,
        400,
        ApiLogUtils.sanitizeResponseBody(errorResponse),
        "Invalid pagination parameters"
      );
      
      await ApiLogService.createApiLog(errorLogData);

      return NextResponse.json(errorResponse, { status: 400 });
    }

    //** การทำงาน: ตรวจสอบ sortBy field */
    const validSortFields = ['request_time', 'response_time', 'duration_ms', 'status_code'];
    if (filters.sortBy && !validSortFields.includes(filters.sortBy)) {
      const errorResponse: ApiErrorResponse = {
        message: `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}`,
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };

      //** การทำงาน: บันทึก log สำหรับ error */
      const errorLogData = ApiLogUtils.updateLogDataWithResponse(
        logData,
        400,
        ApiLogUtils.sanitizeResponseBody(errorResponse),
        "Invalid sortBy field"
      );
      
      await ApiLogService.createApiLog(errorLogData);

      return NextResponse.json(errorResponse, { status: 400 });
    }

    //** การทำงาน: ตรวจสอบ sortOrder */
    if (filters.sortOrder && !['asc', 'desc'].includes(filters.sortOrder)) {
      const errorResponse: ApiErrorResponse = {
        message: "Invalid sortOrder. Must be 'asc' or 'desc'",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };

      //** การทำงาน: บันทึก log สำหรับ error */
      const errorLogData = ApiLogUtils.updateLogDataWithResponse(
        logData,
        400,
        ApiLogUtils.sanitizeResponseBody(errorResponse),
        "Invalid sortOrder"
      );
      
      await ApiLogService.createApiLog(errorLogData);

      return NextResponse.json(errorResponse, { status: 400 });
    }

    //** การทำงาน: ตรวจสอบช่วงวันที่ */
    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      const errorResponse: ApiErrorResponse = {
        message: "dateFrom must be before or equal to dateTo",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };

      //** การทำงาน: บันทึก log สำหรับ error */
      const errorLogData = ApiLogUtils.updateLogDataWithResponse(
        logData,
        400,
        ApiLogUtils.sanitizeResponseBody(errorResponse),
        "Invalid date range"
      );
      
      await ApiLogService.createApiLog(errorLogData);

      return NextResponse.json(errorResponse, { status: 400 });
    }

    //** การทำงาน: ดึงข้อมูล API Logs จากฐานข้อมูล */
    const result = await ApiLogService.getApiLogs(filters);

    //** การทำงาน: แปลง BigInt เป็น string สำหรับ JSON */
    const processedData = result.data.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));

    //** การทำงาน: สร้าง response ที่สำเร็จ */
    const successResponse: ApiResponse = {
      data: {
        logs: processedData,
        pagination: {
          page: filters.page!,
          limit: filters.limit!,
          total: result.total,
          totalPages: Math.ceil(result.total / filters.limit!),
        },
        filters: {
          serviceName: filters.serviceName,
          isSuccess: filters.isSuccess,
          method: filters.method,
          statusCode: filters.statusCode,
          endpoint: filters.endpoint,
          calledBy: filters.calledBy,
          traceId: filters.traceId,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          isArchived: filters.isArchived,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        },
      },
      message: "API Logs retrieved successfully",
      success: true,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };

    //** การทำงาน: บันทึก log สำหรับ API route นี้เอง */
    const successLogData = ApiLogUtils.updateLogDataWithResponse(
      logData,
      200,
      ApiLogUtils.sanitizeResponseBody({
        ...successResponse,
        data: { 
          message: "Response data truncated for logging",
          totalLogs: result.total,
          filters: filters
        }
      })
    );
    
    // ไม่ต้องรอให้เสร็จ เพื่อไม่ให้เกิด infinite loop
    ApiLogService.createApiLog(successLogData).catch(console.error);

    return NextResponse.json(successResponse, { status: 200 });
    
  } catch (error) {
    //** การทำงาน: จัดการ error และสร้าง error response */
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    const errorResponse: ApiErrorResponse = {
      message: "Failed to retrieve API logs",
      error: errorMessage,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      success: false,
    };

    //** การทำงาน: บันทึก error log ถ้า logData มีอยู่ */
    if (logData) {
      const errorLogData = ApiLogUtils.updateLogDataWithResponse(
        logData,
        500,
        ApiLogUtils.sanitizeResponseBody(errorResponse),
        errorMessage
      );
      
      // พยายามบันทึก error log
      ApiLogService.createApiLog(errorLogData).catch(console.error);
    }

    console.error("API Log search error:", error);
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}