import { NextResponse } from "next/server";
import axios from "axios";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET() {
  const endpoint = `https://raw.githubusercontent.com/Jabjai-Corporation/meta-version/refs/heads/main/system.version.json`;
  const fullURL = `${endpoint}`;

  try {
    const response = await axios.get(fullURL);

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
