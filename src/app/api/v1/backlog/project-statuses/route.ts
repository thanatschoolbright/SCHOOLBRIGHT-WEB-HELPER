import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/helpers/api/response";

const DOMAINS = ["backlog.com", "backlogtool.com", "backlog.jp"] as const;

//** ดึงรายการ Status ของโปรเจ็กต์ (ตามเอกสาร /api/v2/projects/{projectId}/statuses)
export async function GET(request: NextRequest) {
  try {
    const apiKey =
      process.env.BACKLOG_API_KEY || new URL(request.url).searchParams.get("apiKey") || undefined;
    if (!apiKey) {
      return NextResponse.json(
        errorResponse({ status: 500, message_en: "BACKLOG_API_KEY is not configured", message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY" }),
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const space = searchParams.get("space");
    const projectId = searchParams.get("projectId");
    if (!space || !projectId) {
      return NextResponse.json(
        errorResponse({ status: 400, message_en: "Missing space or projectId", message_th: "กรุณาระบุ space และ projectId" }),
        { status: 400 }
      );
    }

    let lastError: any;
    for (const domain of DOMAINS) {
      try {
        const url = `https://${space}.${domain}/api/v2/projects/${projectId}/statuses`;
        const response = await axios.get(url, { params: { apiKey } });
        return NextResponse.json(
          successResponse({ data: response.data, message_en: "Fetch project statuses ok", message_th: "ดึงสถานะของโปรเจ็กต์สำเร็จ" })
        );
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const reason = error?.response?.data || error?.message || "Fetch project statuses failed";
    return NextResponse.json(
      errorResponse({ status, message_en: typeof reason === "string" ? reason : "Fetch project statuses failed", message_th: "ดึงสถานะของโปรเจ็กต์ไม่สำเร็จ", error }),
      { status }
    );
  }
}
