import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

// ดึง secret key สำหรับ verify JWT (ใช้ AUTH_SECRET เดียวกับ NextAuth)
function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

// แยก Bearer token ออกจาก Authorization header
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const spaceIndex = authHeader.indexOf(" ");
  if (spaceIndex === -1) return null;
  const scheme = authHeader.slice(0, spaceIndex).toLowerCase();
  const token = authHeader.slice(spaceIndex + 1);
  if (scheme !== "bearer" || !token) return null;
  return token;
}

// ดึงรายชื่อผู้ใช้ทั้งหมดในระบบ (ต้องมี Bearer token ที่ถูกต้อง)
export async function GET(request: NextRequest) {
  try {
    const rawToken = extractBearerToken(request.headers.get("Authorization"));

    if (!rawToken) {
      return NextResponse.json(
        errorResponse({
          message_th: "กรุณาระบุ Authorization: Bearer <token>",
          message_en: "Missing or invalid Authorization header",
          status: 401,
        }),
        { status: 401 },
      );
    }

    // ตรวจสอบความถูกต้องและ verify JWT
    try {
      await jwtVerify(rawToken, getJwtSecret(), {
        issuer: "schoolbright-shared-auth",
      });
    } catch {
      return NextResponse.json(
        errorResponse({
          message_th: "Token ไม่ถูกต้องหรือหมดอายุแล้ว",
          message_en: "Invalid or expired token",
          status: 401,
        }),
        { status: 401 },
      );
    }

    // ดึงข้อมูลผู้ใช้ทั้งหมดที่ยังไม่ถูกลบ
    const users = await PrismaTimesheet.user.findMany({
      where: { is_deleted: false },
      select: {
        id: true,
        admin_id: true,
        username: true,
        employee_code: true,
        email: true,
        firstname_th: true,
        lastname_th: true,
        firstname_en: true,
        lastname_en: true,
        nickname: true,
        status: true,
        phone: true,
        profile_image_path: true,
        employment_type: true,
        joined_date: true,
        last_login: true,
        department: {
          select: { id: true, name_th: true },
        },
        position_ref: {
          select: { id: true, name_th: true },
        },
        role: {
          select: { id: true, role_name: true },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(
      successResponse({
        message_th: "ดึงข้อมูลผู้ใช้ทั้งหมดสำเร็จ",
        message_en: "Users retrieved successfully",
        data: {
          total: users.length,
          users: users.map((u) => ({
            id: u.id,
            admin_id: u.admin_id,
            username: u.username,
            employee_code: u.employee_code,
            email: u.email,
            firstname_th: u.firstname_th,
            lastname_th: u.lastname_th,
            firstname_en: u.firstname_en,
            lastname_en: u.lastname_en,
            nickname: u.nickname,
            status: u.status,
            phone: u.phone,
            profile_image_path: u.profile_image_path,
            employment_type: u.employment_type,
            joined_date: u.joined_date,
            last_login: u.last_login,
            department_id: u.department?.id ?? null,
            department_name: u.department?.name_th ?? null,
            position_id: u.position_ref?.id ?? null,
            position_name: u.position_ref?.name_th ?? null,
            role_id: u.role?.id ?? null,
            role_name: u.role?.role_name ?? null,
          })),
        },
      }),
    );
  } catch (error) {
    console.error("[SHARED_ALL_USER_ERROR]", error);
    return NextResponse.json(
      errorResponse({ message_th: "เกิดข้อผิดพลาดภายในระบบ", message_en: "Internal Server Error" }),
      { status: 500 },
    );
  }
}
