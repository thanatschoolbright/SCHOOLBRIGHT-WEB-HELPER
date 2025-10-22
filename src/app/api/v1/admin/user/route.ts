import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import { API_URL } from "@/services/api-url";

export async function GET() {
  try {
    const url = API_URL.PROD_ADMIN_JABJAI_API_URL;
    const endpoint = `${url}/v1/api/get-profile/0`;

    const data = await axios.get(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(
      successResponse({
        data: data.data,
        status: data.status,
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
