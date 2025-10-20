import { NextRequest, NextResponse } from "next/server";
import { ApiLogService } from "@/services/backend/api-log/api-log.service";
import { ApiLogUtils } from "@/helpers/api-log.utils";
import { ApiResponse, ApiErrorResponse } from "@/types/api-log.types";

/**
 * API Route สำหรับอัปเดตสถานะ archive ของ API Log
 * PATCH /api/v1/logger/[id]/archive
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  let logData;

  try {
    //** การทำงาน: ดึงข้อมูลจาก request และสร้าง log data พื้นฐาน */
    logData = await ApiLogUtils.createLogData(request);

    //** การทำงาน: ดึง request body */
    const requestBody = await request.json().catch(() => ({}));
    
    //** การทำงาน: ตรวจสอบข้อมูลที่จำเป็น */
    if (typeof requestBody.isArchived !== "boolean") {
      const errorResponse: ApiErrorResponse = {
        message: "Missing or invalid required field: isArchived (must be boolean)",
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
        "Missing or invalid required field: isArchived"
      );
      
      await ApiLogService.createApiLog(errorLogData);

      return NextResponse.json(errorResponse, { status: 400 });
    }

    //** การทำงาน: ตรวจสอบและแปลง ID */
    const logId = BigInt(params.id);
    
    //** การทำงาน: ตรวจสอบว่า API Log มีอยู่หรือไม่ */
    const existingLog = await ApiLogService.getApiLogById(logId);
    if (!existingLog) {
      const errorResponse: ApiErrorResponse = {
        message: `API Log with ID ${params.id} not found`,
        error: "Not Found",
        statusCode: 404,
        timestamp: new Date().toISOString(),
        success: false,
      };

      //** การทำงาน: บันทึก log สำหรับ error */
      const errorLogData = ApiLogUtils.updateLogDataWithResponse(
        logData,
        404,
        ApiLogUtils.sanitizeResponseBody(errorResponse),
        `API Log with ID ${params.id} not found`
      );
      
      await ApiLogService.createApiLog(errorLogData);

      return NextResponse.json(errorResponse, { status: 404 });
    }

    //** การทำงาน: อัปเดตสถานะ archive */
    const updatedLog = await ApiLogService.updateArchiveStatus(logId, requestBody.isArchived);

    //** การทำงาน: สร้าง response ที่สำเร็จ */
    const successResponse: ApiResponse = {
      data: {
        ...updatedLog,
        id: updatedLog.id.toString(), // แปลง BigInt เป็น string สำหรับ JSON
      },
      message: `API Log ${requestBody.isArchived ? "archived" : "unarchived"} successfully`,
      success: true,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };

    //** การทำงาน: บันทึก log สำหรับ API route นี้เอง */
    const successLogData = ApiLogUtils.updateLogDataWithResponse(
      logData,
      200,
      ApiLogUtils.sanitizeResponseBody(successResponse)
    );
    
    // ไม่ต้องรอให้เสร็จ เพื่อไม่ให้เกิด infinite loop
    ApiLogService.createApiLog(successLogData).catch(console.error);

    return NextResponse.json(successResponse, { status: 200 });
    
  } catch (error) {
    //** การทำงาน: จัดการ error และสร้าง error response */
    let errorMessage = "Unknown error occurred";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      // ตรวจสอบว่าเป็น BigInt conversion error หรือไม่
      if (error.message.includes("Cannot convert") || error.message.includes("invalid BigInt")) {
        errorMessage = "Invalid ID format";
        statusCode = 400;
      }
    }
    
    const errorResponse: ApiErrorResponse = {
      message: "Failed to update archive status",
      error: errorMessage,
      statusCode,
      timestamp: new Date().toISOString(),
      success: false,
    };

    //** การทำงาน: บันทึก error log ถ้า logData มีอยู่ */
    if (logData) {
      const errorLogData = ApiLogUtils.updateLogDataWithResponse(
        logData,
        statusCode,
        ApiLogUtils.sanitizeResponseBody(errorResponse),
        errorMessage
      );
      
      // พยายามบันทึก error log
      ApiLogService.createApiLog(errorLogData).catch(console.error);
    }

    console.error("API Log archive update error:", error);
    
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}