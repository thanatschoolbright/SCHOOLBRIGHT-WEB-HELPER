import {NextRequest, NextResponse} from "next/server";
import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import {discordIdUser} from "@/helpers/api/discord-id-user";

type RepoConfig = {
    mention: string;
    webhookEnv: keyof NodeJS.ProcessEnv;
};

const DEFAULT_MENTION = "<@692371893826879568>";
const DEFAULT_WEBHOOK_ENV = "NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER";

const REPOSITORY_CONFIG: Record<string, RepoConfig> = {
    "Jabjai-Corporation/robodocs-api-main": {
        mention: discordIdUser.Light,
        webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_ROBODOCS_SERVER",
    },
    "Jabjai-Corporation/robodocs-web-main": {
        mention: discordIdUser.Light,
        webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_ROBODOCS_SERVER",
    },
    "Jabjai-Corporation/sb-web-mark_activity": {
        mention: discordIdUser.Light,
        webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_MARKACTIVITY_SERVER",
    },
    "Jabjai-Corporation/sb-web-system": {
        mention: discordIdUser.Joe,
        webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER",
    },
    "Jabjai-Corporation/sb-web-academic": {
        mention: discordIdUser.Krishnan,
        webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER",
    },
    "Jabjai-Corporation/sb-web-accounting-system": {
        mention: discordIdUser.Tuk,
        webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_ACCOUNTING_SERVER",
    },
    "Jabjai-Corporation/sb-api-mobile": {
        mention: discordIdUser.Joe,
        webhookEnv: "NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER",
    },
};

type ActionStyle = {
    emoji: string;
    label: string;
    subline: string;
    color: number;
};

const ACTION_STYLE_MAP: Record<string, ActionStyle> = {
    opened: {
        emoji: "🚀",
        label: "เปิด PR ใหม่แล้ว!",
        subline: "ทีมพร้อมลุยรีวิวกันได้เลย",
        color: 0x1abc9c,
    },
    reopened: {
        emoji: "🔁",
        label: "PR นี้กลับมาอีกครั้ง",
        subline: "มีการแก้ไขใหม่ อย่าลืมเช็กอัปเดต",
        color: 0xf39c12,
    },
    ready_for_review: {
        emoji: "✅",
        label: "พร้อมสำหรับการรีวิว",
        subline: "ผ่านช่วง Draft แล้ว เข้ามารีวิวได้ทันที",
        color: 0x2ecc71,
    },
};

const DRAFT_ACTION_STYLE: ActionStyle = {
    emoji: "📝",
    label: "กำลังอยู่ในสถานะ Draft",
    subline: "ปรับแต่งอยู่ ยังไม่พร้อมสำหรับรีวิว",
    color: 0xf1c40f,
};

const DEFAULT_ACTION_STYLE: ActionStyle = {
    emoji: "📣",
    label: "มีการอัปเดตบน Pull Request",
    subline: "มีความเคลื่อนไหวใหม่ ๆ ใน PR นี้",
    color: 0x5865f2,
};

const resolveActionStyle = (
    action: string | undefined,
    isDraft: boolean
): ActionStyle => {
    if (isDraft) {
        return DRAFT_ACTION_STYLE;
    }

    return ACTION_STYLE_MAP[action ?? ""] ?? DEFAULT_ACTION_STYLE;
};

const toUnixTimestamp = (value?: string | null) =>
    value ? Math.floor(new Date(value).getTime() / 1000) : undefined;

const buildStatsSummary = (pr: any) => {
    const parts = [
        pr.commits != null ? `• Commits: **${pr.commits}**` : undefined,
        pr.changed_files != null ? `• Files: **${pr.changed_files}**` : undefined,
        pr.additions != null || pr.deletions != null
            ? `• Diff: **+${pr.additions ?? 0} / -${pr.deletions ?? 0}**`
            : undefined,
    ].filter(Boolean);

    return parts.length ? parts.join("\n") : "";
};

const buildTimelineSummary = (pr: any) => {
    const created = toUnixTimestamp(pr.created_at);
    const updated = toUnixTimestamp(pr.updated_at);
    const merged = toUnixTimestamp(pr.merged_at);

    const parts = [
        created ? `• เปิดเมื่อ: <t:${created}:F> (<t:${created}:R>)` : undefined,
        updated && updated !== created
            ? `• อัปเดตล่าสุด: <t:${updated}:R>`
            : undefined,
        merged ? `• รวมโค้ดแล้ว: <t:${merged}:R>` : undefined,
    ].filter(Boolean);

    return parts.length ? parts.join("\n") : "";
};

