import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@services/api-url";
import axios from "axios";
import {
  RefreshTokenResponse,
  RefreshTokenResult,
  RequestRefreshToken,
} from "@stores/type";

//** สร้าง payload สำหรับ refresh token */
function buildRefreshPayload(schoolId: string, userId: string, token: string) {
  return {
    SchoolID: schoolId,
    OldToken: token,
    sID: userId,
  };
}

//** เรียก API refresh token แบบรวมศูนย์ */
async function postRefreshToken(payload: {
  SchoolID: string;
  OldToken: string;
  sID: string;
}) {
  const apiUrl = API_URL.PROD_SB_API_URL;
  const endpoint = "/api/v1/tokens/refresh";
  const url = apiUrl + endpoint;
  const response = await axios.post(url, payload);
  return response;
}

//** ค่าเริ่มต้นสำหรับ testing (สามารถลบเมื่อใช้งานจริง) */
const TEMP = {
  school_id: "849",
  user_id: "1230336",
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjIyNTAiLCJlbWFpbCI6IjIyNTBfODQ5XzBAc2Nob29sYnJpZ2h0LmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL3Bvc3RhbGNvZGUiOiI4NDkiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9zaWQiOiIxMjMwMzM2IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvaGFzaCI6IjAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiIxMS8xLzIwMjUgNTo1NzoxNiBQTSIsIm5iZiI6MTc2MTY3NDIzNiwiZXhwIjoxNzYyMDE5ODM2LCJpYXQiOjE3NjE2NzQyMzZ9.GtCyAD7nHkVtf0tSbzASspmOzDAGWZGAZm3hNu92KBk"
};

//** GET handler - ใช้ TEMP สำหรับตัวอย่าง */
export async function GET(_request: NextRequest) {
  try {
    const payload = buildRefreshPayload(
      TEMP.school_id,
      TEMP.user_id,
      TEMP.token
    );
    const resp = await postRefreshToken(payload);
    const result: RefreshTokenResponse = resp;
    const data = resp.data;

    const object: RefreshTokenResult = {
      header_key: `JabjaiKey-${data.SchoolID}-${data.sID}`,
      token: `${data.token}`,
    };
    return NextResponse.json(object, { status: resp.status });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { message: error.message || "Internal Server Error", status },
      { status }
    );
  }
}

//** POST handler - รับค่าจาก client ถ้ามี ถ้าไม่มีก็ใช้ TEMP */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as
      | Partial<RequestRefreshToken["draftValues"]>
      | undefined;
    const schoolId = (body && body.school_id) || TEMP.school_id;
    const userId = (body && body.user_id) || TEMP.user_id;
    const token = (body && body.token) || TEMP.token;

    const payload = buildRefreshPayload(
      String(schoolId),
      String(userId),
      String(token)
    );
    const resp = await postRefreshToken(payload);
    return NextResponse.json({ status: resp.status, data: resp.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { message: error.message || "Internal Server Error", status },
      { status }
    );
  }
}
