/**
 * Example API สำหรับทดสอบการค้นหา API Logs
 * POST /api/v1/logger/search-example
 * ตัวอย่างการใช้งาน API Log Search ด้วย POST method
 */

import { NextRequest, NextResponse } from "next/server";
import { apiLogClient, API_LOG_CONSTANTS } from "@/lib/api-log";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    //** การทำงาน: ดึง request body */
    const requestBody = await request.json().catch(() => ({}));
    
    //** การทำงาน: ตัวอย่างการค้นหา logs */
    const searchFilters = {
      page: requestBody.page || 1,
      limit: requestBody.limit || 5,
      serviceName: requestBody.serviceName || "example",
      isSuccess: requestBody.isSuccess,
      method: requestBody.method,
      dateFrom: requestBody.dateFrom,
      dateTo: requestBody.dateTo,
      sortBy: requestBody.sortBy || "request_time",
      sortOrder: requestBody.sortOrder || "desc",
    };

    //** การทำงาน: เรียก search API */
    try {
      const searchResponse = await apiLogClient.search(searchFilters);
      
      return NextResponse.json({
        message: "Search example completed successfully",
        searchFilters,
        results: {
          total: searchResponse.data.data.pagination.total,
          totalPages: searchResponse.data.data.pagination.totalPages,
          currentPage: searchResponse.data.data.pagination.page,
          logs: searchResponse.data.data.logs.length,
        },
        timestamp: new Date().toISOString(),
      });
      
    } catch (searchError) {
      //** การทำงาน: หาก search API ล้มเหลว */
      return NextResponse.json({
        message: "Search API failed, but this is expected if no logs exist yet",
        searchFilters,
        error: searchError instanceof Error ? searchError.message : "Search failed",
        suggestion: "Try creating some logs first using the create API",
        timestamp: new Date().toISOString(),
      }, { status: 200 }); // ส่ง 200 เพราะเป็น demo
    }

  } catch (error) {
    //** การทำงาน: จัดการ error */
    return NextResponse.json({
      error: "Something went wrong",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * GET method สำหรับแสดงตัวอย่างการใช้งาน
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    message: "API Log Search Example",
    description: "This endpoint demonstrates how to search API logs using POST method",
    usage: {
      method: "POST",
      endpoint: "/api/v1/logger/search-example",
      exampleBody: {
        page: 1,
        limit: 10,
        serviceName: "example",
        isSuccess: true,
        method: "GET",
        dateFrom: "2025-10-20T00:00:00.000Z",
        dateTo: "2025-10-20T23:59:59.999Z",
        sortBy: "request_time",
        sortOrder: "desc",
      },
    },
    availableFilters: {
      page: "number - หน้าที่ต้องการดึง (เริ่มจาก 1)",
      limit: "number - จำนวนรายการต่อหน้า (1-100)",
      serviceName: "string - กรองตาม service name",
      isSuccess: "boolean - กรองตามสถานะความสำเร็จ",
      method: "string - กรองตาม HTTP method",
      statusCode: "number - กรองตาม status code",
      endpoint: "string - กรองตาม endpoint pattern",
      calledBy: "string - กรองตาม called_by",
      traceId: "string - กรองตาม trace_id",
      dateFrom: "string (ISO) - กรองตามช่วงเวลา (เริ่มต้น)",
      dateTo: "string (ISO) - กรองตามช่วงเวลา (สิ้นสุด)",
      isArchived: "boolean - กรองตาม archive status",
      sortBy: "string - เรียงลำดับตาม field (request_time, response_time, duration_ms, status_code)",
      sortOrder: "string - ทิศทางการเรียง (asc, desc)",
    },
    timestamp: new Date().toISOString(),
  });
}