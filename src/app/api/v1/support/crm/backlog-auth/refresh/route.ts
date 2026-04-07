import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";
import {
  refreshAccessToken,
  upsertUserToken,
} from "../service/backlog-auth-service";

// ✨ ต่ออายุ Backlog access_token สำหรับ user ด้วย refresh_token ที่บันทึกไว้ใน DB
export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id || isNaN(Number(user_id))) {
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

    const record = await (
      PrismaTimesheet as any
    ).crmSupportAuthentication.findUnique({
      where: { user_id: Number(user_id) },
    });

    if (!record) {
      return NextResponse.json(
        {
          status_code: 404,
          message_th: "ไม่พบข้อมูล token ของ user นี้",
          message_en: "Token record not found for this user",
          data: null,
        },
        { status: 404 },
      );
    }

    // เรียก Backlog เพื่อขอ token ใหม่
    const newToken = await refreshAccessToken(record.refresh_token as string);
    await upsertUserToken(Number(user_id), newToken);

    return NextResponse.json({
      status_code: 200,
      message_th: "ต่ออายุ token สำเร็จ",
      message_en: "Token refreshed successfully",
      data: { user_id: Number(user_id), connected: true },
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/support/crm/backlog-auth/refresh error:", err);
    return NextResponse.json(
      {
        status_code: 500,
        message_th: "ต่ออายุ token ไม่สำเร็จ",
        message_en: "Failed to refresh Backlog token",
        data: null,
      },
      { status: 500 },
    );
  }
}
