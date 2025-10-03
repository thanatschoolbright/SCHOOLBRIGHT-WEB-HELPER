import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/services/api-url";
import axios from "axios";
import { convertToCurl } from "@helpers/api/convert-to-curl";

export async function POST(request: NextRequest) {
  const apiUrl = API_URL.DEV_HARDWARE_API_URL;
  const endpoint = "/api/v2/applications/version";
  const fullURL = `${apiUrl}${endpoint}`;
  const curlCommand = convertToCurl(apiUrl, endpoint);

  try {
    const contentType = request.headers.get("content-type") || "";
    let data: any;
    let headers: Record<string, string> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      data = formData;
      headers = {};
    } else if (contentType.includes("application/json")) {
      data = await request.json();
      headers = { "Content-Type": "application/json" };
    } else {
      data = request.body;
    }

    const apiResponse = await axios({
      method: "POST",
      url: fullURL,
      data,
      headers,
    });

    return NextResponse.json(
      {
        data: apiResponse.data,
        curl: curlCommand,
      },
      { status: apiResponse.status }
    );
  } catch (error: any) {
    const statusCode = error?.response?.status || 500;
    return NextResponse.json(
      {
        message: error?.message || "Internal Server Error",
        raw: error?.response?.data || null,
      },
      { status: statusCode }
    );
  }
}
