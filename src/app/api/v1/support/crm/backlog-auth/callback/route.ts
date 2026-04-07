import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  upsertUserToken,
} from "../service/backlog-auth-service";

// ✨ รับ code และ state (user_id) จาก Backlog OAuth Callback แล้วบันทึก token ลง DB
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // state = user_id ที่ส่งไปตอน authorize

  if (!code || !state) {
    return NextResponse.json(
      {
        status_code: 400,
        message_th: "ไม่พบ code หรือ state",
        message_en: "Missing code or state",
        data: null,
      },
      { status: 400 },
    );
  }

  const userId = parseInt(state, 10);
  if (isNaN(userId)) {
    return NextResponse.json(
      {
        status_code: 400,
        message_th: "state ไม่ใช่ user_id ที่ถูกต้อง",
        message_en: "Invalid state (user_id)",
        data: null,
      },
      { status: 400 },
    );
  }

  try {
    // แลก code → access_token + refresh_token
    const tokenData = await exchangeCodeForToken(code);

    // บันทึกหรืออัปเดต token ของ user ลง DB
    await upsertUserToken(userId, tokenData);

    return NextResponse.json({
      status_code: 200,
      message_th: "เชื่อมต่อ Backlog สำเร็จ",
      message_en: "Backlog connected successfully",
      data: { user_id: userId, connected: true },
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/support/crm/backlog-auth/callback error:", err);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "เชื่อมต่อ Backlog ไม่สำเร็จ",
        message_en: "Failed to exchange Backlog token",
        data: null,
      },
      { status: 500 },
    );
  }
}