const buildReviewerSummary = (pr: any) => {
    const reviewers: Array<{ login: string; html_url?: string }> = Array.isArray(
        pr.requested_reviewers
    )
        ? pr.requested_reviewers
        : [];

    if (!reviewers.length) {
        return "ยังไม่ได้ระบุผู้รีวิว — เพิ่ม Reviewer เพื่อแจ้งเตือนอัตโนมัติ ✨";
    }

    return reviewers
        .map((reviewer) =>
            reviewer.login
                ? `• [${reviewer.login}](${
                    reviewer.html_url ?? `https://github.com/${reviewer.login}`
                })`
                : undefined
        )
        .filter(Boolean)
        .join("\n");
};

const buildLabelsSummary = (pr: any) => {
    const labels: Array<{ name?: string }> = Array.isArray(pr.labels)
        ? pr.labels
        : [];

    const labelNames = labels
        .map((label) => (label?.name ? `\`${label.name}\`` : undefined))
        .filter(Boolean);

    return labelNames.length ? labelNames.join(" ") : "";
};

const buildBodyPreview = (body: unknown) => {
    if (typeof body !== "string") {
        return "";
    }

    const sanitized = body.replace(/\r\n/g, "\n").trim();
    if (!sanitized) {
        return "";
    }

    const preview = sanitized.split("\n").slice(0, 6).join("\n");
    return preview.length < sanitized.length ? `${preview}\n…` : preview;
};

const buildComponentButtons = (
    repoName: string,
    prUrl: string,
    fromBranch: string,
    toBranch: string
) => {
    const encodedFrom = encodeURIComponent(fromBranch);
    const encodedTo = encodeURIComponent(toBranch);
    const compareUrl = `https://github.com/${repoName}/compare/${encodedTo}...${encodedFrom}?expand=1`;
    const branchUrl = `https://github.com/${repoName}/tree/${encodedFrom}`;

    return [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 5,
                    label: "เปิด Pull Request",
                    url: prUrl,
                    emoji: {name: "🔍"},
                },
                {
                    type: 2,
                    style: 5,
                    label: "ดู Diff",
                    url: compareUrl,
                    emoji: {name: "🧾"},
                },
                {
                    type: 2,
                    style: 5,
                    label: "ที่มา (From)",
                    url: branchUrl,
                    emoji: {name: "🌿"},
                },
            ],
        },
    ];
};

const buildCurlCommand = (webhook: string, payload: unknown) => {
    const curlHeader = `--header 'Content-Type: application/json'`;
    const jsonPayload = JSON.stringify(payload).replace(/'/g, "'\"'\"'");
    const curlData = `--data '${jsonPayload}'`;

    return `curl --location ${curlHeader} '${webhook}' ${curlData}`;
};

