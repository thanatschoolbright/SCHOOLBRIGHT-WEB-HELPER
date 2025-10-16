import {NextResponse} from "next/server";
import {z} from "zod";
import ExcelJS from "exceljs";
import axios from "axios";
import {errorResponse} from "@/helpers/api/response";
import {Service} from "@/services/backend/timesheet/entry.service";
import {API_URL} from "@services/api-url";

const RequestSchema = z.object({
    start_date: z.string().min(1, "กรุณาระบุวันที่เริ่มต้น"),
    end_date: z.string().min(1, "กรุณาระบุวันที่สิ้นสุด"),
    project_id: z.string().optional(),
    sub_project_id: z.string().optional(),
    created_by: z.string().optional(),
    investment: z.coerce.number().gt(0, "จำนวนเงินลงทุนต้องมากกว่า 0"),
});

const parseDate = (value: string, type: "start" | "end") => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error("รูปแบบวันที่ไม่ถูกต้อง");
    }
    const hours = type === "start" ? 0 : 23;
    const minutes = type === "start" ? 0 : 59;
    const seconds = type === "start" ? 0 : 59;
    const ms = type === "start" ? 0 : 999;
    date.setHours(hours, minutes, seconds, ms);
    return date;
};

const normalizeFilterValue = (value?: string) => {
    if (!value || value.trim() === "") {
        return undefined;
    }
    const asNumber = Number(value);
    return Number.isNaN(asNumber) ? undefined : asNumber;
};

type RawUser = {
    admin_id?: number;
    firstname?: string | null;
    lastname?: string | null;
    employee_code?: string | null;
    position?: string | null;
    email?: string | null;
};

type RequestPayload = z.infer<typeof RequestSchema>;

type ExportStatus = "queued" | "processing" | "ready" | "failed";

type ExportStep = {
    key: string;
    label: string;
    timestamp: string;
};

interface ExportTaskState {
    id: string;
    status: ExportStatus;
    steps: ExportStep[];
    error?: string;
    buffer?: ArrayBuffer;
    filename?: string;
    createdAt: number;
    updatedAt: number;
}

const EXPORT_TASK_TTL_MS = 10 * 60 * 1000;
const exportTasks = new Map<string, ExportTaskState>();

const cleanupTasks = () => {
    const now = Date.now();
    exportTasks.forEach((task, id) => {
        if (now - task.updatedAt > EXPORT_TASK_TTL_MS) {
            exportTasks.delete(id);
        }
    });
};

const setTaskState = (id: string, patch: Partial<ExportTaskState>) => {
    const task = exportTasks.get(id);
    if (!task) return;
    exportTasks.set(id, {
        ...task,
        ...patch,
        updatedAt: Date.now(),
    });
};

const pushTaskStep = (id: string, key: string, label: string) => {
    const task = exportTasks.get(id);
    if (!task) return;
    const step: ExportStep = {
        key,
        label,
        timestamp: new Date().toISOString(),
    };
    task.steps = [...task.steps, step];
    task.updatedAt = Date.now();
    exportTasks.set(id, task);
};

const extractHours = (value: unknown): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value && typeof value === "object" && "toNumber" in (value as any)) {
        try {
            return Number((value as any).toNumber());
        } catch (error) {
            return 0;
        }
    }
    return 0;
};

const buildUserDirectory = (users: RawUser[]) => {
    const directory = new Map<number, RawUser>();
    users.forEach((user) => {
        if (user?.admin_id !== undefined && user?.admin_id !== null) {
            directory.set(Number(user.admin_id), user);
        }
    });
    return directory;
};

const formatFullName = (user?: RawUser) => {
    if (!user) return "-";
    const firstname = user.firstname?.trim() ?? "";
    const lastname = user.lastname?.trim() ?? "";
    const fullname = `${firstname} ${lastname}`.trim();
    if (fullname) return fullname;
    return user.email ?? "-";
};

