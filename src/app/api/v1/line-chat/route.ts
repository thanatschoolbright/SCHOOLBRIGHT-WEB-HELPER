// src/app/api/v1/line-chat/route.ts

import {NextRequest, NextResponse} from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.text();
    let json: any;
    try {
        json = JSON.parse(body);
    } catch (e) {
        console.error("Invalid JSON:", body);
        return NextResponse.json({message: "Invalid JSON"}, {status: 400});
    }

    // LOG ข้อมูลสำคัญทุก event
    if (json.events && Array.isArray(json.events)) {
        json.events.forEach((event: any, idx: number) => {
            const userId = event?.source?.userId || "-";
            const type = event?.type || "-";
            const messageType = event?.message?.type || "-";
            const messageText = event?.message?.text || "-";
            const replyToken = event?.replyToken || "-";
            console.log(
                `[LINE EVENT #${idx + 1}] userId=${userId} type=${type} messageType=${messageType} text=${messageText} replyToken=${replyToken}`
            );
        });
    } else {
        console.log("No events in webhook:", json);
    }

    // ตัวอย่าง: ตอบกลับ userId ถ้าพิมพ์ /luid
    if (
        json.events &&
        Array.isArray(json.events) &&
        json.events.length > 0 &&
        json.events[0].type === "message" &&
        json.events[0].message.type === "text" &&
        json.events[0].message.text === "/luid"
    ) {
        const replyToken = json.events[0].replyToken;
        const userId = json.events[0].source.userId;
        const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;

        await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${channelAccessToken}`,
            },
            body: JSON.stringify({
                replyToken,
                messages: [
                    {
                        type: "text",
                        text: `>> LINE User ID: ${userId}`,
                    },
                ],
            }),
        });
    }

    return NextResponse.json({message: "ok"}, {status: 200});
}

export async function GET() {
    return NextResponse.json({message: "LINE Webhook is running"});
}
