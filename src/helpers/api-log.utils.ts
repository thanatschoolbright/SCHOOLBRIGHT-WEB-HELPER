import { NextRequest } from "next/server";
import { CreateApiLogRequest } from "@/types/api-log.types";

/**
 * Utility functions สำหรับจัดการ API Logging
 * ใช้สำหรับสร้างข้อมูล API Log และดึงข้อมูลจาก request/response
 */
export class ApiLogUtils {
  /**
   * การทำงาน: ดึง IP address จาก NextRequest
   * @param request NextRequest object
   * @returns string IP address ของผู้เรียก
   */
  static getClientIpAddress(request: NextRequest): string {
    // ตรวจสอบ headers ต่างๆ ที่อาจมี IP address
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = request.headers.get("x-client-ip");
    
    if (forwardedFor) {
      // x-forwarded-for อาจมีหลาย IP คั่นด้วย comma, เอาตัวแรก
      return forwardedFor.split(",")[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }
    
    if (clientIp) {
      return clientIp;
    }
    
    // fallback to unknown
    return "unknown";
  }

  /**
   * การทำงาน: ดึง User Agent จาก NextRequest
   * @param request NextRequest object
   * @returns string User Agent ของ client
   */
  static getUserAgent(request: NextRequest): string {
    return request.headers.get("user-agent") || "unknown";
  }

  /**
   * การทำงาน: สร้าง endpoint ที่ตัดพารามิเตอร์ออก
   * @param url URL เต็ม
   * @returns string endpoint ที่ตัดพารามิเตอร์ออก
   */
  static extractEndpoint(url: string): string {
    try {
      const urlObject = new URL(url);
      return urlObject.pathname;
    } catch {
      return url;
    }
  }

  /**
   * การทำงาน: สร้าง service name จาก endpoint
   * @param endpoint endpoint path
   * @returns string service name
   */
  static extractServiceName(endpoint: string): string {
    const pathSegments = endpoint.split("/").filter(Boolean);
    
    // สำหรับ pattern /api/v1/{service_name}/...
    if (pathSegments.length >= 3 && pathSegments[0] === "api" && pathSegments[1].startsWith("v")) {
      return pathSegments[2];
    }
    
    // สำหรับ pattern /api/{service_name}/...
    if (pathSegments.length >= 2 && pathSegments[0] === "api") {
      return pathSegments[1];
    }
    
    // fallback
    return "unknown";
  }

  /**
   * การทำงาน: สร้าง trace ID แบบสุ่ม
   * @returns string trace ID
   */
  static generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * การทำงาน: แปลง request body เป็น JSON object
   * @param request NextRequest object
   * @returns Promise<Record<string, any> | undefined> request body หรือ undefined
   */
  static async extractRequestBody(request: NextRequest): Promise<Record<string, any> | undefined> {
    try {
      const contentType = request.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        // Clone request เพื่อป้องกัน body ถูกใช้ไปแล้ว
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        return body;
      }
      
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const clonedRequest = request.clone();
        const formData = await clonedRequest.formData();
        const body: Record<string, any> = {};
        
        formData.forEach((value, key) => {
          body[key] = value;
        });
        
        return body;
      }
      
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * การทำงาน: แปลง headers เป็น JSON object
   * @param request NextRequest object
   * @returns Record<string, string> headers object
   */
  static extractRequestHeaders(request: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {};
    
    request.headers.forEach((value, key) => {
      // กรองเฉพาะ headers ที่สำคัญ เพื่อลดขนาดข้อมูล
      const importantHeaders = [
        "authorization",
        "content-type",
        "accept",
        "user-agent",
        "x-forwarded-for",
        "x-real-ip",
        "origin",
        "referer"
      ];
      
      if (importantHeaders.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });
    
    return headers;
  }

  /**
   * การทำงาน: สร้างข้อมูล API Log สำหรับ request
   * @param request NextRequest object
   * @param additionalData ข้อมูลเพิ่มเติม (optional)
   * @returns Promise<CreateApiLogRequest> ข้อมูล API Log
   */
  static async createLogData(
    request: NextRequest,
    additionalData?: Partial<CreateApiLogRequest>
  ): Promise<CreateApiLogRequest> {
    const url = request.url;
    const endpoint = this.extractEndpoint(url);
    const serviceName = this.extractServiceName(endpoint);
    const ipAddress = this.getClientIpAddress(request);
    const userAgent = this.getUserAgent(request);
    const requestHeaders = this.extractRequestHeaders(request);
    const requestBody = await this.extractRequestBody(request);
    const traceId = this.generateTraceId();

    return {
      requestTime: new Date(),
      method: request.method,
      url,
      endpoint,
      serviceName,
      ipAddress,
      userAgent,
      requestHeader: requestHeaders,
      requestBody,
      traceId,
      ...additionalData,
    };
  }

  /**
   * การทำงาน: อัปเดตข้อมูล API Log เมื่อมี response
   * @param logData ข้อมูล API Log เดิม
   * @param statusCode HTTP status code
   * @param responseBody response body (optional)
   * @param errorMessage error message (optional)
   * @returns CreateApiLogRequest ข้อมูล API Log ที่อัปเดตแล้ว
   */
  static updateLogDataWithResponse(
    logData: CreateApiLogRequest,
    statusCode: number,
    responseBody?: Record<string, any>,
    errorMessage?: string
  ): CreateApiLogRequest {
    const responseTime = new Date();
    const durationMs = responseTime.getTime() - logData.requestTime.getTime();
    const isSuccess = statusCode >= 200 && statusCode < 400;

    return {
      ...logData,
      responseTime,
      durationMs,
      statusCode,
      responseBody,
      errorMessage,
      isSuccess,
    };
  }

  /**
   * การทำงาน: สร้าง response body ที่ปลอดภัย (ลบข้อมูลที่อ่อนไหว)
   * @param responseBody response body ต้นฉบับ
   * @returns Record<string, any> response body ที่ปลอดภัย
   */
  static sanitizeResponseBody(responseBody: any): Record<string, any> {
    if (!responseBody || typeof responseBody !== "object") {
      return {};
    }

    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "authorization",
      "credential"
    ];

    const sanitized = JSON.parse(JSON.stringify(responseBody));

    const removeSensitiveData = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(removeSensitiveData);
      }

      if (obj && typeof obj === "object") {
        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            newObj[key] = "[REDACTED]";
          } else {
            newObj[key] = removeSensitiveData(value);
          }
        }
        return newObj;
      }

      return obj;
    };

    return removeSensitiveData(sanitized);
  }
}