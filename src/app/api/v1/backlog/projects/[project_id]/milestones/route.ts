import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { successResponse, errorResponse } from "@/helpers/api/response";

const BACKLOG_DOMAINS = [
  "backlog.com",
  "backlogtool.com",
  "backlog.jp",
] as const;

type MilestonePayload = {
  name: string;
  description?: string;
  startDate?: string | null;
  releaseDueDate?: string | null;
  archived?: boolean;
};

type MilestoneListQuery = {
  includeArchived?: string;
};

const buildMilestoneForm = (payload: any) => {
  const form = new URLSearchParams();
  if (payload.name !== undefined) form.set("name", payload.name);
  if (payload.description !== undefined)
    form.set("description", payload.description ?? "");
  if (payload.startDate !== undefined)
    form.set("startDate", payload.startDate ?? "");
  if (payload.releaseDueDate !== undefined)
    form.set("releaseDueDate", payload.releaseDueDate ?? "");
  if (payload.archived !== undefined)
    form.set("archived", payload.archived ? "true" : "false");
  return form;
};

//** ดึงรายการ Milestone/Version ของโปรเจ็กต์จาก Backlog
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project_id?: string }> }
) {
  try {
    const apiKeyFromEnvironment = process.env.BACKLOG_API_KEY;
    if (!apiKeyFromEnvironment) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_en: "BACKLOG_API_KEY is not configured",
          message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY",
        }),
        { status: 500 }
      );
    }

    const { project_id } = await params;
    const projectIdOrKey = project_id;
    if (!projectIdOrKey) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing projectId",
          message_th: "กรุณาระบุ projectId",
        }),
        { status: 400 }
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
        { status: 400 }
      );
    }

    const query: MilestoneListQuery = {};
    const includeArchived = requestUrl.searchParams.get("includeArchived");
    if (includeArchived !== null) {
      query.includeArchived = includeArchived;
    }

    let lastError: unknown;
    for (const domain of BACKLOG_DOMAINS) {
      try {
        const url = `https://${space}.${domain}/api/v2/projects/${projectIdOrKey}/versions`;
        const backlogResponse = await axios.get(url, {
          params: { apiKey: apiKeyFromEnvironment, ...query },
        });
        return NextResponse.json(
          successResponse({
            data: backlogResponse.data,
            message_en: "Fetch milestones successfully",
            message_th: "ดึงรายการ Milestone สำเร็จ",
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
      error?.response?.data || error?.message || "Fetch milestones failed";
    return NextResponse.json(
      errorResponse({
        status,
        message_en:
          typeof reason === "string" ? reason : "Fetch milestones failed",
        message_th: "ดึงรายการ Milestone ไม่สำเร็จ",
        error,
      }),
      { status }
    );
  }
}

//** เพิ่ม Milestone ใหม่ให้โปรเจ็กต์บน Backlog
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ project_id?: string }> }
) {
  try {
    const apiKeyFromEnvironment = process.env.BACKLOG_API_KEY;
    if (!apiKeyFromEnvironment) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_en: "BACKLOG_API_KEY is not configured",
          message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY",
        }),
        { status: 500 }
      );
    }

    const { project_id } = await params;
    const projectIdOrKey = project_id;
    if (!projectIdOrKey) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing projectId",
          message_th: "กรุณาระบุ projectId",
        }),
        { status: 400 }
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
        { status: 400 }
      );
    }

    const payload = (await request
      .json()
      .catch(() => ({}))) as Partial<MilestonePayload>;
    if (!payload.name) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing milestone name",
          message_th: "กรุณาระบุชื่อ Milestone",
        }),
        { status: 400 }
      );
    }

    const form = buildMilestoneForm(payload);

    let lastError: unknown;
    for (const domain of BACKLOG_DOMAINS) {
      try {
        const url = `https://${space}.${domain}/api/v2/projects/${projectIdOrKey}/versions`;
        const backlogResponse = await axios.post(url, form.toString(), {
          params: { apiKey: apiKeyFromEnvironment },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        return NextResponse.json(
          successResponse({
            data: backlogResponse.data,
            message_en: "Create milestone successfully",
            message_th: "สร้าง Milestone สำเร็จ",
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
      error?.response?.data || error?.message || "Create milestone failed";
    return NextResponse.json(
      errorResponse({
        status,
        message_en:
          typeof reason === "string" ? reason : "Create milestone failed",
        message_th: "สร้าง Milestone ไม่สำเร็จ",
        error,
      }),
      { status }
    );
  }
}
