import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/helpers/api/response";

//** ดึงรายการ Projects ทั้งหมดจาก Backlog ด้วย access_token ที่เก็บใน cookie
export async function GET(req: NextRequest) {
  try {
    // ใช้ API Key ตามเอกสาร Backlog (พารามิเตอร์ apiKey)
    // อ่าน API Key จาก env หรือตัวเลือกเสริมผ่าน query (?apiKey=...) เพื่อความสะดวกในการทดสอบ
    const apiKey =
      process.env.BACKLOG_API_KEY || new URL(req.url).searchParams.get("apiKey") || undefined;
    if (!apiKey) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_en: "BACKLOG_API_KEY is not configured",
          message_th: "ยังไม่ได้ตั้งค่า BACKLOG_API_KEY",
        }),
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const space = searchParams.get("space") || req.cookies.get("backlog_space")?.value;
    if (!space) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing space parameter",
          message_th: "กรุณาระบุ space (subdomain)",
        }),
        { status: 400 }
      );
    }

    // รองรับหลายโดเมนของ Backlog
    const domains = ["backlog.com", "backlogtool.com", "backlog.jp"];
    let data: any;
    let lastError: any;
    for (const domain of domains) {
      try {
        const url = `https://${space}.${domain}/api/v2/projects`;
        const resp = await axios.get(url, { params: { apiKey } });
        data = resp.data;
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (!data) throw lastError;

    return NextResponse.json(
      successResponse({
        data,
        message_en: "Fetch Backlog projects successfully",
        message_th: "ดึงข้อมูลโครงการจาก Backlog สำเร็จ",
      })
    );
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const reason = error?.response?.data || error?.message || "Fetch projects failed";
    return NextResponse.json(
      errorResponse({
        status,
        message_en: typeof reason === "string" ? reason : "Fetch projects failed",
        message_th: "ดึงข้อมูลโครงการจาก Backlog ไม่สำเร็จ",
        error,
      }),
      { status }
    );
  }
}
