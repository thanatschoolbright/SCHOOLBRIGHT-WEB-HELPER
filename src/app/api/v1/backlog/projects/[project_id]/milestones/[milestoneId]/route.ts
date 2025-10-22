import { NextRequest, NextResponse } from "next/server";
import axios from "axios"
import { successResponse, errorResponse } from "@/helpers/api/response";

const BACKLOG_DOMAINS = [
  "backlog.com",
  "backlogtool.com",
  "backlog.jp",
] as const;

type RouteParams = {
  projectId: string;
  milestoneId: string;
};

type UpdateMilestonePayload = {
  name?: string;
  description?: string;
  startDate?: string | null;
  releaseDueDate?: string | null;
  archived?: boolean;
};

const buildMilestoneForm = (payload: UpdateMilestonePayload) => {
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

//** แก้ไขรายละเอียด Milestone บน Backlog
export async function PATCH(request: NextRequest, context: any) {
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

    const params = context.params as { projectId: string; milestoneId: string };
    const { projectId, milestoneId } = params;
    if (!projectId || !milestoneId) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing projectId or milestoneId",
          message_th: "กรุณาระบุ projectId และ milestoneId",
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
      .catch(() => ({}))) as UpdateMilestonePayload;
    if (!Object.keys(payload).length) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing fields for update",
          message_th: "กรุณาระบุข้อมูลที่ต้องการแก้ไข",
        }),
        { status: 400 }
      );
    }

    const form = buildMilestoneForm(payload);

    let lastError: unknown;
    for (const domain of BACKLOG_DOMAINS) {
      try {
        const url = `https://${space}.${domain}/api/v2/projects/${projectId}/versions/${milestoneId}`;
        const backlogResponse = await axios.patch(url, form.toString(), {
          params: { apiKey: apiKeyFromEnvironment },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        return NextResponse.json(
          successResponse({
            data: backlogResponse.data,
            message_en: "Update milestone successfully",
            message_th: "อัปเดต Milestone สำเร็จ",
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
      error?.response?.data || error?.message || "Update milestone failed";
    return NextResponse.json(
      errorResponse({
        status,
        message_en:
          typeof reason === "string" ? reason : "Update milestone failed",
        message_th: "อัปเดต Milestone ไม่สำเร็จ",
        error,
      }),
      { status }
    );
  }
}

//** ลบ Milestone ออกจาก Backlog
export async function DELETE(request: NextRequest, context: any) {
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

    const params = context.params as { projectId: string; milestoneId: string };
    const { projectId, milestoneId } = params;
    if (!projectId || !milestoneId) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing projectId or milestoneId",
          message_th: "กรุณาระบุ projectId และ milestoneId",
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

    let lastError: unknown;
    for (const domain of BACKLOG_DOMAINS) {
      try {
        const url = `https://${space}.${domain}/api/v2/projects/${projectId}/versions/${milestoneId}`;
        await axios.delete(url, {
          params: { apiKey: apiKeyFromEnvironment },
        });
        return NextResponse.json(
          successResponse({
            data: { id: milestoneId },
            message_en: "Delete milestone successfully",
            message_th: "ลบ Milestone สำเร็จ",
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
      error?.response?.data || error?.message || "Delete milestone failed";
    return NextResponse.json(
      errorResponse({
        status,
        message_en:
          typeof reason === "string" ? reason : "Delete milestone failed",
        message_th: "ลบ Milestone ไม่สำเร็จ",
        error,
      }),
      { status }
    );
  }
}
