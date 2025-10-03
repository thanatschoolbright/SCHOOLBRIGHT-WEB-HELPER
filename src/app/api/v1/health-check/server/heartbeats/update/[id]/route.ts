import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/sub-project/sub-project.service";
import { successResponse, errorResponse } from "@helpers/api/response";
import axios from "axios";
import { sanitizeForwardHeaders } from "@services/api-header";
import { API_URL } from "@services/api-url";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const apiUrl = `${API_URL.DEV_HARDWARE_API_URL}`;
    const endpoint = `/api/v2/heartbeats/update/${id}`;
    const fullURL = apiUrl + endpoint;
    console.info("FULL URL", fullURL);
    const payload = await request.json();

    const responseFromAPI = await axios.post(fullURL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(
      successResponse({
        data: responseFromAPI.data,
        message_en: "Succesfully!",
        message_th: "สำเร็จ",
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
