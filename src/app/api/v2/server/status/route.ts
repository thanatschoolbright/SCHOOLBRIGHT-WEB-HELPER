import axios, { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

import {
  executeServerStatusChecks,
  sendDiscordNotification,
} from "./_service/server-status-service";

export type { ServerResultInfo } from "./_validation/server-status-schema";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ✨ ดึงสถานะ Server ทั้งหมด รองรับ query ?mode=discord เพื่อส่งแจ้งเตือน
export async function GET(request: NextRequest) {
  try {
    const shouldNotifyDiscord =
      request.nextUrl.searchParams.get("mode") === "discord";

    const { timestamp, results } = await executeServerStatusChecks();

    if (shouldNotifyDiscord) {
      await sendDiscordNotification(results);
    }

    return NextResponse.json(
      {
        status_code: 200,
        message_th: "ดึงข้อมูลสถานะเซิร์ฟเวอร์สำเร็จ",
        message_en: "Server status fetched successfully",
        timestamp,
        data: results,
      },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err: unknown) {
    const isAxiosError = axios.isAxiosError(err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    const status = isAxiosError
      ? ((err as AxiosError).response?.status ?? 500)
      : 500;

    return NextResponse.json(
      {
        status_code: status,
        message_th: "ดึงข้อมูลสถานะเซิร์ฟเวอร์ไม่สำเร็จ",
        message_en: message,
        data: null,
      },
      { status, headers: CORS_HEADERS },
    );
  }
}

// ✨ ดึงสถานะ Server ผ่าน POST body รองรับ { mode: "discord" } สำหรับ cron job
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const shouldNotifyDiscord = body.mode === "discord";

    const { timestamp, results } = await executeServerStatusChecks();

    if (shouldNotifyDiscord) {
      await sendDiscordNotification(results);
    }

    return NextResponse.json(
      {
        status_code: 200,
        message_th: "ดึงข้อมูลสถานะเซิร์ฟเวอร์สำเร็จ",
        message_en: "Server status fetched successfully",
        timestamp,
        data: results,
      },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err: unknown) {
    const isAxiosError = axios.isAxiosError(err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    const status = isAxiosError
      ? ((err as AxiosError).response?.status ?? 500)
      : 500;

    return NextResponse.json(
      {
        status_code: status,
        message_th: "ดึงข้อมูลสถานะเซิร์ฟเวอร์ไม่สำเร็จ",
        message_en: message,
        data: null,
      },
      { status, headers: CORS_HEADERS },
    );
  }
}
