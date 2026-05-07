import { NextRequest, NextResponse } from "next/server";
import { ApiLogService } from "@/services/backend/api-log/api-log.service";
import { ApiResponse, ApiErrorResponse } from "@/types/api-log.types";

/**
 * API Route สำหรับดึงข้อมูล API Log ตาม ID
 * GET /api/v1/logger/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;

    let logId: bigint;
    try {
      logId = BigInt(resolvedParams.id);
    } catch {
      const errorResponse: ApiErrorResponse = {
        message: "Invalid ID format",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const apiLog = await ApiLogService.getApiLogById(logId);

    if (!apiLog) {
      const errorResponse: ApiErrorResponse = {
        message: `API Log with ID ${resolvedParams.id} not found`,
        error: "Not Found",
        statusCode: 404,
        timestamp: new Date().toISOString(),
        success: false,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const successResponse: ApiResponse = {
      data: {
        ...apiLog,
        id: apiLog.id.toString(),
      },
      message: "API Log retrieved successfully",
      success: true,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorResponse: ApiErrorResponse = {
      message: "Failed to retrieve API log",
      error: errorMessage,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      success: false,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * API Route สำหรับลบ API Log ตาม ID
 * DELETE /api/v1/logger/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;

    let logId: bigint;
    try {
      logId = BigInt(resolvedParams.id);
    } catch {
      const errorResponse: ApiErrorResponse = {
        message: "Invalid ID format",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const existingLog = await ApiLogService.getApiLogById(logId);
    if (!existingLog) {
      const errorResponse: ApiErrorResponse = {
        message: `API Log with ID ${resolvedParams.id} not found`,
        error: "Not Found",
        statusCode: 404,
        timestamp: new Date().toISOString(),
        success: false,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    await ApiLogService.deleteApiLog(logId);

    const successResponse: ApiResponse = {
      data: {
        id: resolvedParams.id,
        deleted: true,
      },
      message: "API Log deleted successfully",
      success: true,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorResponse: ApiErrorResponse = {
      message: "Failed to delete API log",
      error: errorMessage,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      success: false,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
