import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import axios from "axios";
import { API_URL } from "@/services/api-url";
import { Schema } from "./route.validator";
import { validateRequest } from "@helpers/api/validate.request";

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, Schema);
  if (error) return error;

  const { username, password, name, lastname, code = "JJ00XXX" } = data;
  const url = API_URL.PROD_ADMIN_JABJAI_API_URL;
  const endpoint = `${url}/api/auth/register?username=${username}&password=${password}&name=${name}&lastname=${lastname}&code=${code}`;
  const config = { headers: { "Content-Type": "application/json" } };

  console.info("Creating user with data:", { username, name, lastname });

  try {
    const response = await axios.post(endpoint, {}, config);
    console.info("User creation response:", response.data);
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
