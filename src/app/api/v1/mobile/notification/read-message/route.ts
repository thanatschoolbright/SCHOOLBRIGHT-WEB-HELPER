import { sanitizeForwardHeaders } from "@/services/api-header";
import { API_URL } from "@services/api-url";
import axios, { AxiosError } from "axios";
import https from "https";
import { NextRequest, NextResponse } from "next/server";

// สร้าง Agent ครั้งเดียวเพื่อ Performance (ระวัง: rejectUnauthorized: false ไม่ควรใช้ใน Production จริง ถ้าเป็นไปได้ควรแก้ที่ Certificate)
const insecureHttpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function GET(incomingRequest: NextRequest) {
  const executionStartTime = performance.now();

  try {
    // 1. ดึง Query Parameters และ Headers
    const searchParams = incomingRequest.nextUrl.searchParams;
    const userId = searchParams.get("user_id");
    const messageId = searchParams.get("message_id");
    const forwardedHeaders = sanitizeForwardHeaders(incomingRequest);

    // 2. ตรวจสอบความถูกต้องของข้อมูล (Validation)
    if (!userId || !messageId) {
      return NextResponse.json(
        { message: "Missing required parameters: user_id or message_id" },
        { status: 400 },
      );
    }

    // 3. เตรียม URL ปลายทาง
    const baseUrl = API_URL.DEV_SB_API_URL;
    const targetEndpointPath = `/api/v1/internal/read-message/${userId}/${messageId}`;
    const targetServiceUrl = `${baseUrl}${targetEndpointPath}?lang=th`;

    // 4. สร้าง cURL Command สำหรับ Debugging (ตาม Code เดิม)
    const debugCurlCommand = `curl --location --header 'Content-Type: application/json' '${targetServiceUrl}'`;

    // 5. เรียก API ปลายทาง
    const apiResponse = await axios.get(targetServiceUrl, {
      headers: forwardedHeaders,
      httpsAgent: insecureHttpsAgent,
      timeout: 10000, // แนะนำให้ใส่ Timeout เสมอ
    });

    // คำนวณเวลาทำงาน
    const executionDuration = Number(
      (performance.now() - executionStartTime).toFixed(2),
    );

    // Optional: Log ความสำเร็จ
    // logger.info("Read message API success", { userId, messageId, duration: executionDuration });

    return NextResponse.json(
      {
        data: apiResponse.data,
        curl: debugCurlCommand,
      },
      {
        status: apiResponse.status,
      },
    );
  } catch (error: unknown) {
    // 6. จัดการข้อผิดพลาด (Error Handling)
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status || 502;

      return NextResponse.json(
        {
          message: axiosError.message || "External API Error",
          raw: axiosError.response?.data || null,
          curl: `Failed Request`, // หรือจะใส่ cURL ของ request ที่พังก็ได้
        },
        { status: status },
      );
    }

    // กรณี Error อื่นๆ (Code ภายในพัง)
    const genericError = error as Error;
    return NextResponse.json(
      {
        message: genericError.message || "Internal Server Error",
        raw: null,
      },
      { status: 500 },
    );
  }
}
