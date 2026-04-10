import { errorResponse, successResponse } from "@/helpers/api/response";
import { NextRequest, NextResponse } from "next/server";
import { reAssignIssueService } from "./service/re-assign-service";
import { reAssignSchema } from "./validation/re-assign-schema";

// เปลี่ยนผู้รับผิดชอบงาน (Quick Re-assign) ผ่าน Backlog PATCH /api/v2/issues/:issueIdOrKey
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = reAssignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_th: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
          message_en: parsed.error.issues[0]?.message ?? "Validation error",
        }),
        { status: 400 },
      );
    }

    const updatedIssue = await reAssignIssueService(parsed.data);

    return NextResponse.json(
      successResponse({
        data: {
          issue_key: updatedIssue.issueKey,
          summary: updatedIssue.summary,
          assignee: {
            id: updatedIssue.assignee?.id ?? null,
            name: updatedIssue.assignee?.name ?? null,
          },
        },
        message_th: `มอบหมายงาน ${updatedIssue.issueKey} ให้ ${
          updatedIssue.assignee?.name ?? "-"
        } สำเร็จ`,
        message_en: `Issue ${updatedIssue.issueKey} reassigned successfully`,
      }),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Re-assign Issue Error:", error);
    return NextResponse.json(
      errorResponse({
        status: 500,
        message_th: "เกิดข้อผิดพลาดในการเปลี่ยนผู้รับผิดชอบงาน",
        message_en: message,
      }),
      { status: 500 },
    );
  }
}
