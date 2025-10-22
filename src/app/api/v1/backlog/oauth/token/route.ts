import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/helpers/api/response";

//** แลกเปลี่ยน code -> access_token จาก Backlog (OAuth 2.0)
export async function POST(req: NextRequest) {
  try {
    const { code, space } = await req.json();
    if (!code || !space) {
      return NextResponse.json(
        errorResponse({
          status: 400,
          message_en: "Missing code or space",
          message_th: "ขาดพารามิเตอร์ code หรือ space",
        }),
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_PUBLIC_BACKLOG_CLIENT_ID;
    const clientSecret = process.env.BACKLOG_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_BACKLOG_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        errorResponse({
          status: 500,
          message_en: "Backlog OAuth configs missing",
          message_th: "การตั้งค่า Backlog OAuth ไม่ครบถ้วน",
        }),
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });
    // ลองเรียกหลายโดเมนที่ Backlog ใช้ได้
    const candidateDomains = ["backlog.com", "backlogtool.com", "backlog.jp"];
    let data: any;
    let chosenDomain = "backlog.com";
    let lastError: any;
    for (const domain of candidateDomains) {
      try {
        const tokenUrl = `https://${space}.${domain}/api/v2/oauth2/token`;
        const resp = await axios.post(tokenUrl, params.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        data = resp.data;
        chosenDomain = domain;
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (!data) throw lastError;

    // ตั้ง cookie แบบ httpOnly เก็บ token ชั่วคราวด้านเซิร์ฟเวอร์
    const res = NextResponse.json(
      successResponse({
        data: { connected: true },
        message_en: "Backlog token stored",
        message_th: "จัดเก็บโทเค็น Backlog สำเร็จ",
      })
    );
    res.cookies.set("backlog_space", space, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    res.cookies.set("backlog_access_token", data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: data.expires_in ? Number(data.expires_in) : 3600,
    });
    // เก็บ domain ที่ใช้งานจริง (รองรับ .com/.jp/.backlogtool.com)
    res.cookies.set("backlog_domain", chosenDomain, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const reason =
      err?.response?.data || err?.message || "Token exchange failed";
    return NextResponse.json(
      errorResponse({
        status,
        message_en:
          typeof reason === "string" ? reason : "Token exchange failed",
        message_th: "ขอรับโทเค็นจาก Backlog ไม่สำเร็จ",
        error: err,
      }),
      { status }
    );
  }
}
