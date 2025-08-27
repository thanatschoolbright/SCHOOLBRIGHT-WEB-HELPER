import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/services/api-url";
import { callWithLogging } from "@helpers/call-with-logging";
import { convertToCurl } from "@helpers/api/convert-to-curl";
import { RequestStatistic } from "@stores/type";

export async function POST(request: NextRequest) {
  const apiUrl = API_URL.PROD_SB_API_URL;
  const payload: RequestStatistic["draftValues"] = await request.json();
  const endpoint = `/api/come2school?userid=${payload.user_id}&dstart=${payload.start_date}&dend=${payload.end_date}&status=&schoolid=${payload.school_id}`;
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
        method: "POST",
        curl: curlCommand,
      }
    );

    return NextResponse.json(
      {
        data: response.data,
        curl: curlCommand,
      },
      { status: response.status }
    );
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    return NextResponse.json(
      {
        message: error.message || "Internal Server Error",
        raw: error.response?.data || null,
      },
      { status: statusCode }
    );
  }
}
