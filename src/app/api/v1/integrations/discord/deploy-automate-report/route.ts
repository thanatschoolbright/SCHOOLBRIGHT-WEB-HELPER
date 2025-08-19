import {NextRequest, NextResponse} from "next/server";
import axios from "axios";
import {discordIdUser} from "@/helpers/api/discord-id-user";

export async function POST(req: NextRequest) {
    const payload = await req.json();
    let mentionUser = "";

    console.log("Received payload:", JSON.stringify(payload, null, 2));


    try {
        // --- Prepare data for Discord report ---
        const automateUrl: string = (payload?.github_page || payload?.url || "").toString().trim();

        // Basic validations
        if (!automateUrl || !automateUrl.startsWith("http")) {
            console.error("Invalid or missing automateUrl (github_page/url) in payload:", payload);
            return NextResponse.json({
                message: "Invalid or missing github_page/url in payload",
                status: 400,
            });
        }


        const pusher: string = "Automated System";


        mentionUser = discordIdUser.TeamSupport;
        const discordWebhook: string =
            process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_AUTOMATED_TEST ?? "";

        if (!discordWebhook || !discordWebhook.startsWith("http")) {
            console.error("Invalid Discord webhook URL:", discordWebhook);
            return NextResponse.json({
                message: "Invalid Discord webhook URL",
                status: 500,
            });
        }


        const discordPayload: any = {
            content: `${mentionUser} มีรายงานการทดสอบอัตโนมัติพร้อมให้ตรวจสอบแล้ว 📣`,
            embeds: [จด
                {
                    title: "✅ Automated Test Report is ready",
                    description: `URL : ${automateUrl}`,
                    color: 0x2ecc71,
                    fields: [
                        {
                            name: "🕒 เวลาที่สร้างรายงาน",
                            value: new Date().toLocaleString("th-TH", {timeZone: "Asia/Bangkok"}),
                            inline: true,
                        },
                        {
                            name: "👤 ผู้ที่ทริกเกอร์",
                            value: pusher,
                            inline: true,
                        },
                    ],
                    footer: {
                        text: "Playwright / Allure • SB Helper",
                    },
                    timestamp: new Date().toISOString(),
                    url: automateUrl, // ทำให้คลิกที่ title ไปยังหน้า report ได้
                },
            ],
        };

        // Add interactive buttons (if Discord webhook supports components)
        discordPayload.components = [
            {
                type: 1, // Action Row
                components: [
                    {
                        type: 2, // Button
                        style: 5, // Link button
                        label: "เปิดรายงาน (GitHub Pages)",
                        url: automateUrl,
                        emoji: {name: "📊"},
                    },
                ],
            },
        ];

        console.log("📤 Sending Discord payload:", JSON.stringify(discordPayload, null, 2));

        const response = await axios.post(discordWebhook, discordPayload, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log("✅ Discord response:", response.data);

        return NextResponse.json({
            message: "Push notification sent to Discord",
            status: response.status,
        });
    } catch (err: any) {
        return NextResponse.json({
            message: err.message || "Internal Server Error",
            status: err.response?.status || 500,
        });
    }
}
