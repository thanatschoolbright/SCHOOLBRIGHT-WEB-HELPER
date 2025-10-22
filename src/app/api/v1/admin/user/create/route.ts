import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import { API_URL } from "@/services/api-url";
import { Schema } from "./route.validator";
import { validateRequest } from "@helpers/api/validate.request";

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, Schema);
  if (error) return error;

  const { username, password, name, lastname } = data;
  const url = API_URL.PROD_ADMIN_JABJAI_API_URL;
  const endpoint = `${url}/api/auth/register?username=${username}&password=${password}&name=${name}&lastname=${lastname}`;
  const config = { headers: { "Content-Type": "application/json" } };

  try {
    const response = await axios.post(endpoint, {}, config);
    return NextResponse.json(
      successResponse({ ...response.data, status: response.status })
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
