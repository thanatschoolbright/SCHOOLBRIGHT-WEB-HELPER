import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/services/api-url";
import axios from "axios";
import { convertToCurl } from "@helpers/api/convert-to-curl";

export async function GET(request: NextRequest) {
  // ดึงข้อมูลรายการ application ของ hardware canteen
  const apiUrl = API_URL.DEV_HARDWARE_API_URL;
  const endpoint = "/api/v2/applications";
  const fullURL = `${apiUrl}${endpoint}`;
  const curlCommand = convertToCurl(apiUrl, endpoint);

  try {
    const response = await axios.get(fullURL);

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
