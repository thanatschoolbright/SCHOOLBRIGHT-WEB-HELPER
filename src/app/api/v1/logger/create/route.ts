import { NextRequest, NextResponse } from "next/server";
import { ApiLogService } from "@/services/backend/api-log/api-log.service";
import { ApiLogUtils } from "@/helpers/api-log.utils";
import { ApiResponse, ApiErrorResponse } from "@/types/api-log.types";

/**
 * API Route สำหรับสร้าง API Log ใหม่
 * POST /api/v1/logger/create
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const requestBody = await request.json().catch(() => ({}));

    if (!requestBody.requestTime) {
      const errorResponse: ApiErrorResponse = {
        message: "Missing required field: requestTime",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const createLogRequest = {
      requestTime: new Date(requestBody.requestTime),
      responseTime: requestBody.responseTime ? new Date(requestBody.responseTime) : undefined,
      durationMs: requestBody.durationMs,
      method: requestBody.method,
      statusCode: requestBody.statusCode,
      url: requestBody.url,
      endpoint: requestBody.endpoint,
      serviceName: requestBody.serviceName,
      requestHeader: requestBody.requestHeader,
      requestBody: requestBody.requestBody,
      responseBody: requestBody.responseBody ? ApiLogUtils.sanitizeResponseBody(requestBody.responseBody) : undefined,
      ipAddress: requestBody.ipAddress || ApiLogUtils.getClientIpAddress(request),
      userAgent: requestBody.userAgent || ApiLogUtils.getUserAgent(request),
      calledBy: requestBody.calledBy,
      traceId: requestBody.traceId || ApiLogUtils.generateTraceId(),
      errorMessage: requestBody.errorMessage,
      isSuccess: requestBody.isSuccess ?? true,
      isArchived: requestBody.isArchived ?? false,
    };

    const createdLog = await ApiLogService.createApiLog(createLogRequest);

    const successResponse: ApiResponse = {
      data: {
        id: createdLog.id.toString(),
        requestTime: createdLog.requestTime,
        responseTime: createdLog.responseTime,
        durationMs: createdLog.durationMs,
        method: createdLog.method,
        statusCode: createdLog.statusCode,
        url: createdLog.url,
        endpoint: createdLog.endpoint,
        serviceName: createdLog.serviceName,
        ipAddress: createdLog.ipAddress,
        userAgent: createdLog.userAgent,
        calledBy: createdLog.calledBy,
        traceId: createdLog.traceId,
        errorMessage: createdLog.errorMessage,
        isSuccess: createdLog.isSuccess,
        createdAt: createdLog.createdAt,
        isArchived: createdLog.isArchived,
      },
      message: "API Log created successfully",
      success: true,
      statusCode: 201,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(successResponse, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorResponse: ApiErrorResponse = {
      message: "Failed to create API log",
      error: errorMessage,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      success: false,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * API Route สำหรับดึงข้อมูล API Logs
 * GET /api/v1/logger/create?page=1&limit=10&serviceName=timesheet&isSuccess=true
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const serviceName = searchParams.get("serviceName") || undefined;
    const isSuccessParam = searchParams.get("isSuccess");
    const isSuccess = isSuccessParam ? isSuccessParam === "true" : undefined;

    if (page < 1 || limit < 1 || limit > 100) {
      const errorResponse: ApiErrorResponse = {
        message: "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const result = await ApiLogService.getApiLogs({ page, limit, serviceName, isSuccess });

    const processedData = result.data.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));

    const successResponse: ApiResponse = {
      data: {
        logs: processedData,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      },
      message: "API Logs retrieved successfully",
      success: true,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorResponse: ApiErrorResponse = {
      message: "Failed to retrieve API logs",
      error: errorMessage,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      success: false,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
