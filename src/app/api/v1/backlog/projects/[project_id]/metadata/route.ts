import {NextRequest, NextResponse} from "next/server";
import axios from "axios"
import {errorResponse, successResponse} from "@/helpers/api/response";

const BACKLOG_DOMAINS = [
    "backlog.com",
    "backlogtool.com",
    "backlog.jp",
] as const;

type BacklogMetadata = {
    categories: Array<{ id: number; name: string }>;
    milestones: Array<{ id: number; name: string }>;
};

//** ดึง Category และ Milestone ของโปรเจ็กต์จาก Backlog
export async function GET(request: NextRequest, context: any) {
    try {
        const apiKeyFromEnvironment = process.env.BACKLOG_API_KEY;
        if (!apiKeyFromEnvironment) {
            return NextResponse.json(
                errorResponse({
                    status: 500,
                    message_en: "BACKLOG_API_KEY is not configured",
                    message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY",
                }),
                {status: 500}
            );
        }

        const params = context.params || {};
        const projectIdRaw = params.project_id ?? params.projectId;
        const projectIdOrKey = Array.isArray(projectIdRaw)
            ? projectIdRaw[0]
            : projectIdRaw;
        if (!projectIdOrKey) {
            return NextResponse.json(
                errorResponse({
                    status: 400,
                    message_en: "Invalid projectId",
                    message_th: "รูปแบบ projectId ไม่ถูกต้อง",
                }),
                {status: 400}
            );
        }

        const requestUrl = new URL(request.url);
        const space = requestUrl.searchParams.get("space");
        if (!space) {
            return NextResponse.json(
                errorResponse({
                    status: 400,
                    message_en: "Missing space",
                    message_th: "กรุณาระบุ space",
                }),
                {status: 400}
            );
        }

        let lastError: unknown;
        for (const domain of BACKLOG_DOMAINS) {
            try {
                const baseUrl = `https://${space}.${domain}/api/v2/projects/${projectIdOrKey}`;
                const [categoriesResponse, milestonesResponse] = await Promise.all([
                    axios.get(`${baseUrl}/categories`, {
                        params: {apiKey: apiKeyFromEnvironment},
                    }),
                    axios.get(`${baseUrl}/versions`, {
                        params: {apiKey: apiKeyFromEnvironment},
                    }),
                ]);

                const data: BacklogMetadata = {
                    categories: (categoriesResponse.data ??
                        []) as BacklogMetadata["categories"],
                    milestones: (milestonesResponse.data ??
                        []) as BacklogMetadata["milestones"],
                };

                return NextResponse.json(
                    successResponse({
                        data,
                        message_en: "Fetch project metadata successfully",
                        message_th: "ดึงข้อมูล Category และ Milestone สำเร็จ",
                    })
                );
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError;
    } catch (error: any) {
        const status = error?.response?.status || 500;
        const reason =
            error?.response?.data ||
            error?.message ||
            "Fetch project metadata failed";
        return NextResponse.json(
            errorResponse({
                status,
                message_en:
                    typeof reason === "string" ? reason : "Fetch project metadata failed",
                message_th: "ดึงข้อมูลเมทาดาทาของโปรเจ็กต์ไม่สำเร็จ",
                error,
            }),
            {status}
        );
    }
}