const mapEntryToRow = (
    entry: any,
    idx: number,
    userDirectory: Map<number, RawUser>,
    hourlyRate: number
) => {
    const projectName = entry.project?.name ?? "-";
    const projectCode = entry.project ? String(entry.project.id) : "-";
    const featureName = entry.feature?.name ?? "-";
    const featureCode = entry.feature ? String(entry.feature.id) : "-";
    const hoursValue = extractHours(entry.hours ?? 0);
    const user = entry.createdBy
        ? userDirectory.get(Number(entry.createdBy))
        : undefined;

    const investmentValue = Number((hoursValue * hourlyRate).toFixed(2));
    const ownerName = formatFullName(user);
    const ownerDisplay =
        ownerName === "-" && entry.createdBy ? String(entry.createdBy) : ownerName;

    return {
        index: idx + 1,
        project_code: projectCode,
        project_name: projectName,
        sub_project_code: featureCode,
        sub_project_name: featureName,
        owner_name: ownerDisplay,
        employee_code: user?.employee_code ?? "-",
        position: user?.position ?? "-",
        hours: hoursValue,
        investment_value: investmentValue,
        work_date: new Date(entry.date).toLocaleDateString("th-TH"),
        status: entry.status ?? "-",
        description: entry.description ?? "-",
    };
};

const configureWorksheet = (workbook: ExcelJS.Workbook) => {
    const worksheet = workbook.addWorksheet("Timesheet Export", {
        views: [{state: "frozen", ySplit: 1}],
    });

    worksheet.columns = [
        {header: "ลำดับ", key: "index", width: 8},
        {header: "รหัสโครงการหลัก", key: "project_code", width: 18},
        {header: "ชื่อโครงการหลัก", key: "project_name", width: 28},
        {header: "รหัสโครงการย่อย", key: "sub_project_code", width: 18},
        {header: "ชื่อโครงการย่อย", key: "sub_project_name", width: 28},
        {header: "ผู้จัดทำ", key: "owner_name", width: 28},
        {header: "รหัสพนักงาน", key: "employee_code", width: 18},
        {header: "ตำแหน่ง", key: "position", width: 18},
        {header: "ชั่วโมงการทำงาน", key: "hours", width: 18},
        {header: "มูลค่าการลงทุน", key: "investment_value", width: 20},
        {header: "วันที่ลงการทำงาน", key: "work_date", width: 18},
        {header: "สถานะ", key: "status", width: 14},
        {header: "รายละเอียด", key: "description", width: 40},
    ];

    worksheet.columns.forEach((column) => {
        column.alignment = {vertical: "middle", wrapText: true};
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = {bold: true, color: {argb: "FFFFFFFF"}};
    headerRow.alignment = {horizontal: "center", vertical: "middle"};
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {argb: "FF1F4E79"},
    };
    headerRow.height = 24;

    worksheet.getColumn("hours").numFmt = "#,##0.00";
    worksheet.getColumn("investment_value").numFmt = "#,##0.00";

    return worksheet;
};

const buildFilename = (payload: RequestPayload) =>
    `timesheet-export_${payload.start_date}_${payload.end_date}.xlsx`;

const processExportTask = async (exportId: string, body: RequestPayload) => {
    try {
        setTaskState(exportId, {status: "processing"});
        pushTaskStep(exportId, "PREPARE_DATE_RANGE", "กำลังเตรียมช่วงวันที่");
        const startDate = parseDate(body.start_date, "start");
        const endDate = parseDate(body.end_date, "end");

        pushTaskStep(exportId, "NORMALIZE_FILTER", "กำลังประมวลผลตัวกรอง");
        const projectId = normalizeFilterValue(body.project_id);
        const subProjectId = normalizeFilterValue(body.sub_project_id);
        const createdBy = normalizeFilterValue(body.created_by);
        const investment = body.investment;

        const baseUrl =
            API_URL?.SB_HELPER_URL ?? process.env.NEXT_PUBLIC_SB_HELPER_URL;

        if (!baseUrl || baseUrl === "error") {
            throw new Error("ไม่พบการตั้งค่า SB Helper API base URL");
        }

        pushTaskStep(
            exportId,
            "FETCH_DATA",
            "กำลังดึงข้อมูลบันทึกเวลาและผู้ใช้งาน"
        );

        const [entries, userResponse] = await Promise.all([
            Service.findEntriesForExport({
                startDate,
                endDate,
                projectId,
                subProjectId,
                createdBy,
            }),
            axios.get(`${baseUrl}/api/v1/admin/user/`),
        ]);

        pushTaskStep(exportId, "DATA_READY", "ดึงข้อมูลสำเร็จ");

        const rawUsers = userResponse?.data?.data?.data;
        const users = Array.isArray(rawUsers) ? (rawUsers as RawUser[]) : [];
        const userDirectory = buildUserDirectory(users);

        pushTaskStep(exportId, "CALCULATE_RATE", "กำลังคำนวณชั่วโมงและงบลงทุน");
        const totalHours = entries.reduce((sum, entry) => {
            return sum + extractHours(entry.hours ?? 0);
        }, 0);

        if (totalHours <= 0) {
            throw new Error("ไม่พบชั่วโมงการทำงานสำหรับช่วงเวลาที่เลือก");
        }

        const hourlyRate = investment / totalHours;

        pushTaskStep(exportId, "BUILD_EXCEL", "กำลังสร้างไฟล์ Excel");
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Timesheet System";
        workbook.created = new Date();
        const worksheet = configureWorksheet(workbook);

        entries
            .map((entry, idx) => mapEntryToRow(entry, idx, userDirectory, hourlyRate))
            .forEach((row) => {
                const newRow = worksheet.addRow(row);
                newRow.height = 20;
            });

        const buffer = await workbook.xlsx.writeBuffer();
        const filename = buildFilename(body);

        setTaskState(exportId, {
            status: "ready",
            buffer,
            filename,
        });
        pushTaskStep(exportId, "READY", "สร้างไฟล์สำเร็จ พร้อมให้ดาวน์โหลด");
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setTaskState(exportId, {status: "failed", error: message});
        pushTaskStep(exportId, "FAILED", `เกิดข้อผิดพลาด: ${message}`);
        console.error("[Timesheet][export-template-1]", message, error);
    }
};

export async function POST(request: Request) {
    cleanupTasks();

    try {
        const raw = await request.json();
        const body = RequestSchema.parse(raw);
        const exportId = crypto.randomUUID();
        const filename = buildFilename(body);

        exportTasks.set(exportId, {
            id: exportId,
            status: "queued",
            steps: [],
            filename,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        pushTaskStep(exportId, "QUEUED", "คำขอส่งออกถูกสร้าง");
        void processExportTask(exportId, body);

        const origin = request.headers.get("origin") ?? API_URL.SB_HELPER_URL;
        const url = new URL(request.url);
        const statusUrl = `${origin}${url.pathname}?exportId=${exportId}`;
        const downloadUrl = `${statusUrl}&download=1`;

        return NextResponse.json(
            {
                exportId,
                status: "queued",
                filename,
                statusUrl,
                downloadUrl,
            },
            {status: 202}
        );
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                errorResponse({
                    status: 400,
                    message_th: error.issues.map((issue) => issue.message).join(", "),
                    message_en: "Invalid request payload",
                    error,
                }),
                {status: 400}
            );
        }

        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Timesheet][export-template-1]", message, error);

        return NextResponse.json(
            errorResponse({
                message_en: message,
                message_th: "ไม่สามารถสร้างไฟล์ Excel ได้",
                error,
            }),
            {status: 500}
        );
    }
}

