import { errorResponse, successResponse } from "@/helpers/api/response";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

/**
 * API สำหรับดึงข้อมูลวิเคราะห์งาน (Dashboard Analytics)
 * เป้าหมาย: ติดตามงานตามรายคน (Assignee) ในช่วงเวลาที่กำหนด
 * รองรับตัวกรอง: projectId, issueTypeId, priorityId, statusId, assigneeId
 */

const BACKLOG_DOMAIN = "backlog.com";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const space = searchParams.get("space") || "jabjai";
    const apiKey = process.env.BACKLOG_API_KEY;
    const createdSince = searchParams.get("createdSince");
    const createdUntil = searchParams.get("createdUntil");

    // Filter params (รองรับหลายค่าด้วย [] notation)
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

    // 1. ดึงรายการงาน (Issues) ทั้งหมดตามเงื่อนไข
    const issuesUrl = `https://${space}.${BACKLOG_DOMAIN}/api/v2/issues`;
    const params: Record<string, any> = {
      apiKey,
      count: 100,
    };

    if (createdSince) params.createdSince = createdSince;
    if (createdUntil) params.createdUntil = createdUntil;

    // ส่ง array params ไปยัง Backlog API ในรูปแบบ key[]
    if (projectIds.length > 0) params["projectId[]"] = projectIds;
    if (issueTypeIds.length > 0) params["issueTypeId[]"] = issueTypeIds;
    if (priorityIds.length > 0) params["priorityId[]"] = priorityIds;
    if (statusIds.length > 0) params["statusId[]"] = statusIds;
    if (assigneeIds.length > 0) params["assigneeId[]"] = assigneeIds;

    const response = await axios.get(issuesUrl, {
      params,
      paramsSerializer: (p) => {
        // serialize array params correctly for Backlog API
        const parts: string[] = [];
        for (const [key, value] of Object.entries(p)) {
          if (Array.isArray(value)) {
            value.forEach((v) => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
          } else if (value !== undefined && value !== null) {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
          }
        }
        return parts.join("&");
      },
    });
    const issues = response.data || [];

    // 2. ประมวลผลข้อมูลทางสถิติ (Analytics Logic)
    const analytics: Record<string, any> = {};

    issues.forEach((issue: any) => {
      const assigneeName = issue.assignee?.name || "ยังไม่ได้ระบุ";
      const assigneeId = issue.assignee?.id || 0;
      const statusName = issue.status?.name || "Unknown";

      if (!analytics[assigneeId]) {
        analytics[assigneeId] = {
          id: assigneeId,
          name: assigneeName,
          total: 0,
          closed: 0,
          open: 0,
          in_progress: 0,
          efficiency: 0,
          avatarUrl: issue.assignee?.nulabAccount?.iconUrl || "",
          issues: [],
        };
      }

      analytics[assigneeId].total += 1;

      const isClosed =
        statusName.toLowerCase().includes("closed") ||
        statusName.toLowerCase().includes("สำเร็จ") ||
        statusName.toLowerCase().includes("เสร็จ");

      if (isClosed) {
        analytics[assigneeId].closed += 1;
      } else {
        analytics[assigneeId].issues.push({
          key: issue.issueKey,
          summary: issue.summary,
          status: statusName,
          issueType: issue.issueType?.name || "",
          priority: issue.priority?.name || "",
        });

        if (
          statusName.toLowerCase().includes("processing") ||
          statusName.toLowerCase().includes("ดำเนินการ")
        ) {
          analytics[assigneeId].in_progress += 1;
        } else {
          analytics[assigneeId].open += 1;
        }
      }
    });

    // 3. คำนวณประสิทธิภาพ (Efficiency: Closed / Total %)
    const result = Object.values(analytics)
      .map((item: any) => {
        const efficiency =
          item.total > 0 ? Math.round((item.closed / item.total) * 100) : 0;

        const pendingCount = item.total - item.closed;
        const loadValue =
          efficiency > 0
            ? Math.round(pendingCount / (efficiency / 100))
            : pendingCount * 2;

        return {
          ...item,
          efficiency,
          active_tasks: item.in_progress,
          pending_tasks: pendingCount,
          load_value: loadValue,
          capacity_status:
            loadValue > 20 ? "งานล้นมือ" : loadValue > 10 ? "ปกติ" : "งานน้อย",
        };
      })
      .sort((a, b) => b.total - a.total);

    return NextResponse.json(
      successResponse({
        data: result,
        message_th: "ดึงข้อมูลวิเคราะห์งานสำเร็จ",
      }),
    );
  } catch (error: any) {
    console.error("Dashboard Analytics Error:", error);
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการประมวลผลข้อมูล Dashboard",
        message_en: error.message,
      }),
      { status: 500 },
    );
  }
}
