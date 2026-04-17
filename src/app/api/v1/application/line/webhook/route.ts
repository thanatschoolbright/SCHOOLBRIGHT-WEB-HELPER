import { errorResponse, successResponse } from "@/helpers/api/response";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

// ตรวจสอบ HMAC-SHA256 signature จาก LINE Platform
function verifyLineSignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const digest = hmac.digest("base64");
  return digest === signature;
}

// ส่งข้อความ reply กลับผ่าน LINE Messaging API
async function replyMessage(replyToken: string, messages: object[]): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) return;
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
}

// POST handler รับ webhook events จาก LINE Platform พร้อม signature verification
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  if (!verifyLineSignature(rawBody, signature)) {
    return NextResponse.json(
      errorResponse({
        status: 401,
        message_th: "ลายเซ็นไม่ถูกต้อง",
        message_en: "Invalid LINE signature",
      }),
      { status: 401 },
    );
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      errorResponse({
        status: 400,
        message_th: "รูปแบบข้อมูลไม่ถูกต้อง",
        message_en: "Invalid JSON body",
      }),
      { status: 400 },
    );
  }

  const events: any[] = Array.isArray(body.events) ? body.events : [];

  for (const event of events) {
    if (event.type === "message" && event.message?.type === "text") {
      const text: string = event.message.text ?? "";

      // คำสั่ง /luid — ตอบกลับ userId ของผู้ใช้
      if (text.trim() === "/luid") {
        await replyMessage(event.replyToken, [
          { type: "text", text: `LINE User ID: ${event.source?.userId ?? "ไม่พบข้อมูล"}` },
        ]);
      }
    }
  }

  return NextResponse.json(
    successResponse({
      data: { received: events.length },
      message_th: "รับ webhook events สำเร็จ",
      message_en: "Webhook events received successfully",
    }),
    { status: 200 },
  );
}

// GET handler ใช้สำหรับตรวจสอบว่า webhook endpoint ทำงานอยู่
export async function GET() {
  const channelId = process.env.LINE_CHANNEL_ID;
  if (!process.env.LINE_CHANNEL_SECRET || !channelId) {
    return NextResponse.json(
      errorResponse({
        status: 503,
        message_th: "ยังไม่ได้ตั้งค่า LINE credentials",
        message_en: "LINE credentials not configured",
      }),
      { status: 503 },
    );
  }
  return NextResponse.json(
    successResponse({
      data: { channelId, status: "active" },
      message_th: "LINE Webhook พร้อมใช้งาน",
      message_en: "LINE Webhook is active",
    }),
    { status: 200 },
  );
}
