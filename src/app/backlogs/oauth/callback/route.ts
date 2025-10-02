import { NextRequest, NextResponse } from "next/server";

//** หน้านี้รับ code จาก Backlog แล้วเรียก API ภายในแลก token และ redirect ไปหน้า report
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // state format: space:<spaceKey>:<random>
  const space = state?.startsWith("space:") ? state.split(":")[1] : undefined;

  if (!code || !space) {
    return NextResponse.redirect(new URL("/backlogs/report?error=missing_code", req.url));
  }

  const tokenEndpoint = new URL("/api/v1/backlog/oauth/token", req.url).toString();
  try {
    await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, space }),
    });
  } catch (_e) {
    // ignore; redirect with error
    return NextResponse.redirect(new URL("/backlogs/report?error=token", req.url));
  }

  return NextResponse.redirect(new URL("/backlogs/report", req.url));
}
