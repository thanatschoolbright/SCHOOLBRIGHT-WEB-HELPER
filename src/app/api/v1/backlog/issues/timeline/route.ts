import { errorResponse, successResponse } from "@/helpers/api/response";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

/**
 * [Backend API]
 * API สำหรับดึง Timeline การส่งต่องาน (Tracking Issue Assignment)
 * ดึงข้อมูลจาก Backlog Comment List API และกรองเฉพาะเหตุการณ์ที่มีการเปลี่ยน Assignee
 */

const BACKLOG_DOMAIN = "backlog.com";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const space = searchParams.get("space") || "jabjai";
    const issueIdOrKey = searchParams.get("issueIdOrKey");
    const apiKey = process.env.BACKLOG_API_KEY;

    if (!issueIdOrKey) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_th: "กรุณาระบุ issueIdOrKey",
        }),
        { status: 400 },
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY ใน Environment",
        }),
        { status: 500 },
      );
    }

    // 1. ดึงข้อมูล Comment ทั้งหมดของ Issue เพื่อแกะ History
    const commentsUrl = `https://${space}.${BACKLOG_DOMAIN}/api/v2/issues/${issueIdOrKey}/comments`;
    const response = await axios.get(commentsUrl, {
      params: { apiKey, count: 100, order: "asc" },
    });

    const comments = response.data || [];
    console.log(`[Timeline Debug] Total comments found for ${issueIdOrKey}:`, comments.length);

    const timeline_events: any[] = [];

    // 2. วนลูปหา Change Log ที่มีการเปลี่ยน Assignee
    comments.forEach((comment: any, index: number) => {
      if (comment.changeLog && comment.changeLog.length > 0) {
        console.log(`[Timeline Debug] Comment #${index} has ${comment.changeLog.length} changes`);
        
        comment.changeLog.forEach((log: any) => {
          console.log(`[Timeline Debug] Log field: ${log.field}, from: ${log.originalValue}, to: ${log.newValue}`);
          
          // ตรวจสอบว่าเป็นเหตุการณ์เปลี่ยนผู้รับผิดชอบ (assignee)
          if (log.field === "assignee") {
            console.log(">>> [Timeline Debug] Found Assignee change!");
            timeline_events.push({
              id: comment.id,
              created_at: comment.created,
              updated_by: {
                id: comment.createdUser.id,
                name: comment.createdUser.name,
                avatar_url: comment.createdUser.nulabAccount?.iconUrl || "",
              },
              from_user: log.originalValue || "ไม่มี",
              to_user: log.newValue || "ไม่มี",
              content: comment.content || "ไม่มีข้อความเพิ่มเติม",
            });
          }
        });
      }
    });

    return NextResponse.json(
      successResponse({
        status_code: 200,
        message_th: "ดึงข้อมูล Timeline สำเร็จ",
        data: {
          issue_key: issueIdOrKey,
          timeline: timeline_events,
        },
      }),
    );
  } catch (error: any) {
    console.error(
      "[Timeline API Error]:",
      error?.response?.data || error.message,
    );
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูล Timeline",
        message_en: error.message,
      }),
      { status: 500 },
    );
  }
}
