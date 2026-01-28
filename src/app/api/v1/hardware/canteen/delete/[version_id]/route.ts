import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import axios from "axios";
import { API_URL } from "@/services/api-url";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ version_id: string }> },
) {
  try {
    const { version_id } = await context.params;

    const hardwareUrl = API_URL.DEV_HARDWARE_API_URL;
    const endpoint = `${hardwareUrl}/api/v2/applications/version/delete/${version_id}`;

    if (!version_id) {
      return NextResponse.json(
        errorResponse({
          message_en: "Invalid version_id",
          message_th: "version_id ไม่ถูกต้อง",
        }),
        { status: 400 },
      );
    }

    const data = await axios.get(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(
      successResponse({
        data: data.data,
        message_en: "Successfully",
        message_th: "สำเร็จ",
      }),
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Internal Server Error",
        message_th: "เกิดข้อผิดพลาดภายในระบบ",
        error,
      }),
      { status: 500 },
    );
  }
}
