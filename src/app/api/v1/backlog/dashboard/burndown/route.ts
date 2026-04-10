import { errorResponse, successResponse } from "@/helpers/api/response";
import axios from "axios";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isoWeek from "dayjs/plugin/isoWeek";
import { NextRequest, NextResponse } from "next/server";

dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * API สำหรับคำนวณ Burndown Chart และ Velocity รายสัปดาห์
 * ดึง Issue จาก Backlog แล้วแบ่งตาม week_start เพื่อคำนวณงานคงเหลือและงานที่ปิดได้
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
    const totalIssues = issues.length;

    if (totalIssues === 0) {
      return NextResponse.json(
        successResponse({
          data: { total_issues: 0, points: [] },
          message_th: "ไม่พบข้อมูลงานในช่วงเวลาที่เลือก",
        }),
      );
    }

    // 2. สร้าง Week buckets จาก createdSince → createdUntil (หรือจาก issue จริง)
    const startDate = createdSince
      ? dayjs(createdSince).startOf("isoWeek")
      : dayjs(
          (issues[issues.length - 1] as { created: string }).created,
        ).startOf("isoWeek");

    const endDate = createdUntil
      ? dayjs(createdUntil).endOf("isoWeek")
      : dayjs((issues[0] as { created: string }).created).endOf("isoWeek");

    // สร้างรายการสัปดาห์ทั้งหมดในช่วงเวลา
    const weeks: { weekStart: dayjs.Dayjs; weekEnd: dayjs.Dayjs }[] = [];
    let cursor = startDate.clone();
    while (cursor.isSameOrBefore(endDate, "day")) {
      weeks.push({
        weekStart: cursor.clone(),
        weekEnd: cursor.endOf("isoWeek"),
      });
      cursor = cursor.add(1, "week");
    }

    // 3. คำนวณ Burndown และ Velocity ต่อสัปดาห์
    const points = weeks.map((week, index) => {
      // งานที่เกิดขึ้นก่อนหรือภายใน week นี้
      const cumulativeIssues = issues.filter((issue) => {
        const created = dayjs(issue.created as string);
        return created.isSameOrBefore(week.weekEnd, "day");
      });

      // งานที่ปิดแล้วภายใน week นี้ (เปรียบเทียบ updatedAt ≤ weekEnd)
      const closedInWeek = cumulativeIssues.filter((issue) => {
        const statusName =
          (issue.status as { name: string })?.name?.toLowerCase() ?? "";
        const isClosed =
          statusName.includes("closed") ||
          statusName.includes("สำเร็จ") ||
          statusName.includes("เสร็จ");
        if (!isClosed) return false;
        const updated = dayjs(issue.updated as string);
        return updated.isSameOrBefore(week.weekEnd, "day");
      });

      const actualRemaining = cumulativeIssues.length - closedInWeek.length;

      // Ideal burndown: ลดเท่ากันทุกสัปดาห์
      const idealRemaining =
        totalIssues - Math.round((totalIssues / weeks.length) * (index + 1));

      // Velocity = จำนวนงานที่ปิดได้ในสัปดาห์นี้ (ไม่สะสม)
      const velocity = closedInWeek.filter((issue) => {
        const updated = dayjs(issue.updated as string);
        return updated.isSameOrAfter(week.weekStart, "day");
      }).length;

      return {
        week_label: `สัปดาห์ที่ ${index + 1} (${week.weekStart.format(
          "DD/MM",
        )} - ${week.weekEnd.format("DD/MM")})`,
        week_start: week.weekStart.format("YYYY-MM-DD"),
        week_end: week.weekEnd.format("YYYY-MM-DD"),
        ideal_remaining: Math.max(0, idealRemaining),
        actual_remaining: Math.max(0, actualRemaining),
        velocity,
      };
    });

    return NextResponse.json(
      successResponse({
        data: { total_issues: totalIssues, points },
        message_th: "ดึงข้อมูล Burndown Chart สำเร็จ",
      }),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Burndown Chart Error:", error);
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการคำนวณ Burndown Chart",
        message_en: message,
      }),
      { status: 500 },
    );
  }
}
