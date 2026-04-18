import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { buildDeviceStatusReport } from "@services/line/line-push.service";
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

// POST handler รับ webhook events จาก LINE Platform
// LINE spec: ต้องตอบ 200 เสมอ — ห้าม return status อื่น ไม่งั้น LINE จะ retry และแจ้ง error
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  // ตรวจ signature — ถ้าไม่ผ่านให้ log ไว้แต่ยังคง return 200 ตาม LINE spec
  if (signature && !verifyLineSignature(rawBody, signature)) {
    console.warn("[LINE Webhook] Invalid signature — ignored");
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // JSON parse ล้มเหลว ยังคง return 200 ตาม LINE spec
    console.warn("[LINE Webhook] Invalid JSON body");
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  const events: any[] = Array.isArray(body.events) ? body.events : [];

  // ประมวลผล events แบบ async โดยไม่บล็อก response — LINE ต้องการ response เร็วที่สุด
  void (async () => {
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
        const text: string = (event.message.text ?? "").trim();

        // คำสั่ง /luid — ตอบกลับ userId และ groupId
        if (text === "/luid") {
          const userId = event.source?.userId ?? "ไม่พบข้อมูล";
          const gid = groupId ? `\nGroup ID: ${groupId}` : "";
          await replyMessage(event.replyToken, [
            { type: "text", text: `LINE User ID: ${userId}${gid}` },
          ]);
        }

        // คำสั่ง "สถานะ" — ดึงรายงานสถานะ POS แบบ real-time แล้ว reply กลับ
        if (text === "สถานะ") {
          try {
            const messages = await buildDeviceStatusReport();
            await replyMessage(event.replyToken, messages);
          } catch {
            await replyMessage(event.replyToken, [
              { type: "text", text: "เกิดข้อผิดพลาดขณะดึงข้อมูลสถานะ กรุณาลองใหม่อีกครั้ง" },
            ]);
          }
        }
      }
    }
  })();

  // ตอบ 200 ทันทีตาม LINE Messaging API spec
  return NextResponse.json({ status: "ok" }, { status: 200 });
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
