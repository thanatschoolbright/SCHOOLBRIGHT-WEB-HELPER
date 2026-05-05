import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SignInSchema = z.object({
  username: z.string().min(1, "กรุณาระบุชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณาระบุรหัสผ่าน"),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
// JWT มีอายุ 8 ชั่วโมง
const JWT_EXPIRES_IN = "8h";

// ดึง secret key สำหรับ sign JWT (ใช้ AUTH_SECRET เดียวกับ NextAuth)
function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

// อัปเดต failed_login_attempts เมื่อรหัสผ่านผิด และคืนค่าจำนวนครั้งที่เหลือ
async function handleFailedLogin(userId: number): Promise<number> {
  const updatedUser = await PrismaTimesheet.user.update({
    where: { id: userId },
    data: { failed_login_attempts: { increment: 1 } },
  });
  return MAX_FAILED_ATTEMPTS - updatedUser.failed_login_attempts;
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        errorResponse({ message_th: "ข้อมูล JSON ไม่ถูกต้อง", message_en: "Invalid JSON body", status: 400 }),
        { status: 400 },
      );
    }

    const parsed = SignInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({
          message_th: "กรุณาระบุชื่อผู้ใช้และรหัสผ่าน",
          message_en: "Username and password are required",
          status: 400,
        }),
        { status: 400 },
      );
    }

    const { username, password } = parsed.data;
    const normalizedUsername = username.trim();

    // ค้นหาผู้ใช้จาก email, employee_code หรือ username (case-insensitive)
    const databaseUser = await PrismaTimesheet.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedUsername, mode: "insensitive" } },
          { employee_code: { equals: normalizedUsername, mode: "insensitive" } },
          { username: { equals: normalizedUsername, mode: "insensitive" } },
        ],
        is_deleted: false,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        position_ref: true,
      },
    });

    if (!databaseUser) {
      return NextResponse.json(
        errorResponse({ message_th: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", message_en: "Invalid credentials", status: 401 }),
        { status: 401 },
      );
    }

    // ตรวจสอบสถานะบัญชี
    if (databaseUser.status !== "ACTIVE") {
      return NextResponse.json(
        errorResponse({ message_th: "บัญชีนี้ถูกระงับการใช้งาน", message_en: "Account is locked or inactive", status: 403 }),
        { status: 403 },
      );
    }

    // ตรวจสอบการล็อกบัญชีชั่วคราว (5 ครั้ง / 15 นาที)
    if (databaseUser.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
      const now = new Date();
      const lastAttempt = new Date(databaseUser.updated_at);
      const diffInMinutes = (now.getTime() - lastAttempt.getTime()) / (1000 * 60);

      if (diffInMinutes < LOCKOUT_MINUTES) {
        const minutesLeft = Math.ceil(LOCKOUT_MINUTES - diffInMinutes);
        return NextResponse.json(
          errorResponse({
            message_th: `บัญชีถูกล็อกชั่วคราว กรุณารออีก ${minutesLeft} นาที`,
            message_en: `Account temporarily locked. Please wait ${minutesLeft} minutes`,
            status: 429,
          }),
          { status: 429 },
        );
      }
    }

    // ตรวจสอบรหัสผ่าน (bcrypt หรือ plain-text fallback สำหรับบัญชีเก่า)
    const isPasswordCorrect = await bcrypt.compare(password, databaseUser.password);
    let finalPasswordStatus = isPasswordCorrect;

    if (!finalPasswordStatus && !databaseUser.password.startsWith("$2")) {
      finalPasswordStatus = password === databaseUser.password;
    }

    if (!finalPasswordStatus) {
      const remaining = await handleFailedLogin(databaseUser.id);
      if (remaining > 0) {
        return NextResponse.json(
          errorResponse({
            message_th: `รหัสผ่านไม่ถูกต้อง เหลืออีก ${remaining} ครั้งก่อนถูกล็อก`,
            message_en: `Invalid password. ${remaining} attempts remaining`,
            status: 401,
          }),
          { status: 401 },
        );
      }
      return NextResponse.json(
        errorResponse({
          message_th: "บัญชีถูกล็อกชั่วคราวเนื่องจากพยายามเข้าสู่ระบบผิดพลาดหลายครั้ง",
          message_en: "Account locked due to too many failed attempts",
          status: 429,
        }),
        { status: 429 },
      );
    }

    // รีเซ็ต failed_login_attempts และบันทึก last_login
    await PrismaTimesheet.user.update({
      where: { id: databaseUser.id },
      data: { failed_login_attempts: 0, last_login: new Date() },
    });

    const permissions =
      databaseUser.role?.permissions.map((rp) => rp.permission.p_code) || [];

    // สร้าง payload สำหรับ JWT
    const jwtPayload = {
      sub: String(databaseUser.id),
      user_id: databaseUser.id,
      admin_id: databaseUser.admin_id,
      username: databaseUser.username,
      employee_code: databaseUser.employee_code,
      email: databaseUser.email,
      role_id: databaseUser.role_id,
      role_name: databaseUser.role?.role_name ?? null,
      permissions,
      iss: "schoolbright-shared-auth",
    };

    // Sign JWT ด้วย AUTH_SECRET (HS256)
    const secret = getJwtSecret();
    const token = await new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);

    return NextResponse.json(
      successResponse({
        message_th: "เข้าสู่ระบบสำเร็จ",
        message_en: "Sign in successful",
        data: {
          token,
          token_type: "Bearer",
          expires_in: 28800,
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
            status: databaseUser.status,
            phone: databaseUser.phone,
            profile_image_path: databaseUser.profile_image_path,
            employment_type: databaseUser.employment_type,
            last_login: databaseUser.last_login,
          },
        },
      }),
    );
  } catch (error) {
    console.error("[SHARED_SIGN_IN_ERROR]", error);
    return NextResponse.json(
      errorResponse({ message_th: "เกิดข้อผิดพลาดภายในระบบ", message_en: "Internal Server Error" }),
      { status: 500 },
    );
  }
}
