import { API_URL } from "@/services/api-url";
import { convertToCurl } from "@helpers/api/convert-to-curl";
import { callWithLogging } from "@helpers/call-with-logging";
import { NextRequest, NextResponse } from "next/server";

// --- High Performance Cache Implementation ---
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cachedData: any = null;
let lastFetchTime = 0;

export async function GET(request: NextRequest) {
  const now = Date.now();

  // ตรวจสอบ Cache ก่อน
  if (cachedData && now - lastFetchTime < CACHE_TTL) {
    console.info("[CACHE] Returning cached school list detail");
    return NextResponse.json(cachedData, { status: 200 });
  }

  const apiUrl = API_URL.PROD_ADMIN_JABJAI_API_URL;
  const endpoint = "/api/school/list";
  const fullURL = `${apiUrl}${endpoint}`;
  const curlCommand = convertToCurl(apiUrl, endpoint);

  try {
    const response = await callWithLogging(
      {
        method: "GET",
        url: fullURL,
      },
      {
        requestPath: request.nextUrl.pathname,
        method: "GET",
        curl: curlCommand,
      },
    );

    const result = {
      data: response.data,
      curl: curlCommand,
    };

    // อัปเดต Cache
    cachedData = result;
    lastFetchTime = now;

    return NextResponse.json(result, { status: response.status });
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    const errorResponse = { message: error.message };
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
