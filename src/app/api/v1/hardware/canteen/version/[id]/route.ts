import { NextResponse } from "next/server";
import { API_URL } from "@/services/api-url";
import axios from "axios";
import { convertToCurl } from "@helpers/api/convert-to-curl";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ดึงข้อมูลเวอร์ชันของ hardware canteen
  const { id } = await params;
  const apiUrl = API_URL.DEV_HARDWARE_API_URL;
  const endpoint = `/api/v2/applications/version/${id}`;
  const curlCommand = convertToCurl(apiUrl, endpoint);

  try {
    const response = await axios.get(`${apiUrl}${endpoint}`);

    return NextResponse.json(
      { data: response.data, curl: curlCommand },
      { status: response.status }
    );
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    return NextResponse.json(
      { message: error.message, raw: error.response?.data || null },
      { status: statusCode }
    );
  }
}