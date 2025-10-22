import axios from "axios"
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/helpers/api/response";

const DOMAINS = ["backlog.com", "backlogtool.com", "backlog.jp"] as const;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.BACKLOG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        errorResponse({ status: 500, message_en: "BACKLOG_API_KEY is not configured", message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY" }),
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { space, issueKeyOrId, description , summary } = body as {
      space?: string;
      issueKeyOrId?: string | number;
      description?: string;
      summary?: string;
    };

    if (!space || !issueKeyOrId || typeof description !== "string" || typeof summary !== "string") {
      return NextResponse.json(
        errorResponse({ status: 400, message_en: "Missing space/issueKeyOrId/description", message_th: "กรุณาระบุ space, issueKeyOrId และ description" }),
        { status: 400 }
      );
    }

    // Build form params (Backlog expects x-www-form-urlencoded) and apiKey via query
    const form = new URLSearchParams();
    form.set("description", description);
    form.set("summary", summary);

    let lastError: any;
    for (const domain of DOMAINS) {
      try {
        const url = `https://${space}.${domain}/api/v2/issues/${issueKeyOrId}`;
        const resp = await axios.patch(url, form.toString(), {
          params: { apiKey },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        return NextResponse.json(
          successResponse({ data: resp.data, message_en: "Update issue ok", message_th: "อัปเดต Issue สำเร็จ" })
        );
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError;
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const reason = error?.response?.data || error?.message || "Update issue failed";
    return NextResponse.json(
      errorResponse({ status, message_en: typeof reason === "string" ? reason : "Update issue failed", message_th: "อัปเดต Issue ไม่สำเร็จ", error }),
      { status }
    );
  }
}