export async function GET(request: Request) {
    cleanupTasks();

    const url = new URL(request.url);
    const exportId = url.searchParams.get("exportId");

    if (!exportId) {
        return NextResponse.json(
            errorResponse({
                status: 400,
                message_en: "Missing exportId",
                message_th: "จำเป็นต้องระบุ exportId",
            }),
            {status: 400}
        );
    }

    const task = exportTasks.get(exportId);

    if (!task) {
        return NextResponse.json(
            errorResponse({
                status: 404,
                message_en: "Export job not found",
                message_th: "ไม่พบคำขอส่งออก",
            }),
            {status: 404}
        );
    }

    const wantsDownload = url.searchParams.get("download") === "1";

    if (wantsDownload) {
        if (task.status !== "ready" || !task.buffer) {
            return NextResponse.json(
                errorResponse({
                    status: task.status === "failed" ? 422 : 409,
                    message_en:
                        task.status === "failed"
                            ? task.error ?? "Export failed"
                            : "Export is not ready",
                    message_th:
                        task.status === "failed"
                            ? task.error ?? "ไม่สามารถสร้างไฟล์ได้"
                            : "ไฟล์ยังไม่พร้อมดาวน์โหลด",
                }),
                {status: task.status === "failed" ? 422 : 409}
            );
        }

        return new NextResponse(task.buffer, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${
                    task.filename ?? "timesheet-export.xlsx"
                }"`,
            },
        });
    }

    return NextResponse.json({
        exportId: task.id,
        status: task.status,
        steps: task.steps,
        filename: task.filename,
        error: task.error ?? null,
    });
}
