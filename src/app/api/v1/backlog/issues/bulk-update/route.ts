import { errorResponse, successResponse } from "@/helpers/api/response";
import axios from "axios";
import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";

const DOMAINS = ["backlog.com", "backlogtool.com", "backlog.jp"] as const;

type BulkUpdateBody = {
  space?: string;
  issues?: Array<string | number>;
  updates?: {
    startDate?: string | null;
    summary?: string | null;
    description?: string | null;
    dueDate?: string | null;
    statusId?: number;
    priorityId?: number;
    milestoneId?: number | number[];
    categoryId?: number | number[];
  };
  entries?: Array<{
    issueKeyOrId: string | number;
    updates: {
      startDate?: string | null;
      dueDate?: string | null;
      statusId?: number;
      priorityId?: number;
      milestoneId?: number | number[];
      categoryId?: number | number[];
    };
  }>;
};

//** อัปเดต Issue เป็นกลุ่ม: รับ list ของ id/issueKey และ fields ที่ต้องการแก้
export async function POST(request: NextRequest) {
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

    const body = (await request.json().catch(() => ({}))) as BulkUpdateBody;

    const space = body.space;
    const issues = body.issues || [];
    const updates = body.updates || {};
    const entryOverrides = body.entries || [];

    if (!space || (!issues.length && !entryOverrides.length)) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing space or issues",
          message_th: "กรุณาระบุ space และรายการ issues",
        }),
        { status: 400 },
      );
    }

    // ตรวจสอบและเพิ่ม [สรุปด้วย LIGHT AI] ต่อท้าย summary
    const ensureAiPrefix = (summary: string | null | undefined): string => {
      if (!summary) return "";
      const hasAiPrefix = summary.includes("AI");
      return hasAiPrefix ? summary : summary + " " + "[สรุปด้วย LIGHT AI]";
    };

    // เตรียมฟอร์มข้อมูลที่จะส่งให้ Backlog (x-www-form-urlencoded)
    const buildForm = (updateSet: BulkUpdateBody["updates"]) => {
      const form = new URLSearchParams();
      if (!updateSet) return form;
      if (updateSet.startDate !== undefined)
        form.set("startDate", updateSet.startDate ?? "");
      if (updateSet.summary !== undefined)
        form.set("summary", ensureAiPrefix(updateSet.summary));
      if (updateSet.description !== undefined)
        form.set("description", updateSet.description ?? "");
      if (updateSet.dueDate !== undefined)
        form.set("dueDate", updateSet.dueDate ?? "");
      if (updateSet.statusId !== undefined)
        form.set("statusId", String(updateSet.statusId));
      if (updateSet.priorityId !== undefined)
        form.set("priorityId", String(updateSet.priorityId));
      if (updateSet.milestoneId !== undefined) {
        const milestoneValues = Array.isArray(updateSet.milestoneId)
          ? updateSet.milestoneId
          : [updateSet.milestoneId];
        if (!milestoneValues.length) {
          form.append("milestoneId[]", "");
        } else {
          for (const milestoneId of milestoneValues) {
            form.append("milestoneId[]", String(milestoneId));
          }
        }
      }
      if (updateSet.categoryId !== undefined) {
        const categoryValues = Array.isArray(updateSet.categoryId)
          ? updateSet.categoryId
          : [updateSet.categoryId];
        if (!categoryValues.length) {
          form.append("categoryId[]", "");
        } else {
          for (const categoryId of categoryValues) {
            form.append("categoryId[]", String(categoryId));
          }
        }
      }
      return form;
    };

    const results: {
      success: Array<string | number>;
      failed: Array<{ issue: string | number; reason: any }>;
    } = {
      success: [],
      failed: [],
    };
    const workItems = entryOverrides.length
      ? entryOverrides.map((entry) => ({
          issueKeyOrId: entry.issueKeyOrId,
          form: buildForm(entry.updates),
        }))
      : issues.map((issueKeyOrId) => ({
          issueKeyOrId,
          form: buildForm(updates),
        }));

    for (const { issueKeyOrId, form } of workItems) {
      let done = false;
      let lastError: any;

      // --- Auto Fill Logic for Bulk Update ---
      try {
        let currentIssue: any = null;
        let activeDomain = DOMAINS[0];

        // Fetch current issue details
        for (const domain of DOMAINS) {
          try {
            const url = `https://${space}.${domain}/api/v2/issues/${issueKeyOrId}`;
            const resp = await axios.get(url, { params: { apiKey } });
            currentIssue = resp.data;
            activeDomain = domain;
            break;
          } catch (e) {
            // continue
          }
        }

        if (currentIssue) {
          // 1. Start Date (Today) if empty AND not in form
          if (!currentIssue.startDate && !form.has("startDate")) {
            form.set("startDate", dayjs().format("YYYY-MM-DD"));
          }
          // 2. Due Date (Today + 4) if empty AND not in form
          if (!currentIssue.dueDate && !form.has("dueDate")) {
            form.set("dueDate", dayjs().add(4, "day").format("YYYY-MM-DD"));
          }
          // 3. Estimated Hours (2) if empty AND not in form
          if (
            (currentIssue.estimatedHours === null ||
              currentIssue.estimatedHours === undefined) &&
            !form.has("estimatedHours")
          ) {
            form.set("estimatedHours", "2");
          }
          // 4. Milestone/Version if empty AND not in form
          if (
            (!currentIssue.milestone || currentIssue.milestone.length === 0) &&
            !form.has("milestoneId[]")
          ) {
            try {
              const projectId = currentIssue.projectId;
              const versionsUrl = `https://${space}.${activeDomain}/api/v2/projects/${projectId}/versions`;
              const vResp = await axios.get(versionsUrl, {
                params: { apiKey },
              });
              const versions = vResp.data;
              if (versions && versions.length > 0) {
                const latest = versions[versions.length - 1];
                form.append("milestoneId[]", String(latest.id));
              }
            } catch (e) {
              /* ignore */
            }
          }
        }
      } catch (err) {
        console.error(`Auto-fill failed for ${issueKeyOrId}:`, err);
      }

      for (const domain of DOMAINS) {
        try {
          const url = `https://${space}.${domain}/api/v2/issues/${issueKeyOrId}`;
          const response = await axios.patch(url, form.toString(), {
            params: { apiKey },
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            validateStatus: () => true,
          });
          if (response.status >= 200 && response.status < 300) {
            results.success.push(issueKeyOrId);
            done = true;
            break;
          }
          lastError = response.data;
        } catch (error: any) {
          lastError = error?.message || error;
        }
      }
      if (!done)
        results.failed.push({ issue: issueKeyOrId, reason: lastError });
    }

    return NextResponse.json(
      successResponse({
        data: results,
        message_en: "Bulk update finished",
        message_th: "อัปเดตแบบกลุ่มเสร็จสิ้น",
      }),
    );
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const reason =
      error?.response?.data || error?.message || "Bulk update failed";
    return NextResponse.json(
      errorResponse({
        status,
        message_en: typeof reason === "string" ? reason : "Bulk update failed",
        message_th: "อัปเดตแบบกลุ่มไม่สำเร็จ",
        error,
      }),
      { status },
    );
  }
}
