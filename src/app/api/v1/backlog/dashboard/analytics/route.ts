import { errorResponse, successResponse } from "@/helpers/api/response";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

/**
 * API สำหรับดึงข้อมูลวิเคราะห์งาน (Dashboard Analytics)
 * เป้าหมาย: ติดตามงานตามรายคน (Assignee) ในช่วงเวลาที่กำหนด
 */

const BACKLOG_DOMAIN = "backlog.com";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const space = searchParams.get("space") || "jabjai";
    const apiKey = process.env.BACKLOG_API_KEY;
    const createdSince = searchParams.get("createdSince");
    const createdUntil = searchParams.get("createdUntil");
    const projectId = searchParams.get("projectId");

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
    // หมายเหตุ: Backlog API ดึงได้สูงสุด 100 รายการต่อครั้ง หากต้องการมากกว่านี้ต้องทำ Pagination
    const issuesUrl = `https://${space}.${BACKLOG_DOMAIN}/api/v2/issues`;
    const params: any = {
      apiKey,
      count: 100, // ดึงเบื้องต้น 100 รายการ
    };

    if (createdSince) params.createdSince = createdSince;
    if (createdUntil) params.createdUntil = createdUntil;
    if (projectId) params["projectId[]"] = projectId;

    const response = await axios.get(issuesUrl, { params });
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

      // ตรวจสอบสถานะงาน (Closed/Finished)
      const isClosed =
        statusName.toLowerCase().includes("closed") ||
        statusName.toLowerCase().includes("สำเร็จ") ||
        statusName.toLowerCase().includes("เสร็จ");

      if (isClosed) {
        analytics[assigneeId].closed += 1;
      } else {
        // เก็บเฉพาะงานที่ยังไม่เสร็จ (Pending) ลงใน list เพื่อใช้ในตัวกรอง
        analytics[assigneeId].issues.push({
          key: issue.issueKey,
          summary: issue.summary,
          status: statusName,
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
      .map((item: any) => ({
        ...item,
        efficiency:
          item.total > 0 ? Math.round((item.closed / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total); // เรียงตามปริมาณงานเยอะที่สุด

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
