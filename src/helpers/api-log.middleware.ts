import { NextRequest, NextResponse } from "next/server";
import { ApiLogService } from "@/services/backend/api-log/api-log.service";
import { ApiLogUtils } from "@/helpers/api-log.utils";

/**
 * Middleware Helper สำหรับ Auto Logging API Requests
 * ใช้สำหรับบันทึก API Log โดยอัตโนมัติสำหรับทุก API route
 */
export class ApiLogMiddleware {
  
  /**
   * การทำงาน: Wrapper function สำหรับ API route ที่ต้องการ auto logging
   * @param handler API route handler function
   * @param options การตั้งค่าเพิ่มเติม
   * @returns wrapped handler function
   */
  static withLogging<T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
    options?: {
      /** ไม่บันทึก request body (สำหรับ API ที่มีข้อมูลอ่อนไหว) */
      excludeRequestBody?: boolean;
      /** ไม่บันทึก response body (สำหรับ API ที่ return ข้อมูลเยอะ) */
      excludeResponseBody?: boolean;
      /** กำหนด service name แทนการ extract อัตโนมัติ */
      serviceName?: string;
      /** กำหนด called_by */
      calledBy?: string;
    }
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const startTime = new Date();
      let logData;
      let response: NextResponse;

      try {
        //** การทำงาน: สร้าง log data พื้นฐาน */
        logData = await ApiLogUtils.createLogData(request, {
          serviceName: options?.serviceName,
          calledBy: options?.calledBy,
        });

        // ลบ request body ถ้าตั้งค่าให้ exclude
        if (options?.excludeRequestBody) {
          logData.requestBody = undefined;
        }

        //** การทำงาน: เรียก API handler */
        response = await handler(request, ...args);

        //** การทำงาน: ดึงข้อมูล response */
        let responseBody: any = undefined;
        
        if (!options?.excludeResponseBody) {
          try {
            // Clone response เพื่ออ่าน body โดยไม่ทำลาย original response
            const responseClone = response.clone();
            const responseText = await responseClone.text();
            
            if (responseText) {
              try {
                responseBody = JSON.parse(responseText);
                responseBody = ApiLogUtils.sanitizeResponseBody(responseBody);
              } catch {
                // ถ้าไม่ใช่ JSON ก็เก็บเป็น text
                responseBody = { content: responseText.substring(0, 1000) }; // จำกัดขนาด
              }
            }
          } catch (error) {
            console.warn("Failed to extract response body for logging:", error);
          }
        }

        //** การทำงาน: อัปเดต log data ด้วยข้อมูล response */
        const finalLogData = ApiLogUtils.updateLogDataWithResponse(
          logData,
          response.status,
          responseBody
        );

        //** การทำงาน: บันทึก log แบบ async (ไม่บล็อค response) */
        ApiLogService.createApiLog(finalLogData).catch((error) => {
          console.error("Failed to create API log:", error);
        });

        return response;

      } catch (error) {
        //** การทำงาน: จัดการ error */
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        
        if (logData) {
          const errorLogData = ApiLogUtils.updateLogDataWithResponse(
            logData,
            500,
            { error: "Internal Server Error" },
            errorMessage
          );

          // บันทึก error log
          ApiLogService.createApiLog(errorLogData).catch((logError) => {
            console.error("Failed to create error log:", logError);
          });
        }

        // Re-throw error เพื่อให้ API handler จัดการต่อ
        throw error;
      }
    };
  }

  /**
   * การทำงาน: สร้าง simple logging middleware สำหรับ API routes
   * @param request NextRequest object
   * @param response NextResponse object  
   * @param options การตั้งค่าเพิ่มเติม
   */
  static async logApiCall(
    request: NextRequest,
    response: NextResponse,
    options?: {
      serviceName?: string;
      calledBy?: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    try {
      //** การทำงาน: สร้าง log data */
      const logData = await ApiLogUtils.createLogData(request, {
        serviceName: options?.serviceName,
        calledBy: options?.calledBy,
      });

      //** การทำงาน: ดึงข้อมูล response body */
      let responseBody: any = undefined;
      
      try {
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        
        if (responseText) {
          try {
            responseBody = JSON.parse(responseText);
            responseBody = ApiLogUtils.sanitizeResponseBody(responseBody);
          } catch {
            responseBody = { content: responseText.substring(0, 1000) };
          }
        }
      } catch (error) {
        console.warn("Failed to extract response body for logging:", error);
      }

      //** การทำงาน: อัปเดต log data ด้วยข้อมูล response */
      const finalLogData = ApiLogUtils.updateLogDataWithResponse(
        logData,
        response.status,
        responseBody,
        options?.errorMessage
      );

      //** การทำงาน: บันทึก log */
      await ApiLogService.createApiLog(finalLogData);

    } catch (error) {
      console.error("Failed to log API call:", error);
    }
  }

  /**
   * การทำงาน: บันทึก error log เมื่อเกิดข้อผิดพลาด
   * @param request NextRequest object
   * @param error Error object
   * @param options การตั้งค่าเพิ่มเติม
   */
  static async logError(
    request: NextRequest,
    error: Error,
    options?: {
      statusCode?: number;
      serviceName?: string;
      calledBy?: string;
    }
  ): Promise<void> {
    try {
      //** การทำงาน: สร้าง log data */
      const logData = await ApiLogUtils.createLogData(request, {
        serviceName: options?.serviceName,
        calledBy: options?.calledBy,
      });

      //** การทำงาน: อัปเดต log data ด้วยข้อมูล error */
      const errorLogData = ApiLogUtils.updateLogDataWithResponse(
        logData,
        options?.statusCode || 500,
        { error: "Internal Server Error" },
        error.message
      );

      //** การทำงาน: บันทึก error log */
      await ApiLogService.createApiLog(errorLogData);

    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
  }

  /**
   * การทำงาน: สร้าง custom log entry
   * @param customData ข้อมูล log ที่กำหนดเอง
   */
  static async createCustomLog(customData: {
    method: string;
    url: string;
    statusCode: number;
    serviceName?: string;
    calledBy?: string;
    requestBody?: any;
    responseBody?: any;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
    traceId?: string;
  }): Promise<void> {
    try {
      const logData = {
        requestTime: new Date(),
        responseTime: new Date(),
        durationMs: 0,
        method: customData.method,
        statusCode: customData.statusCode,
        url: customData.url,
        endpoint: ApiLogUtils.extractEndpoint(customData.url),
        serviceName: customData.serviceName || ApiLogUtils.extractServiceName(ApiLogUtils.extractEndpoint(customData.url)),
        requestBody: customData.requestBody,
        responseBody: customData.responseBody ? ApiLogUtils.sanitizeResponseBody(customData.responseBody) : undefined,
        ipAddress: customData.ipAddress || "unknown",
        userAgent: customData.userAgent || "unknown",
        calledBy: customData.calledBy,
        traceId: customData.traceId || ApiLogUtils.generateTraceId(),
        errorMessage: customData.errorMessage,
        isSuccess: customData.statusCode >= 200 && customData.statusCode < 400,
        isArchived: false,
      };

      //** การทำงาน: บันทึก custom log */
      await ApiLogService.createApiLog(logData);

    } catch (error) {
      console.error("Failed to create custom log:", error);
    }
  }
}

//** Export ตัวย่อสำหรับใช้งานง่าย */
export const logApiCall = ApiLogMiddleware.logApiCall;
export const logError = ApiLogMiddleware.logError;
export const createCustomLog = ApiLogMiddleware.createCustomLog;
export const withLogging = ApiLogMiddleware.withLogging;