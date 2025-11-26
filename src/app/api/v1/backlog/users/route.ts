import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/helpers/api/response";

// Backlog API domain
const BACKLOG_DOMAIN = "backlog.com";

export async function GET(req: NextRequest) {
  try {
    const apiKey =
      process.env.BACKLOG_API_KEY ||
      new URL(req.url).searchParams.get("apiKey") ||
      undefined;

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
    const space = searchParams.get("space");
    const projectId = searchParams.get("projectId");

    if (!space || !projectId) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing space or projectId",
          message_th: "กรุณาระบุ space และ projectId",
        }),
        { status: 400 }
      );
    }

    const baseUrl = `https://${space}.${BACKLOG_DOMAIN}/api/v2/projects/${projectId}/users`;
    const resp = await axios.get(baseUrl, {
      params: { apiKey },
    });

    return NextResponse.json(
      successResponse({
        data: resp.data,
        message_en: "Fetch users successfully",
        message_th: "ดึงข้อมูลผู้ใช้งานสำเร็จ",
      })
    );
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      errorResponse({
        status,
        message_en: "Fetch users failed",
        message_th: "ดึงข้อมูลผู้ใช้งานไม่สำเร็จ",
        error,
      }),
      { status }
    );
  }
}
