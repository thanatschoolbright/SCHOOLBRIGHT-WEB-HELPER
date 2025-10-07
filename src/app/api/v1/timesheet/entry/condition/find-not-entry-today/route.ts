import {NextResponse} from "next/server";
import {errorResponse, successResponse} from "@/helpers/api/response";
import {Service} from "@/services/backend/timesheet/entry.service";
import axios from "axios";

// ** ค้นหาข้อมูลจากใน USERS และดูว่า POSITION : Developer , Tester ไหนยังไม่ลง Timesheet (Cross Check กับ findNotEntryToday ด้วย)
const VALIDATED_USERS_ARE_NOT_ENTRY = (users: any[], entries: any[]) => {
    // Filter users to only Developer or Tester
    const filteredUsers = users.filter(
        (user) =>
            user.position === "Developer" ||
            user.position === "Tester" ||
            user.position === "ADMIN" ||
            user.position === "Business Development" ||
            user.position === "Business Analyst"
    );

    // Extract user_ids from entries
    const entryUserIds = entries.map((entry) => entry.user_id);

    // Find users who are not in entries
    const notEntryUsers = filteredUsers
        .filter((user) => !entryUserIds.includes(user.admin_id))
        .map((user) => ({
            ...user,
            status: "ไม่ได้กรอกเลย",
            total_hours: 0,
        }));

    // Find entries with total_hours less than 8 and map to user info with status
    const incompleteEntries = entries
        .filter((entry) => entry.total_hours < 8)
        .map((entry) => {
            const user = filteredUsers.find(
                (u) => String(u.admin_id) === String(entry.user_id)
            );
            if (user) {
                return {
                    ...user,
                    status: "กรอกไม่ครบ",
                    total_hours: entry.total_hours,
                };
            }
            return null;
        })
        .filter((e) => e !== null);

    // Combine both results
    return [...notEntryUsers, ...incompleteEntries];
};

// ** ส่งแจ้งเตือน Discord กรณี ที่ยังทำ Timesheet ไม่ครบ
const DISCORD_WEBHOOK_URL =
    process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_TIMESHEET_SYSTEM ?? "";

async function sendDiscordNotification(users: any[]) {
    console.info("[Discord] start sendDiscordNotification");
    if (!Array.isArray(users)) {
        console.info("[Discord] invalid users payload (not array), skip");
        return;
    }
    console.info(`[Discord] users count: ${users.length}`);
    if (users.length === 0) {
        console.info("[Discord] no users to notify, skip");
        return;
    }

    // Map positions -> role mentions (support multiple aliases)
    const roleMap: Record<string, string> = {
        Tester: "<@&1344136247135703092>",
        "Quality Assurance": "<@&1344136247135703092>",
        Developer: "<@&1344137483901993131>",
        "UX/UI": "<@&1344137746515492905>",
        UXUI: "<@&1344137746515492905>",
        "System Analyst": "<@&1344139128702242877>",
        SystemAnalyst: "<@&1344139128702242877>",
        "Business Analyst": "<@1424599602358784031>",
    };

    const normalizeRole = (pos?: string) => {
        if (!pos) return "-";
        const key = String(pos).trim();
        return roleMap[key] || key;
    };

    // Add userTagMap mapping admin_id to Discord user ID strings
    const userTagMap: Record<number, string> = {
        2: "<@692371893826879568>",
        10: "<@1347719592780238979>",
        23: "<@1293755432484999211>",
        57: "<@692372441699319900>",
        112: "<@>",
        133: "<@376432228886118400>",
        142: "<@400231526270500874>",
        143: "<@250628114504220672>",
        144: "<@637607266048016384>",
        145: "<@341535710043701249>",
        147: "<@618000571030568990>",
        148: "<@376432228886118400>",
        156: "<@431107453082533898>",
        157: "<@701791555085926402>",
        158: "<@1074331797279756328>",
        160: "<@1420709950488838208>",
        995: "<@>",
        996: "<@1074331797279756328>"
    };

    // Build embeds (1 user = 1 card)
    const embeds = users.map((user: any, idx: number) => {
        const roleMention = normalizeRole(user.position);
        const title = `👤 ${user?.firstname ?? "-"} ${user?.lastname ?? "-"} (${
            user?.nickname || "-"
        })`;
        const status = String(user?.status || "-");
        const hours = Number(user?.total_hours ?? 0);
        const email = user?.email || "-";
        const userTag = userTagMap[user?.admin_id] || "";
        const color =
            status === "ไม่ได้กรอกเลย"
                ? 0xff0000
                : status === "กรอกไม่ครบ"
                    ? 0xffa500
                    : 0x0099ff;

        return {
            title,
            description: [
                `**ตำแหน่ง:** ${roleMention}`,
                `**สถานะ:** ${status}`,
                `**ชั่วโมงทำงาน:** \`${hours}\``,
                `**อีเมล:** ${email}`,
                `**Tag:** ${userTag}`,
            ].join("\n"),
            color,
            footer: {text: "📌 Timesheet Notification System"},
            timestamp: new Date().toISOString(),
        };
    });

    console.info(`[Discord] built embeds: ${embeds.length}`);
    if (embeds.length > 0) {
        console.info("[Discord] first embed preview:", JSON.stringify(embeds[0]));
    }

    const contentHeader = `**แจ้งเตือน Timesheet ประจำวัน (${new Date().toLocaleDateString(
        "th-TH"
    )})**\n@here`;
    console.info("[Discord] content header:", contentHeader);

    // Discord limits: max 10 embeds per request
    const chunk = <T>(arr: T[], size: number): T[][] => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    };

    const batches = chunk(embeds, 10);
    console.info(`[Discord] total batches: ${batches.length}`);

    for (let i = 0; i < batches.length; i++) {
        const batchEmbeds = batches[i];
        const payload = {
            content: i === 0 ? contentHeader : undefined, // ส่ง content แค่รอบแรกกันสแปม
            embeds: batchEmbeds,
        };

        console.info(
            `[Discord] sending batch ${i + 1}/${batches.length} with ${
                batchEmbeds.length
            } embeds`
        );

        try {
            const res = await axios.post(DISCORD_WEBHOOK_URL, payload, {
                headers: {"Content-Type": "application/json"},
            });
            console.info(
                `[Discord] batch ${i + 1} sent successfully: ${res.status} ${
                    res.statusText
                }`
            );
        } catch (err: any) {
            if (err?.response) {
                console.error(
                    `[Discord] batch ${i + 1} failed: ${err.response.status} ${
                        err.response.statusText
                    }`,
                    typeof err.response.data === "string"
                        ? err.response.data
                        : JSON.stringify(err.response.data)
                );
            } else {
                console.error(
                    `[Discord] batch ${i + 1} network error: ${err?.message || err}`
                );
            }
        }
    }

    console.info("[Discord] done sendDiscordNotification");
}

export async function GET() {
    //   const URL = API_URL.SB_HELPER_URL;
    const URL = "http://www.localhost:3000";
    try {
        const response = await Service.findNotEntryToday();

        const {data: resData} = await axios.get(`${URL}/api/v1/admin/user/`);
        const resultUsers = resData?.data?.data;
        const users = Array.isArray(resultUsers) ? resultUsers : [];
        const validated = VALIDATED_USERS_ARE_NOT_ENTRY(users, response);
        await sendDiscordNotification(validated);
        return NextResponse.json(successResponse({data: validated}));
    } catch (error: unknown) {
        console.error(error);
        return NextResponse.json(
            errorResponse({
                message_en: error instanceof Error ? error.message : "Unknown error",
                message_th: "เกิดข้อผิดพลาด",
                error,
            })
        );
    }
}
