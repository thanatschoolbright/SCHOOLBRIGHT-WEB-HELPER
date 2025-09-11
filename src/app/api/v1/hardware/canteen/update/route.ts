import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/services/api-url";
import axios from "axios";
import { convertToCurl } from "@helpers/api/convert-to-curl";

/**
 * ฟังก์ชันนี้เป็น endpoint สำหรับอัปเดตเวอร์ชันแอปพลิเคชันฮาร์ดแวร์โรงอาหาร โดยส่งข้อมูล multipart/form-data ไปยัง DEV_HARDWARE_API_URL
 */
export async function POST(request: NextRequest) {
  const apiUrl = API_URL.DEV_HARDWARE_API_URL;
  const formData = await request.formData();
  const versionId = formData.get("version_id");
  const endpoint = "/api/v2/applications/version/update/";
  const fullURL = `${apiUrl}${endpoint}${versionId}`;
  const curlCommand = convertToCurl(apiUrl, endpoint);

  try {
    const contentType = request.headers.get("content-type") || "";
    let data: any;
    let headers: Record<string, string> = {};

    if (contentType.includes("multipart/form-data")) {
      data = formData;
      headers = {};
    } else if (contentType.includes("application/json")) {
      data = await request.json();
      headers = { "Content-Type": "application/json" };
    } else {
      data = request.body;
    }

    const apiResponse = await axios.post(fullURL, data, { headers });

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
