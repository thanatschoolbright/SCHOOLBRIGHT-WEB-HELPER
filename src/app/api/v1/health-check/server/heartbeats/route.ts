import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { API_URL } from "@/services/api-url";
import { sanitizeForwardHeaders } from "@services/api-header";

export async function GET(request: NextRequest) {
  const apiUrl = API_URL.PROD_HARDWARE_API_URL;
  const headers = sanitizeForwardHeaders(request);

  const endpoint = `/api/v2/heartbeats/latest`;
  const fullURL = `${apiUrl}${endpoint}`;

  console.info("FULL URL", fullURL);

  try {
    const response = await axios.get(fullURL, headers);

    return NextResponse.json(
      successResponse({
        data: response.data,
        status: response.status,
      }),
      { status: response.status }
    );
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        status: statusCode,
        error: error.response?.data || null,
      }),
      { status: statusCode }
    );
  }
}
