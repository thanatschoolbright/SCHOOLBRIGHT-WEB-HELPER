import { errorResponse, successResponse } from "@/helpers/api/response";
import { API_URL } from "@/services/api-url";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ version_id: string }> },
) {
  try {
    const { version_id } = await context.params;

    const hardwareUrl = API_URL.PROD_HARDWARE_API_URL;
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
