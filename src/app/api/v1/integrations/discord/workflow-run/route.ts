import axios, {type AxiosResponse} from "axios";
import {NextRequest, NextResponse} from "next/server";
import {discordIdUser} from "@/helpers/api/discord-id-user";
import {errorResponse, successResponse} from "@/helpers/api/response";

//** คอนฟิกและค่าคงที่ (ตั้งเป็นตัวแปรบนสุดเพื่อแก้ไขง่าย)
const ALTERNATIVE_WEBHOOK = process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_PULL_REQUEST_SERVER;
const DEFAULT_WEBHOOK = process.env.NEXT_PUBLIC_WEBHOOK_DISCORD_RELEASE_PRODUCTION_SERVER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
const DEDUP_WINDOW_MS = 5_000; // มิลลิวินาที
const MAX_EMBED_DESCRIPTION = 3000; // Discord embed safe margin
const MAX_STEPS = 80;

const lastNotified: Record<string, number> = {};

//** Type Definitions (เฉพาะ fields ที่เราใช้) - เพิ่ม type safety
type JobStatus = "queued" | "in_progress" | "completed";

interface WorkflowJobPartial {
    id?: number;
    name?: string;
    status?: string;
    conclusion?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    steps?: Array<Record<string, any>>;
    html_url?: string;
    run_id?: number;
}

interface WorkflowRunPartial {
    id?: number;
    name?: string;
    status?: string;
    conclusion?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    run_number?: number;
    run_started_at?: string | null;
    completed_at?: string | null;
    html_url?: string;
}

interface GitHubWebhookPayload {
    repository?: { full_name?: string };
    workflow_job?: WorkflowJobPartial;
    workflow_run?: WorkflowRunPartial & { head_commit?: any };
    sender?: { login?: string };
}

//** Mapping ของสถานะให้เป็น emoji / สี / คำอ่าน (ใช้กับสถานะระดับ job/run)
const STATUS_MAP: Record<JobStatus, { emoji: string; color: number; label: string }> = {
    queued: {emoji: "⏳", color: 0xf1c40f, label: "รอคิว"},
    in_progress: {emoji: "🚀", color: 0x3498db, label: "กำลัง Deploy"},
    completed: {emoji: "✅", color: 0x2ecc71, label: "เสร็จสิ้น"},
};

const STEP_STATUS_EMOJI: Record<string, string> = {
    success: "✅",
    completed: "✅",
    in_progress: "🚀",
    queued: "⏳",
    failure: "❌",
    cancelled: "⚠️",
    skipped: "⏭️",
};

//** ช่วยแปลง timestamp เป็น ISO (หรือ undefined)
function formatTimestampISO(value?: string | null): string | undefined {
    return value ? new Date(value).toISOString() : undefined;
}

//** สร้างบรรทัดแสดงขั้นตอนจาก array ของ steps (job.steps หรือ jobs[].steps)
//** คืนเป็นสตริงหลายบรรทัด เช่น "✅ **checkout** completed • 5s"
function buildStepLines(steps: Array<Record<string, any>> | undefined): string {
    if (!Array.isArray(steps) || steps.length === 0) return "";

    const lines = steps.slice(0, MAX_STEPS).map((step, idx) => {
        const name = (step.name ?? step.step ?? step.number)?.toString() ?? `Step ${idx + 1}`;
        const status = (step.status ?? step.conclusion ?? step.step_status ?? "unknown").toString();
        const emoji = STEP_STATUS_EMOJI[status] ?? "📦";
        const duration = step.started_at && step.completed_at
            ? ` • ${Math.round((new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()) / 1000)}s`
            : "";
        return `${emoji} **${name}** ${status}${duration}`;
    });

    return lines.join("\n");
}

