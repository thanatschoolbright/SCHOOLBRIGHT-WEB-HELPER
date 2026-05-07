import { NextRequest, NextResponse } from "next/server";
import { ApiLogService } from "@/services/backend/api-log/api-log.service";
import { ApiResponse, ApiErrorResponse, GetApiLogsRequest } from "@/types/api-log.types";

/**
 * API Route สำหรับดึงข้อมูล API Logs ด้วย POST method
 * POST /api/v1/logger/search
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const requestBody: GetApiLogsRequest = await request.json().catch(() => ({}));

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
      sortBy: requestBody.sortBy || "request_time",
      sortOrder: requestBody.sortOrder || "desc",
    };

    if (filters.page! < 1 || filters.limit! < 1 || filters.limit! > 100) {
      const errorResponse: ApiErrorResponse = {
        message: "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const validSortFields = ["request_time", "response_time", "duration_ms", "status_code"];
    if (filters.sortBy && !validSortFields.includes(filters.sortBy)) {
      const errorResponse: ApiErrorResponse = {
        message: `Invalid sortBy field. Must be one of: ${validSortFields.join(", ")}`,
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (filters.sortOrder && !["asc", "desc"].includes(filters.sortOrder)) {
      const errorResponse: ApiErrorResponse = {
        message: "Invalid sortOrder. Must be 'asc' or 'desc'",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      const errorResponse: ApiErrorResponse = {
        message: "dateFrom must be before or equal to dateTo",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const result = await ApiLogService.getApiLogs(filters);

    const processedData = result.data.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));

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
