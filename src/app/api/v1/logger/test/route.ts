/**
 * Test API สำหรับทดสอบ API Logging System
 * GET /api/v1/logger/test
 */

import { NextRequest, NextResponse } from "next/server";
import { quickLog, API_LOG_CONSTANTS } from "@/lib/api-log";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const startTime = Date.now();
    
    // จำลองการทำงาน
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const durationMs = Date.now() - startTime;
    
    // บันทึก log
    await quickLog.success({
      method: API_LOG_CONSTANTS.METHODS.GET,
      url: request.url,
      statusCode: API_LOG_CONSTANTS.STATUS.OK,
      serviceName: API_LOG_CONSTANTS.SERVICES.LOGGER,
      calledBy: "test",
      durationMs,
    });

    return NextResponse.json({
      message: "API Logging System is working!",
      timestamp: new Date().toISOString(),
      durationMs,
    });

  } catch (error) {
    // บันทึก error log
    await quickLog.error({
      method: API_LOG_CONSTANTS.METHODS.GET,
      url: request.url,
      statusCode: API_LOG_CONSTANTS.STATUS.INTERNAL_ERROR,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      serviceName: API_LOG_CONSTANTS.SERVICES.LOGGER,
      calledBy: "test",
    });

    return NextResponse.json({
      error: "Something went wrong",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}