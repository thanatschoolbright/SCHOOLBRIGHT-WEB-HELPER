import { callWithLogging } from "@helpers/call-with-logging";
import { API_URL } from "@/services/api-url";
import { NextRequest, NextResponse } from "next/server";
import { convertToCurl } from "@helpers/api/convert-to-curl";
import { ApiLogUtils } from "@/helpers/api-log.utils";

export async function GET(request: NextRequest) {
  const startTime = new Date(); // เริ่มจับเวลา
  const apiUrl = API_URL.PROD_ADMIN_JABJAI_API_URL;
  const endpoint = "/api/school/list";
  const fullURL = `${apiUrl}${endpoint}`;
  const curlCommand = convertToCurl(apiUrl, endpoint);

  try {
    const response = await callWithLogging(
      {
        method: "GET",
        url: fullURL,
        // headers,
        // httpsAgent,
      },
      {
        requestPath: request.nextUrl.pathname,
        method: "GET",
        curl: curlCommand,
      }
    );

    const result = {
      data: response.data,
      curl: curlCommand,
    };

    // บันทึก API Log สำเร็จ
    await ApiLogUtils.logApiRequest(
      request,
      {
        status: response.status,
        body: result,
      },
      startTime
    );

    return NextResponse.json(result, { status: response.status });
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    const errorResponse = { message: error.message };

    // บันทึก API Log ผิดพลาด
    await ApiLogUtils.logApiRequest(
      request,
      {
        status: statusCode,
        body: errorResponse,
        errorMessage: error.message,
      },
      startTime
    );

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
