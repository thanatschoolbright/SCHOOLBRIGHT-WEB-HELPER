import { errorResponse, successResponse } from "@/helpers/api/response";
import axios from "axios";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { NextRequest, NextResponse } from "next/server";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * API สำหรับคำนวณ Workload Heatmap รายคน × รายวัน
 * นับจำนวน Issue ที่ยังค้างอยู่ (ยังไม่ปิด) ต่อพนักงานต่อวัน
 * โดยใช้ช่วงวันที่สร้าง (createdSince-createdUntil) เป็น axis X
 */

const BACKLOG_DOMAIN = "backlog.com";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const space = searchParams.get("space") || "jabjai";
    const apiKey = process.env.BACKLOG_API_KEY;
    const createdSince = searchParams.get("createdSince");
    const createdUntil = searchParams.get("createdUntil");

    const projectIds = searchParams.getAll("projectId[]");
    const issueTypeIds = searchParams.getAll("issueTypeId[]");
    const priorityIds = searchParams.getAll("priorityId[]");
    const statusIds = searchParams.getAll("statusId[]");
    const assigneeIds = searchParams.getAll("assigneeId[]");

    if (!apiKey) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY ใน Environment",
        }),
        { status: 500 },
      );
    }

    // 1. ดึง Issue ทั้งหมดจาก Backlog
    const issuesUrl = `https://${space}.${BACKLOG_DOMAIN}/api/v2/issues`;
    const params: Record<string, unknown> = { apiKey, count: 100 };

    if (createdSince) params.createdSince = createdSince;
    if (createdUntil) params.createdUntil = createdUntil;
    if (projectIds.length > 0) params["projectId[]"] = projectIds;
    if (issueTypeIds.length > 0) params["issueTypeId[]"] = issueTypeIds;
    if (priorityIds.length > 0) params["priorityId[]"] = priorityIds;
    if (statusIds.length > 0) params["statusId[]"] = statusIds;
    if (assigneeIds.length > 0) params["assigneeId[]"] = assigneeIds;

    const response = await axios.get(issuesUrl, {
      params,
      paramsSerializer: (p) => {
        const parts: string[] = [];
        for (const [key, value] of Object.entries(p)) {
          if (Array.isArray(value)) {
            value.forEach((v) =>
              parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`),
            );
          } else if (value !== undefined && value !== null) {
            parts.push(
              `${encodeURIComponent(key)}=${encodeURIComponent(
                value as string,
              )}`,
            );
          }
        }
        return parts.join("&");
      },
    });

    const issues: Record<string, unknown>[] = response.data || [];

    if (issues.length === 0) {
      return NextResponse.json(
        successResponse({
          data: { dates: [], assignees: [], matrix: [] },
          message_th: "ไม่พบข้อมูลงานในช่วงเวลาที่เลือก",
        }),
      );
    }

    // 2. สร้าง date axis จาก createdSince → createdUntil
    const start = dayjs(
      createdSince ??
        (issues[issues.length - 1] as { created: string }).created,
    );
    const end = dayjs(
      createdUntil ?? (issues[0] as { created: string }).created,
    );

    const dates: string[] = [];
    let cursor = start.clone();
    while (cursor.isSameOrBefore(end, "day")) {
      dates.push(cursor.format("YYYY-MM-DD"));
      cursor = cursor.add(1, "day");
    }

    // 3. รวบรวมรายชื่อพนักงาน (assignee axis)
    const assigneeMap = new Map<number, string>();
    issues.forEach((issue) => {
      const assignee = issue.assignee as { id: number; name: string } | null;
      if (assignee) {
        assigneeMap.set(assignee.id, assignee.name);
      } else {
        assigneeMap.set(0, "ยังไม่ได้ระบุ");
      }
    });

    const assignees = Array.from(assigneeMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));

    // 4. สร้าง matrix[assigneeId][date] = จำนวน issue ที่ยังค้างอยู่ถึงวันนั้น
    // issue "ค้างอยู่" คือ: created ≤ date และ (ยังไม่ปิด หรือ updated > date)
    const matrix: {
      assignee_id: number;
      date: string;
      count: number;
      issue_keys: string[];
    }[] = [];

    for (const assigneeEntry of assignees) {
      for (const date of dates) {
        const dayEnd = dayjs(date).endOf("day");

        const pendingIssues = issues.filter((issue) => {
          const assignee = issue.assignee as { id: number } | null;
          const issueAssigneeId = assignee?.id ?? 0;
          if (issueAssigneeId !== assigneeEntry.id) return false;

          const created = dayjs(issue.created as string);
          if (created.isAfter(dayEnd, "day")) return false;

          const statusName = (
            (issue.status as { name: string })?.name ?? ""
          ).toLowerCase();
          const isClosed =
            statusName.includes("closed") ||
            statusName.includes("สำเร็จ") ||
            statusName.includes("เสร็จ");

          if (!isClosed) return true;

          // ปิดแล้ว แต่ปิดหลังวันนี้ → ยังนับว่าค้างในวันนั้น
          const updated = dayjs(issue.updated as string);
          return updated.isAfter(dayEnd, "day");
        });

        matrix.push({
          assignee_id: assigneeEntry.id,
          date,
          count: pendingIssues.length,
          issue_keys: pendingIssues.map((i) => i.issueKey as string),
        });
      }
    }

    return NextResponse.json(
      successResponse({
        data: { dates, assignees, matrix },
        message_th: "ดึงข้อมูล Workload Heatmap สำเร็จ",
      }),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Workload Heatmap Error:", error);
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการคำนวณ Workload Heatmap",
        message_en: message,
      }),
      { status: 500 },
    );
  }
}
