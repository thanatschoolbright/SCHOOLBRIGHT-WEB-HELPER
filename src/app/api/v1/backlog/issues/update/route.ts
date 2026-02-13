import { errorResponse, successResponse } from "@/helpers/api/response";
import axios from "axios";
import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";

const DOMAINS = ["backlog.com", "backlogtool.com", "backlog.jp"] as const;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.BACKLOG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_en: "BACKLOG_API_KEY is not configured",
          message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY",
        }),
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { space, issueKeyOrId, description, summary } = body as {
      space?: string;
      issueKeyOrId?: string | number;
      description?: string;
      summary?: string;
    };

    if (
      !space ||
      !issueKeyOrId ||
      typeof description !== "string" ||
      typeof summary !== "string"
    ) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing space/issueKeyOrId/description",
          message_th: "กรุณาระบุ space, issueKeyOrId และ description",
        }),
        { status: 400 },
      );
    }

    // --- Auto Fill Logic ---
    // 1. Fetch current issue details to check for empty fields
    let currentIssue: any = null;
    let fallbackDomain = DOMAINS[0];

    for (const domain of DOMAINS) {
      try {
        const url = `https://${space}.${domain}/api/v2/issues/${issueKeyOrId}`;
        const resp = await axios.get(url, { params: { apiKey } });
        currentIssue = resp.data;
        fallbackDomain = domain;
        break;
      } catch (e) {
        // continue
      }
    }

    if (!currentIssue) {
      throw new Error("Could not fetch current issue details");
    }

    const form = new URLSearchParams();
    form.set("description", description);
    form.set("summary", summary);

    // 2. Auto Fill Start Date (Today) if empty
    if (!currentIssue.startDate) {
      form.set("startDate", dayjs().format("YYYY-MM-DD"));
    }

    // 3. Auto Fill Due Date (Today + 4) if empty
    if (!currentIssue.dueDate) {
      form.set("dueDate", dayjs().add(4, "day").format("YYYY-MM-DD"));
    }

    // 4. Auto Fill Estimated Hours (2) if empty
    if (
      currentIssue.estimatedHours === null ||
      currentIssue.estimatedHours === undefined
    ) {
      form.set("estimatedHours", "2");
    }

    // 5. Auto Fill Milestone/Version if empty
    if (!currentIssue.milestone || currentIssue.milestone.length === 0) {
      try {
        const projectId = currentIssue.projectId;
        const versionsUrl = `https://${space}.${fallbackDomain}/api/v2/projects/${projectId}/versions`;
        const versionsResp = await axios.get(versionsUrl, {
          params: { apiKey },
        });
        const versions = versionsResp.data;
        if (versions && versions.length > 0) {
          // Pick the latest version (usually the last one in the list)
          const latestVersion = versions[versions.length - 1];
          form.append("milestoneId[]", String(latestVersion.id));
        }
      } catch (e) {
        console.error("Failed to auto-fill milestone:", e);
      }
    }

    let lastError: any;
    for (const domain of DOMAINS) {
      try {
        const url = `https://${space}.${domain}/api/v2/issues/${issueKeyOrId}`;
        const resp = await axios.patch(url, form.toString(), {
          params: { apiKey },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        return NextResponse.json(
          successResponse({
            data: resp.data,
            message_en: "Update issue ok",
            message_th: "อัปเดต Issue สำเร็จ",
          }),
        );
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError;
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const reason =
      error?.response?.data || error?.message || "Update issue failed";
    return NextResponse.json(
      errorResponse({
        status,
        message_en: typeof reason === "string" ? reason : "Update issue failed",
        message_th: "อัปเดต Issue ไม่สำเร็จ",
        error,
      }),
      { status },
    );
  }
}
