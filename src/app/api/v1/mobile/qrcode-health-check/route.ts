import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/services/api-url";
import { callWithLogging } from "@helpers/call-with-logging";
import { convertToCurl } from "@helpers/api/convert-to-curl";
import { RequestQRCodeGenerator } from "@stores/type";

export async function POST(request: NextRequest) {
  // const apiUrl = API_URL.PROD_PAYMENT_API_URL;
  const payload: RequestQRCodeGenerator["draftValues"] = await request.json();
  const apiUrlUAT = API_URL.DEV_PAYMENT_GATEWAY_API_URL;
  const endpoint = `/v1/health-check/qr-code-generator/`;
  const fullURL = `${apiUrlUAT}${endpoint}`;
  const curlCommand = convertToCurl(apiUrlUAT, endpoint);

  try {
    const response = await callWithLogging(
      {
        method: "POST",
        url: fullURL,
        data: {
          amount: payload.amount,
          school_id: payload.school_id,
          shop_id: payload.shop_id,
        },
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