//** พยายามดึง jobs + steps ของ workflow run ผ่าน GitHub API (ต้องมี token)
//** คืน array ของ steps หรือ undefined เมื่อไม่สามารถดึงได้
async function fetchRunJobsSteps(repoFullName: string, runId: number | string): Promise<Array<Record<string, any>> | undefined> {
    if (!GITHUB_TOKEN) return undefined;

    const url = `https://api.github.com/repos/${repoFullName}/actions/runs/${runId}/jobs`;
    try {
        const httpResponse: AxiosResponse = await axios.get(url, {
            headers: {Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json"},
            timeout: 5000,
        });

        const jobs: Array<Record<string, any>> = httpResponse.data?.jobs ?? [];
        const flattenedSteps: Array<Record<string, any>> = [];

        for (const job of jobs) {
            // include job header to separate jobs in embed
            flattenedSteps.push({name: `Job: ${job.name ?? job.id}`, status: job.status ?? job.conclusion});
            if (Array.isArray(job.steps)) {
                for (const step of job.steps) {
                    flattenedSteps.push(step);
                    if (flattenedSteps.length >= MAX_STEPS) break;
                }
            }
            if (flattenedSteps.length >= MAX_STEPS) break;
        }

        return flattenedSteps;
    } catch (error) {
        // ไม่ต้องโยน error ต่อ — หาก fetch ไม่สำเร็จ เราก็จะส่งสรุประดับ run แทน
        return undefined;
    }
}

//** POST handler
//** การทำงาน (ย่อ):
//** 1) ตรวจ header x-github-event ว่าเป็น workflow_job หรือ workflow_run
//** 2) normalize ข้อมูล (ชื่อ job/run, สถานะ, timestamps, steps)
//** 3) ถ้าไม่มี steps และมี runId จะพยายาม fetch jobs->steps จาก GitHub API
//** 4) ป้องกันการแจ้งซ้ำ (dedup)
//** 5) สร้าง payload สำหรับ Discord (embed) และส่งด้วย axios
export async function POST(request: NextRequest) {
    const githubEvent = request.headers.get("x-github-event");
    if (!githubEvent) {
        return NextResponse.json(
            errorResponse({
                status: 400,
                message_en: "Missing x-github-event header",
                message_th: "ไม่มี header x-github-event",
            }),
            {status: 400}
        );
    }

    const payload: GitHubWebhookPayload = await request.json().catch(() => ({} as GitHubWebhookPayload));

    if (githubEvent !== "workflow_job" && githubEvent !== "workflow_run") {
        return NextResponse.json(
            successResponse({
                message_en: "Event ignored",
                message_th: "ไม่ใช่เหตุการณ์ workflow_job หรือ workflow_run",
                data: {event: githubEvent},
            })
        );
    }

    const repositoryName = payload?.repository?.full_name;
    if (!repositoryName) {
        return NextResponse.json(
            errorResponse({
                status: 400,
                message_en: "Missing repository information",
                message_th: "ข้อมูล repository ไม่ครบถ้วน",
            }),
            {status: 400}
        );
    }

    // เลือก webhook จาก env (prefer production DEFAULT then alternative)
    const DISCORD_WEBHOOK = DEFAULT_WEBHOOK ?? ALTERNATIVE_WEBHOOK;
    if (!DISCORD_WEBHOOK) {
        return NextResponse.json(
            errorResponse({
                status: 500,
                message_en: "Discord webhook not configured",
                message_th: "ยังไม่ได้ตั้งค่า Discord webhook",
            }),
            {status: 500}
        );
    }

    // Log which webhook we will use (ช่วย debug กรณี 404)
    console.info("Using Discord webhook:", DISCORD_WEBHOOK);

    // Normalize ข้อมูลจาก payload (defensive):
    // หาก payload มี workflow_job ให้ใช้ข้อมูล job เสมอแม้ header จะเป็น workflow_run
    let title = "Deployment Workflow";
    let itemName = "workflow";
    let itemStatus: JobStatus | string = "queued";
    let startedAt: string | undefined;
    let completedAt: string | undefined;
    let steps: Array<Record<string, any>> | undefined;
    let conclusion: string | undefined;
    let runUrl: string | undefined;
    let runId: number | string | undefined;

    const jobPayload = payload.workflow_job as WorkflowJobPartial | undefined;
    const runPayload = payload.workflow_run as WorkflowRunPartial | undefined;

    if (jobPayload) {
        // ใช้ข้อมูลจาก workflow_job หากมี
        itemName = jobPayload?.name ?? jobPayload?.id?.toString() ?? "job";
        itemStatus = jobPayload?.status ?? itemStatus;
        conclusion = jobPayload?.conclusion ?? undefined;
        startedAt = jobPayload?.started_at ?? undefined;
        completedAt = jobPayload?.completed_at ?? undefined;
        steps = jobPayload?.steps ?? undefined;
        runUrl = jobPayload?.html_url ?? runPayload?.html_url ?? undefined;
        runId = runPayload?.id ?? jobPayload?.run_id;
        title = `Deployment Job (${repositoryName})`;
    } else if (runPayload) {
        // หากไม่มี job ข้อมูล ให้ใช้ workflow_run
        itemName = runPayload?.name ?? `#${runPayload?.run_number ?? runPayload?.id ?? "run"}`;
        itemStatus = runPayload?.status ?? itemStatus;
        conclusion = runPayload?.conclusion ?? undefined;
        startedAt = runPayload?.created_at ?? runPayload?.run_started_at ?? undefined;
        completedAt = runPayload?.updated_at ?? runPayload?.completed_at ?? undefined;
        runUrl = runPayload?.html_url ?? undefined;
        runId = runPayload?.id ?? undefined;
        title = `Deployment Run (${repositoryName})`;
    } else {
        // ไม่พบข้อมูลที่คาดหวังใน payload
        return NextResponse.json(
            errorResponse({
                status: 400,
                message_en: "Payload missing workflow_job or workflow_run",
                message_th: "payload ไม่มี workflow_job หรือ workflow_run",
            }),
            {status: 400}
        );
    }

    // หากไม่มี steps และมี runId ให้ลอง fetch jobs->steps (GitHub API)
    if ((!steps || !steps.length) && runId) {
        const fetchedSteps = await fetchRunJobsSteps(repositoryName, runId);
        if (Array.isArray(fetchedSteps) && fetchedSteps.length) {
            steps = fetchedSteps;
        }
    }

    // Deduplication: ป้องกันแจ้งซ้ำในช่วงเวลาสั้น ๆ
    const jobKey = `${repositoryName}-${itemName}-${itemStatus}`;
    const now = Date.now();
    if (lastNotified[jobKey] && now - lastNotified[jobKey] < DEDUP_WINDOW_MS) {
        return NextResponse.json(
            successResponse({
                message_en: "Duplicate notification skipped",
                message_th: "ข้ามการแจ้งเตือนซ้ำ (ภายใน dedup window)",
                data: {jobKey},
            })
        );
    }
    lastNotified[jobKey] = now;

    const statusInfo = (STATUS_MAP as any)[(itemStatus as JobStatus)] ?? {
        emoji: "📦",
        color: 0x95a5a6,
        label: String(itemStatus)
    };

    const stepLines = buildStepLines(steps);

    const descriptionParts: string[] = [
        `${statusInfo.emoji} **${itemName}**`,
        `สถานะ: **${statusInfo.label}** ${conclusion ? `• ผลลัพธ์: **${conclusion}**` : ""}`,
    ];

    if (startedAt) descriptionParts.push(`เริ่มเมื่อ: <t:${Math.floor(new Date(startedAt).getTime() / 1000)}:R>`);
    if (completedAt) descriptionParts.push(`เสร็จเมื่อ: <t:${Math.floor(new Date(completedAt).getTime() / 1000)}:R>`);
    if (runUrl) descriptionParts.push(`[ดูรายละเอียดและ logs](${runUrl})`);

    //** เพิ่มผู้ที่เป็น actor (คน/ระบบที่ trigger) หากมี ให้แสดงเพื่อความชัดเจน
    const actorValue = payload?.sender?.login ?? payload?.workflow_run?.head_commit?.author?.name ?? undefined;
    if (actorValue) descriptionParts.push(`โดย: **${actorValue}**`);

    if (stepLines) descriptionParts.push("\n**ขั้นตอน (Steps):**\n" + stepLines);

    // Build description และตัดทอนหากยาวเกินไป
    let description = descriptionParts.filter(Boolean).join("\n\n");
    if (description.length > MAX_EMBED_DESCRIPTION) {
        description = description.slice(0, MAX_EMBED_DESCRIPTION - 12) + "\n\n...(truncated)";
    }

    // ใช้ formatTimestampISO เพื่อกำหนด timestamp ของ embed (prefer completedAt then startedAt)
    const embedTimestamp = formatTimestampISO(completedAt ?? startedAt) ?? new Date().toISOString();

    const embed = {
        title,
        color: statusInfo.color,
        description,
        footer: {
            text: "GitHub Actions • Deployment Tracker",
            icon_url: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
        },
        timestamp: embedTimestamp,
    } as any;

    // mention แบบ fallback (สามารถ map repo -> mention แยกได้)
    const mention = discordIdUser?.TeamSupport ?? "@here";

    const payloadToSend: Record<string, any> = {
        content: `${mention} แจ้งสถานะ Deployment ล่าสุด (${repositoryName})`,
        embeds: [embed],
    };

    try {
        const httpResponse: AxiosResponse = await axios.post(DISCORD_WEBHOOK, payloadToSend, {
            headers: {"Content-Type": "application/json"},
            timeout: 5000,
        });

        return NextResponse.json(
            successResponse({
                data: {status: httpResponse.status},
                message_en: "Deployment status sent to Discord",
                message_th: "ส่งแจ้งเตือนสถานะ Deployment แล้ว",
            })
        );
    } catch (error: any) {
        // เก็บข้อมูล error เพื่อช่วย debug
        const discordErrorStatus: number | undefined = error?.response?.status;
        const discordErrorBody: unknown = error?.response?.data ?? error?.message;

        console.error("Discord webhook error:", {
            webhook: DISCORD_WEBHOOK,
            status: discordErrorStatus,
            body: discordErrorBody,
        });

        // หาก primary webhook คืน 404 และมี ALTERNATIVE_WEBHOOK ให้ลอง fallback
        if (discordErrorStatus === 404 && ALTERNATIVE_WEBHOOK && ALTERNATIVE_WEBHOOK !== DISCORD_WEBHOOK) {
            try {
                const fallbackResponse: AxiosResponse = await axios.post(ALTERNATIVE_WEBHOOK, payloadToSend, {
                    headers: {"Content-Type": "application/json"},
                    timeout: 5000,
                });

                console.info("Discord primary webhook 404 — used fallback webhook", {
                    fallbackWebhook: ALTERNATIVE_WEBHOOK,
                    status: fallbackResponse.status
                });
                return NextResponse.json(
                    successResponse({
                        data: {primaryStatus: discordErrorStatus, fallbackStatus: fallbackResponse.status},
                        message_en: "Primary webhook returned 404 — used fallback webhook",
                        message_th: " primary webhook 404 — ใช้ fallback webhook แทน",
                    })
                );
            } catch (fallbackError: any) {
                console.error("Fallback webhook also failed", {
                    fallbackWebhook: ALTERNATIVE_WEBHOOK,
                    status: fallbackError?.response?.status,
                    body: fallbackError?.response?.data ?? fallbackError?.message,
                });

                return NextResponse.json(
                    errorResponse({
                        status: fallbackError?.response?.status || 500,
                        message_en: "Both primary and fallback webhooks failed",
                        message_th: "ทั้ง primary และ fallback webhooks ล้มเหลว",
                        error: {
                            primaryStatus: discordErrorStatus,
                            primaryBody: discordErrorBody,
                            fallbackStatus: fallbackError?.response?.status || 500,
                            fallbackBody: fallbackError?.response?.data ?? fallbackError?.message
                        }
                    }),
                    {status: fallbackError?.response?.status || 500}
                );
            }
        }

        // ปกติกรณี error ทั่วไป ให้ส่งรายละเอียดกลับมาเพื่อช่วย debug (ไม่ควรเผย secret)
        return NextResponse.json(
            errorResponse({
                status: discordErrorStatus || 500,
                message_en: error?.message || "Discord webhook request failed",
                message_th: "ส่งแจ้งเตือนไม่สำเร็จ",
                error: discordErrorBody
            }),
            {status: discordErrorStatus || 500}
        );
    }
}
