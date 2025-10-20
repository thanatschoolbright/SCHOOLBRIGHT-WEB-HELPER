import { NextRequest, NextResponse } from "next/server";
import { withLogging } from "@/helpers/api-log.middleware";
import { ApiResponse, ApiErrorResponse } from "@/types/api-log.types";

/**
 * Example API Route ที่ใช้ Auto Logging Middleware
 * GET /api/v1/logger/example
 * ตัวอย่างการใช้งาน API Logging System
 */
async function handleGet(request: NextRequest): Promise<NextResponse> {
  try {
    //** การทำงาน: ดึง query parameters */
    const { searchParams } = new URL(request.url);
    const message = searchParams.get("message") || "Hello from logged API!";
    const shouldError = searchParams.get("error") === "true";

    //** การทำงาน: จำลองการเกิด error */
    if (shouldError) {
      throw new Error("This is a simulated error for testing logging");
    }

    //** การทำงาน: จำลองการประมวลผล */
    await new Promise(resolve => setTimeout(resolve, 100));

    //** การทำงาน: สร้าง response ที่สำเร็จ */
    const successResponse: ApiResponse = {
      data: {
        message,
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
      },
      message: "Example API called successfully",
      success: true,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(successResponse, { status: 200 });
    
  } catch (error) {
    //** การทำงาน: จัดการ error */
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    const errorResponse: ApiErrorResponse = {
      message: "Example API failed",
      error: errorMessage,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      success: false,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST /api/v1/logger/example
 * ตัวอย่างการใช้งาน API Logging System สำหรับ POST request
 */
async function handlePost(request: NextRequest): Promise<NextResponse> {
  try {
    //** การทำงาน: ดึง request body */
    const requestBody = await request.json().catch(() => ({}));
    
    //** การทำงาน: ตรวจสอบข้อมูลที่จำเป็น */
    if (!requestBody.name) {
      const errorResponse: ApiErrorResponse = {
        message: "Missing required field: name",
        error: "Validation Error",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        success: false,
      };

      return NextResponse.json(errorResponse, { status: 400 });
    }

    //** การทำงาน: จำลองการบันทึกข้อมูล */
    await new Promise(resolve => setTimeout(resolve, 200));

    //** การทำงาน: สร้าง response ที่สำเร็จ */
    const successResponse: ApiResponse = {
      data: {
        id: Math.floor(Math.random() * 1000) + 1,
        name: requestBody.name,
        description: requestBody.description || "No description provided",
        createdAt: new Date().toISOString(),
      },
      message: "Data created successfully",
      success: true,
      statusCode: 201,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(successResponse, { status: 201 });
    
  } catch (error) {
    //** การทำงาน: จัดการ error */
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    const errorResponse: ApiErrorResponse = {
      message: "Failed to create data",
      error: errorMessage,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      success: false,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

//** การทำงาน: Export handlers พร้อมกับ auto logging middleware */
export const GET = withLogging(handleGet, {
  serviceName: "example",
  calledBy: "api-test",
});

export const POST = withLogging(handlePost, {
  serviceName: "example", 
  calledBy: "api-test",
  excludeRequestBody: false, // บันทึก request body
  excludeResponseBody: false, // บันทึก response body
});