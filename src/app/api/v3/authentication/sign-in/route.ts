import { NextResponse } from "next/server";

/**
 * @notice สำหรับระบบ Login V3 จะใช้ Auth.js v5 (Next-Auth) เป็นหลัก
 * โดยสามารถเรียกใช้ผ่าน Callback ของ NextAuth ได้ที่ /api/auth/*
 *
 * หากต้องการตรวจสอบสิทธิ์ในรูปแบบ API สามารถเรียกใช้ signIn จาก @/auth ได้โดยตรง
 */
export async function GET() {
  return NextResponse.json({
    message:
      "Authentication Service V3 is running. Please use NextAuth endpoints for signing in.",
    endpoints: {
      signin: "/api/auth/signin",
      signout: "/api/auth/signout",
      session: "/api/auth/session",
    },
  });
}
