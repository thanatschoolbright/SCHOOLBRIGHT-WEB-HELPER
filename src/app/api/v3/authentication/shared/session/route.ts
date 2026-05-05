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

// รับ JWT token จาก Authorization header เพื่อแลกเป็นข้อมูล session ของพนักงาน
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
    let jwtPayload: any;
    try {
      const { payload } = await jwtVerify(rawToken, getJwtSecret(), {
        issuer: "schoolbright-shared-auth",
      });
      jwtPayload = payload;
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

    const userId = Number(jwtPayload.user_id);
    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        errorResponse({ message_th: "Token ไม่ถูกต้อง", message_en: "Invalid token payload", status: 401 }),
        { status: 401 },
      );
    }

    // ดึงข้อมูลล่าสุดของพนักงานจาก DB
    const databaseUser = await PrismaTimesheet.user.findFirst({
      where: { id: userId, is_deleted: false },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        position_ref: true,
        department: true,
      },
    });

    if (!databaseUser) {
      return NextResponse.json(
        errorResponse({ message_th: "ไม่พบข้อมูลผู้ใช้", message_en: "User not found", status: 404 }),
        { status: 404 },
      );
    }

    if (databaseUser.status !== "ACTIVE") {
      return NextResponse.json(
        errorResponse({ message_th: "บัญชีนี้ถูกระงับการใช้งาน", message_en: "Account is locked or inactive", status: 403 }),
        { status: 403 },
      );
    }

    const permissions =
      databaseUser.role?.permissions.map((rp) => rp.permission.p_code) || [];

    const expiresAt = jwtPayload.exp
      ? new Date(jwtPayload.exp * 1000).toISOString()
      : null;

    return NextResponse.json(
      successResponse({
        message_th: "ดึงข้อมูล session สำเร็จ",
        message_en: "Session retrieved successfully",
        data: {
          user: {
            id: databaseUser.id,
            admin_id: databaseUser.admin_id,
            username: databaseUser.username,
            employee_code: databaseUser.employee_code,
            email: databaseUser.email,
            firstname_th: databaseUser.firstname_th,
            lastname_th: databaseUser.lastname_th,
            firstname_en: databaseUser.firstname_en,
            lastname_en: databaseUser.lastname_en,
            nickname: databaseUser.nickname,
            role_id: databaseUser.role_id,
            role_name: databaseUser.role?.role_name ?? null,
            permissions,
            position_id: databaseUser.position_id,
            position_name: databaseUser.position_ref?.name_th ?? null,
            department_id: databaseUser.department_id,
            department_name: databaseUser.department?.name_th ?? null,
            status: databaseUser.status,
            phone: databaseUser.phone,
            profile_image_path: databaseUser.profile_image_path,
            employment_type: databaseUser.employment_type,
            last_login: databaseUser.last_login,
          },
          expires: expiresAt,
        },
      }),
    );
  } catch (error) {
    console.error("[SHARED_SESSION_ERROR]", error);
    return NextResponse.json(
      errorResponse({ message_th: "เกิดข้อผิดพลาดภายในระบบ", message_en: "Internal Server Error" }),
      { status: 500 },
    );
  }
}
