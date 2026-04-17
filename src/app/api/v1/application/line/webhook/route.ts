import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
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

// บันทึกหรืออัพเดท LINE Group ใน DB เมื่อ Bot พบกลุ่มใหม่
async function upsertLineGroup(groupId: string): Promise<void> {
  try {
    await PrismaTimesheet.lineGroup.upsert({
      where: { group_id: groupId },
      create: { group_id: groupId },
      update: { updated_at: new Date() },
    });
  } catch {
    // ไม่ให้ error จาก DB ทำให้ webhook response ล้มเหลว
  }
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
    const sourceType: string = event.source?.type ?? "";
    const groupId: string | undefined = event.source?.groupId;

    // บันทึก group ลง DB เมื่อ Bot ถูก invite เข้ากลุ่ม หรือมีข้อความจากกลุ่ม
    if (groupId && (sourceType === "group" || sourceType === "room")) {
      await upsertLineGroup(groupId);
    }

    // event: Bot ถูก join กลุ่ม — ตอบกลับทักทาย
    if (event.type === "join" && groupId) {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text: `SchoolBright Helper เข้าร่วมกลุ่มแล้ว\nGroup ID: ${groupId}\nพร้อมส่งรายงานสถานะเครื่อง POS อัตโนมัติ`,
        },
      ]);
    }

    if (event.type === "message" && event.message?.type === "text") {
      const text: string = event.message.text ?? "";

      // คำสั่ง /luid — ตอบกลับ userId และ groupId
      if (text.trim() === "/luid") {
        const userId = event.source?.userId ?? "ไม่พบข้อมูล";
        const gid = groupId ? `\nGroup ID: ${groupId}` : "";
        await replyMessage(event.replyToken, [
          { type: "text", text: `LINE User ID: ${userId}${gid}` },
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
