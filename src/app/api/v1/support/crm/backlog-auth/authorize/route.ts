import { NextRequest, NextResponse } from "next/server";
import {
  BACKLOG_AUTHORIZE_URL,
  CLIENT_ID,
  REDIRECT_URI,
} from "../service/backlog-auth-service";

// ✨ สร้าง URL สำหรับเริ่มต้น Backlog OAuth โดยฝัง user_id ไว้ใน state
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
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

  if (!CLIENT_ID || !REDIRECT_URI) {
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "การตั้งค่า Backlog OAuth ไม่ครบถ้วน",
        message_en: "Backlog OAuth config missing",
        data: null,
      },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state: userId,
  });

  const authorizeUrl = `${BACKLOG_AUTHORIZE_URL}?${params.toString()}`;

  return NextResponse.json({
    status_code: 200,
    message_th: "สร้าง URL สำหรับ Authorize สำเร็จ",
    message_en: "Authorization URL generated",
    data: { authorize_url: authorizeUrl },
  });
}
