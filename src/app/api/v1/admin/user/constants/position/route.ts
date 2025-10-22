import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import axios from "axios"
import { API_URL } from "@/services/api-url";

export async function GET() {
  const url = API_URL.PROD_ADMIN_JABJAI_API_URL;
  const endpoint = `${url}/v1/api/positions`;
  const config = { headers: { "Content-Type": "application/json" } };

  try {
    const response = await axios.get(endpoint, config);
    return NextResponse.json(
      successResponse({
        data: {
          response: response?.data,
        },
        status: response.status,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        error,
      }),
      { status: 500 }
    );
  }
}
