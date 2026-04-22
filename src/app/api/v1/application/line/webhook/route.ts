import { errorResponse, successResponse } from "@/helpers/api/response";
import {
  generateWebhookTraceId,
  writeWebhookLog,
} from "@/helpers/line/webhook-logger";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import {
  buildDeviceStatusReport,
  buildSchoolStatusReport,
} from "@services/line/line-push.service";
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
async function replyMessage(
  replyToken: string,
  messages: object[],
): Promise<void> {
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
  const requestTime = new Date();
  const masterTraceId = generateWebhookTraceId();
  const ipAddress =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;

  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  // ตรวจ signature — ถ้าไม่ผ่านให้ log ไว้แต่ยังคง return 200 ตาม LINE spec
  if (signature && !verifyLineSignature(rawBody, signature)) {
    console.warn("[LINE Webhook] Invalid signature — ignored");
    writeWebhookLog({
      traceId: masterTraceId,
      requestTime,
      responseTime: new Date(),
      eventType: "unknown",
      sourceType: "unknown",
      outcome: "ignored",
      errorMessage: "Invalid HMAC-SHA256 signature",
      requestBody: { rawBodyLength: rawBody.length, signature },
      ipAddress,
      userAgent,
    });
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // JSON parse ล้มเหลว ยังคง return 200 ตาม LINE spec
    console.warn("[LINE Webhook] Invalid JSON body");
    writeWebhookLog({
      traceId: masterTraceId,
      requestTime,
      responseTime: new Date(),
      eventType: "unknown",
      sourceType: "unknown",
      outcome: "error",
      errorMessage: "JSON parse failed — invalid body from LINE platform",
      requestBody: { rawBody: rawBody.slice(0, 500) },
      ipAddress,
      userAgent,
    });
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  const events: Record<string, unknown>[] = Array.isArray(body.events)
    ? (body.events as Record<string, unknown>[])
    : [];

  // ประมวลผล events แบบ async โดยไม่บล็อก response — LINE ต้องการ response เร็วที่สุด
  void (async () => {
    for (const event of events) {
      const eventRequestTime = new Date();
      const traceId = `${masterTraceId}-${
        (event.type as string) ?? "unknown"
      }-${Date.now()}`;
      const sourceType: string =
        ((event.source as Record<string, unknown>)?.type as string) ?? "";
      const groupId: string | undefined = (
        event.source as Record<string, unknown>
      )?.groupId as string | undefined;
      const userId: string | undefined = (
        event.source as Record<string, unknown>
      )?.userId as string | undefined;

      // บันทึก group ลง DB เมื่อ Bot ถูก invite เข้ากลุ่ม หรือมีข้อความจากกลุ่ม
      if (groupId && (sourceType === "group" || sourceType === "room")) {
        await upsertLineGroup(groupId);
      }

      // event: Bot ถูก join กลุ่ม — ตอบกลับทักทาย
      if (event.type === "join" && groupId) {
        try {
          await replyMessage(event.replyToken as string, [
            {
              type: "text",
              text: `SchoolBright Helper เข้าร่วมกลุ่มแล้ว\nGroup ID: ${groupId}\nพร้อมส่งรายงานสถานะเครื่อง POS อัตโนมัติ`,
            },
          ]);
          writeWebhookLog({
            traceId,
            requestTime: eventRequestTime,
            responseTime: new Date(),
            eventType: "join",
            sourceType,
            groupId,
            userId,
            outcome: "success",
            requestBody: { event },
            responseBody: { action: "replied-join-greeting" },
            ipAddress,
            userAgent,
          });
        } catch (err) {
          writeWebhookLog({
            traceId,
            requestTime: eventRequestTime,
            responseTime: new Date(),
            eventType: "join",
            sourceType,
            groupId,
            userId,
            outcome: "error",
            errorMessage: err instanceof Error ? err.message : String(err),
            requestBody: { event },
            ipAddress,
            userAgent,
          });
        }
      }

      if (
        event.type === "message" &&
        (event.message as Record<string, unknown>)?.type === "text"
      ) {
        const text: string = (
          ((event.message as Record<string, unknown>).text as string) ?? ""
        ).trim();

        // คำสั่ง /luid — ตอบกลับ userId และ groupId
        if (text === "/luid") {
          const lineUserId = userId ?? "ไม่พบข้อมูล";
          const gid = groupId ? `\nGroup ID: ${groupId}` : "";
          try {
            await replyMessage(event.replyToken as string, [
              { type: "text", text: `LINE User ID: ${lineUserId}${gid}` },
            ]);
            writeWebhookLog({
              traceId,
              requestTime: eventRequestTime,
              responseTime: new Date(),
              eventType: "message",
              sourceType,
              groupId,
              userId,
              commandText: "/luid",
              outcome: "success",
              requestBody: { event },
              responseBody: { action: "replied-luid", lineUserId, groupId },
              ipAddress,
              userAgent,
            });
          } catch (err) {
            writeWebhookLog({
              traceId,
              requestTime: eventRequestTime,
              responseTime: new Date(),
              eventType: "message",
              sourceType,
              groupId,
              userId,
              commandText: "/luid",
              outcome: "error",
              errorMessage: err instanceof Error ? err.message : String(err),
              requestBody: { event },
              ipAddress,
              userAgent,
            });
          }
        }

        // คำสั่ง "สถานะ" — ดึงรายงานสถานะ POS แบบ real-time แล้ว reply กลับ
        if (text === "สถานะ") {
          try {
            const messages = await buildDeviceStatusReport();
            await replyMessage(event.replyToken as string, messages);
            writeWebhookLog({
              traceId,
              requestTime: eventRequestTime,
              responseTime: new Date(),
              eventType: "message",
              sourceType,
              groupId,
              userId,
              commandText: "สถานะ",
              outcome: "success",
              requestBody: { event },
              responseBody: {
                action: "replied-device-status",
                messageCount: messages.length,
              },
              ipAddress,
              userAgent,
            });
          } catch (err) {
            await replyMessage(event.replyToken as string, [
              {
                type: "text",
                text: "เกิดข้อผิดพลาดขณะดึงข้อมูลสถานะ กรุณาลองใหม่อีกครั้ง",
              },
            ]);
            writeWebhookLog({
              traceId,
              requestTime: eventRequestTime,
              responseTime: new Date(),
              eventType: "message",
              sourceType,
              groupId,
              userId,
              commandText: "สถานะ",
              outcome: "error",
              errorMessage: err instanceof Error ? err.message : String(err),
              requestBody: { event },
              responseBody: { action: "replied-error-message" },
              ipAddress,
              userAgent,
            });
          }
        }

        // ค้นหาโรงเรียน — ข้อความที่ไม่ใช่คำสั่งพิเศษ ให้ถือว่าเป็น keyword ค้นชื่อโรงเรียน
        if (text !== "สถานะ" && text !== "/luid" && text.length >= 2) {
          try {
            const messages = await buildSchoolStatusReport(text);
            await replyMessage(event.replyToken as string, messages);
            writeWebhookLog({
              traceId,
              requestTime: eventRequestTime,
              responseTime: new Date(),
              eventType: "message",
              sourceType,
              groupId,
              userId,
              commandText: text,
              outcome: "success",
              requestBody: { event },
              responseBody: {
                action: "replied-school-search",
                keyword: text,
                messageCount: messages.length,
              },
              ipAddress,
              userAgent,
            });
          } catch (err) {
            await replyMessage(event.replyToken as string, [
              {
                type: "text",
                text: "เกิดข้อผิดพลาดขณะค้นหาข้อมูลโรงเรียน กรุณาลองใหม่อีกครั้ง",
              },
            ]);
            writeWebhookLog({
              traceId,
              requestTime: eventRequestTime,
              responseTime: new Date(),
              eventType: "message",
              sourceType,
              groupId,
              userId,
              commandText: text,
              outcome: "error",
              errorMessage: err instanceof Error ? err.message : String(err),
              requestBody: { event },
              responseBody: { action: "replied-error-message" },
              ipAddress,
              userAgent,
            });
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
