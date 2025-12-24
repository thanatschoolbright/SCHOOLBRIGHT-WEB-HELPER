import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/services/api-url";
import axios, { AxiosError } from "axios";
import FormData from "form-data";
import { logger } from "@/helpers/logger"; // สมมติว่า path นี้คือที่เก็บ logger config

/**
 * ฟังก์ชัน POST สำหรับจัดการการเข้าสู่ระบบ
 */
export async function POST(
  incomingRequest: NextRequest
): Promise<NextResponse> {
  const executionStartTime = performance.now();

  try {
    // 1. อ่านข้อมูลจาก Form Data ที่ส่งเข้ามา
    const incomingFormData = await incomingRequest.formData();
    const usernameInput = incomingFormData.get("username") as string | null;
    const passwordInput = incomingFormData.get("password") as string | null;

    // 2. ตรวจสอบข้อมูลนำเข้า (Validation)
    if (!usernameInput || !passwordInput) {
      logger.warn("Login attempt failed: Missing credentials", {
        username: usernameInput || "missing",
      });

      return NextResponse.json(
        {
          success: false,
          message: "Username และ Password ต้องไม่เป็นค่าว่าง",
        },
        { status: 400 }
      );
    }

    // 3. เตรียมข้อมูลสำหรับส่งไปยัง API ภายนอก
    const authenticationServiceUrl = `${API_URL.PROD_ADMIN_JABJAI_API_URL}/api/v2/auth/login`;

    // ใช้ FormData จาก package 'form-data' สำหรับ Server-to-Server request
    const authenticationPayload = new FormData();
    authenticationPayload.append("username", usernameInput);
    authenticationPayload.append("password", passwordInput);

    logger.info(`Dispatching login request to external service`, {
      url: authenticationServiceUrl,
      username: usernameInput,
    });

    // 4. เรียก API ภายนอก (External Service Call)
    const externalApiResponse = await axios.post(
      authenticationServiceUrl,
      authenticationPayload,
      {
        headers: authenticationPayload.getHeaders(),
        timeout: 10000, // 10 วินาที
      }
    );

    logger.info("External service authentication successful", {
      username: usernameInput,
    });

    // 5. คำนวณเวลาการทำงาน (Execution Time Calculation)
    const executionEndTime = performance.now();
    const executionDurationInMilliseconds = Number(
      (executionEndTime - executionStartTime).toFixed(2)
    );

    // 6. ส่งผลลัพธ์กลับไปยัง Client
    return NextResponse.json({
      success: externalApiResponse.data.success,
      token: externalApiResponse.data.token,
      user_data: externalApiResponse.data.user_data,
      response_time: executionDurationInMilliseconds,
    });
  } catch (error: unknown) {
    const executionEndTime = performance.now();
    const executionDurationInMilliseconds = Number(
      (executionEndTime - executionStartTime).toFixed(2)
    );

    // กรณีเกิดข้อผิดพลาดจาก Axios (API ภายนอก)
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const errorMessage =
        axiosError.response?.data?.message || "เกิดข้อผิดพลาดจาก API ภายนอก";
      const statusCode = axiosError.response?.status || 502;

      logger.error("External service authentication failed", {
        message: errorMessage,
        status: statusCode,
        duration: executionDurationInMilliseconds,
        originalError: axiosError.message,
      });

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          status: statusCode,
          response_time: executionDurationInMilliseconds,
        },
        { status: statusCode }
      );
    }

    // กรณีข้อผิดพลาดภายใน Server (General Error)
    const genericError = error as Error;
    logger.error("Internal Server Error during login process", {
      message: genericError.message,
      stack: genericError.stack,
      duration: executionDurationInMilliseconds,
    });

    return NextResponse.json(
      {
        success: false,
        message: genericError.message || "Internal Server Error",
        status: 500,
        response_time: executionDurationInMilliseconds,
      },
      { status: 500 }
    );
  }
}
