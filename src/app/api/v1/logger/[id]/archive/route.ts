import { NextRequest, NextResponse } from "next/server";
import { ApiLogService } from "@/services/backend/api-log/api-log.service";
import { ApiResponse, ApiErrorResponse } from "@/types/api-log.types";

/**
 * API Route สำหรับอัปเดตสถานะ archive ของ API Log
 * PATCH /api/v1/logger/[id]/archive
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const requestBody = await request.json().catch(() => ({}));

    if (typeof requestBody.isArchived !== "boolean") {
      const errorResponse: ApiErrorResponse = {
        message: "Missing or invalid required field: isArchived (must be boolean)",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

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

    const updatedLog = await ApiLogService.updateArchiveStatus(logId, requestBody.isArchived);

    const successResponse: ApiResponse = {
      data: {
        ...updatedLog,
        id: updatedLog.id.toString(),
      },
      message: `API Log ${requestBody.isArchived ? "archived" : "unarchived"} successfully`,
      success: true,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorResponse: ApiErrorResponse = {
      message: "Failed to update archive status",
      error: errorMessage,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      success: false,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
