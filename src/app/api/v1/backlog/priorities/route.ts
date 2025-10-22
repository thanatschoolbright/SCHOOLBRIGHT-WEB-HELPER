import axios from "axios"
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/helpers/api/response";

const DOMAINS = ["backlog.com", "backlogtool.com", "backlog.jp"] as const;

export async function GET(req: NextRequest) {
  try {
    const apiKey =
      process.env.BACKLOG_API_KEY || new URL(req.url).searchParams.get("apiKey") || undefined;
    if (!apiKey) {
      return NextResponse.json(
        errorResponse({ status: 500, message_en: "BACKLOG_API_KEY is not configured", message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY" }),
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const space = searchParams.get("space");
    if (!space) {
      return NextResponse.json(
        errorResponse({ status: 400, message_en: "Missing space", message_th: "กรุณาระบุ space" }),
        { status: 400 }
      );
    }

    let lastError: any;
    for (const domain of DOMAINS) {
      try {
        const url = `https://${space}.${domain}/api/v2/priorities`;
        const { data } = await axios.get(url, { params: { apiKey } });
        return NextResponse.json(
          successResponse({ data, message_en: "Fetch priorities ok", message_th: "ดึงลำดับความสำคัญสำเร็จ" })
        );
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError;
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const reason = error?.response?.data || error?.message || "Fetch priorities failed";
    return NextResponse.json(
      errorResponse({ status, message_en: typeof reason === "string" ? reason : "Fetch priorities failed", message_th: "ดึงลำดับความสำคัญไม่สำเร็จ", error }),
      { status }
    );
  }
}
