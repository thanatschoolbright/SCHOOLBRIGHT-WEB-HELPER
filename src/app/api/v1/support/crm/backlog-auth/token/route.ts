import { NextRequest, NextResponse } from "next/server";
import { getValidTokenForUser } from "../service/backlog-auth-service";

// ✨ ดึง valid access_token ของ user — auto-refresh ถ้า token หมดอายุ
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId || isNaN(Number(userId))) {
    return NextResponse.json(
      {
        status_code: 400,
        message_th: "กรุณาระบุ user_id",
        message_en: "user_id is required",
        data: null,
      },
      { status: 400 },
    );
  }

  try {
    const token = await getValidTokenForUser(Number(userId));

    if (!token) {
      return NextResponse.json(
        {
          status_code: 404,
          message_th: "user ยังไม่ได้เชื่อมต่อ Backlog",
          message_en: "User has not connected Backlog",
          data: null,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      status_code: 200,
      message_th: "ดึง token สำเร็จ",
      message_en: "Token retrieved successfully",
      data: { access_token: token },
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/support/crm/backlog-auth/token error:", err);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "ดึง token ไม่สำเร็จ",
        message_en: "Failed to retrieve token",
        data: null,
      },
      { status: 500 },
    );
  }
}