const buildDiscordPayload = (
    mention: string,
    pr: any,
    repoName: string,
    fromBranch: string,
    toBranch: string,
    action: string | undefined
) => {
    const actionStyle = resolveActionStyle(action, Boolean(pr.draft));
    const statsSummary = buildStatsSummary(pr);
    const timelineSummary = buildTimelineSummary(pr);
    const reviewerSummary = buildReviewerSummary(pr);
    const labelsSummary = buildLabelsSummary(pr);
    const bodyPreview = buildBodyPreview(pr.body);
    const mentionId = mention.match(/<@!?([0-9]+)>/)?.[1];

    const fields = [
        {
            name: "🧑‍💻 ผู้เปิด (Author)",
            value: pr.user?.login
                ? `[${pr.user.login}](${pr.user?.html_url ?? pr.html_url})`
                : "ไม่ทราบ",
            inline: true,
        },
        {
            name: "📁 Repository (ที่เก็บโค้ด)",
            value: `\`${repoName}\``,
            inline: true,
        },
        {
            name: "🌿 จากสาขา (From Branch) → ไปยัง (To Branch)",
            value: `\`${fromBranch}\` → \`${toBranch}\``,
            inline: false,
        },
        {
            name: "🚦 สถานะ",
            value: `${actionStyle.emoji} ${actionStyle.label}`,
            inline: true,
        },
    ].filter((field) => Boolean(field.value));

    if (statsSummary) {
        fields.push({
            name: "📊 รายละเอียดการเปลี่ยนแปลง",
            value: statsSummary,
            inline: true,
        });
    }

    if (timelineSummary) {
        fields.push({
            name: "🕒 ไทม์ไลน์",
            value: timelineSummary,
            inline: true,
        });
    }

    if (reviewerSummary) {
        fields.push({
            name: "🧑‍⚖️ ผู้รีวิวที่ร้องขอ",
            value: reviewerSummary,
            inline: false,
        });
    }

    if (labelsSummary) {
        fields.push({
            name: "🏷️ Labels",
            value: labelsSummary,
            inline: false,
        });
    }

    const embed = {
        title: `#${pr.number} ${pr.title}`,
        url: pr.html_url,
        color: actionStyle.color,
        description: [
            `${actionStyle.emoji} **${actionStyle.subline}**`,
            bodyPreview
                ? ["```markdown", bodyPreview, "```"].join("\n")
                : pr.draft
                    ? "⚠️ PR นี้ยังเป็น Draft — พร้อมเมื่อไรกด Ready for Review นะ!"
                    : "โปรดรีวิวและตรวจสอบ",
        ]
            .filter(Boolean)
            .join("\n\n"),
        author: pr.user?.login
            ? {
                name: pr.user.login,
                icon_url: pr.user?.avatar_url,
                url: pr.user?.html_url,
            }
            : undefined,
        thumbnail: pr.user?.avatar_url ? {url: pr.user.avatar_url} : undefined,
        fields,
        footer: {
            text: "ระบบแจ้งเตือน GitHub PR • SchoolBright",
            icon_url:
                "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
        },
        timestamp: new Date().toISOString(),
    };

    const payload: Record<string, unknown> = {
        content: `${mention} ${actionStyle.emoji} Pull Request ใหม่บน \`${repoName}\` พร้อมตรวจสอบแล้ว!`,
        embeds: [embed],
        components: buildComponentButtons(
            repoName,
            pr.html_url,
            fromBranch,
            toBranch
        ),
    };

    if (mentionId) {
        payload.allowed_mentions = {parse: [] as string[], users: [mentionId]};
    }

    return payload;
};

function resolveRepoConfig(repoName: string): RepoConfig {
    return (
        REPOSITORY_CONFIG[repoName] ?? {
            mention: DEFAULT_MENTION,
            webhookEnv: DEFAULT_WEBHOOK_ENV,
        }
    );
}

const lastNotified: Record<number, number> = {};

export async function POST(req: NextRequest) {
    const event = req.headers.get("x-github-event");

    if (event !== "pull_request") {
        return NextResponse.json({
            message: "ไม่ใช่เหตุการณ์ pull_request",
            status: 200,
        });
    }

    const payload = await req.json();

    try {
        const pr = payload?.pull_request;
        if (!pr) {
            return NextResponse.json({
                message: "ข้อมูลส่งมาไม่ถูกต้อง: ไม่มี pull_request",
                status: 400,
            });
        }

        const repoName: string | undefined = payload?.repository?.full_name;
        if (!repoName) {
            return NextResponse.json({
                message: "ข้อมูลส่งมาไม่ถูกต้อง: ไม่มี repository",
                status: 400,
            });
        }

        const now = Date.now();
        if (lastNotified[pr.number] && now - lastNotified[pr.number] < 30000) {
            return NextResponse.json({
                message: "ข้ามการแจ้งเตือนซ้ำ (ภายใน 30 วินาที)",
                status: 200,
            });
        }
        lastNotified[pr.number] = now;

        const {mention, webhookEnv} = resolveRepoConfig(repoName);
        const webhookUrl = process.env[webhookEnv];

        if (!webhookUrl) {
            return NextResponse.json({
                message: `ยังไม่ได้ตั้งค่า Webhook สำหรับ repository: ${repoName}`,
                status: 500,
            });
        }

        const fromBranch = pr.head?.ref ?? "unknown";
        const toBranch = pr.base?.ref ?? "unknown";

        const discordPayload = buildDiscordPayload(
            mention,
            pr,
            repoName,
            fromBranch,
            toBranch,
            payload?.action
        );

        const response = await axios.post(webhookUrl, discordPayload, {
            headers: {"Content-Type": "application/json"},
        });

        return NextResponse.json({
            message: "ส่งการแจ้งเตือนถึง Discord แล้ว",
            status: response.status,
            curl: buildCurlCommand(webhookUrl, discordPayload),
        });
    } catch (err: any) {
        return NextResponse.json({
            message: err.message || "ข้อผิดพลาดภายในระบบ",
            status: err.response?.status || 500,
        });
    }
}
