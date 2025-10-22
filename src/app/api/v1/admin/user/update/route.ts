import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import axios from "axios"
import { API_URL } from "@/services/api-url";
import FormData from "form-data";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();

    const id = form.get("id") as string;
    const admin_id = form.get("admin_id") as string;
    const employee_code = form.get("employee_code") as string;
    const firstname = form.get("firstname") as string;
    const lastname = form.get("lastname") as string;
    const nickname = form.get("nickname") as string;
    const position = form.get("position") as string;
    const email = form.get("email") as string;
    const backlog_email = form.get("backlog_email") as string;
    const tel = form.get("tel") as string;

    const url = API_URL.PROD_ADMIN_JABJAI_API_URL;
    const endpoint = `${url}/v1/api/profile/edit`;

    const formData = new FormData();
    formData.append("id", id);
    formData.append("admin_id", admin_id);
    formData.append("employee_code", employee_code);
    formData.append("firstname", firstname);
    formData.append("lastname", lastname);
    formData.append("nickname", nickname);
    formData.append("position", position);
    formData.append("email", email);
    formData.append("backlog_email", backlog_email);
    formData.append("tel", tel);

    const headers = {
      ...formData.getHeaders(),
    };

    const response = await axios.post(endpoint, formData, { headers });

    return NextResponse.json(
      successResponse({
        data: {
          response: response?.data,
          user_data: {
            id,
            admin_id,
            employee_code,
            firstname,
            lastname,
            nickname,
            position,
            email,
            backlog_email,
            tel,
          },
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
