import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../service/user-management.service";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, userIds } = body;

    // กรณีระบุไอดีเดียว (รายคน)
    if (userId) {
      const result = await UserManagementService.resetPassword(
        Number(userId),
        Number(session.user.id),
      );
      return NextResponse.json({
        success: true,
        message:
          "รีเซ็ตรหัสผ่านและส่งอีเมลเรียบร้อยแล้ว แนะนำให้ผู้ใช้งานทำการเปลี่ยนรหัสผ่านใหม่ที่เมนู 'เปลี่ยนรหัสผ่าน' เพื่อความปลอดภัย",
        data: result,
      });
    }

    // กรณีระบุหลายไอดี (รายกลุ่ม)
    if (userIds && Array.isArray(userIds)) {
      if (userIds.length === 0) {
        return NextResponse.json(
          { message: "กรุณาเลือกผู้ใช้งานที่ต้องการรีเซ็ต" },
          { status: 400 },
        );
      }

      const results = [];
      const errors = [];

      // ประมวลผลทีละคน (Sequential or Promise.allSettled)
      // เพื่อความปลอดภัยระดับ IPO และป้องกัน Rate Limit ของ Mailer
      for (const id of userIds) {
        try {
          const res = await UserManagementService.resetPassword(
            Number(id),
            Number(session.user.id),
          );
          results.push(res);
        } catch (err: any) {
          errors.push({ id, error: err.message });
        }
      }

      return NextResponse.json({
        success: true,
        message: `ดำเนินการเสร็จสิ้น: สำเร็จ ${results.length} รายการ, ล้มเหล ${errors.length} รายการ`,
        data: { results, errors },
      });
    }

    return NextResponse.json(
      { message: "ข้อมูลไม่ครบถ้วน (userId หรือ userIds)" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("API Error Reset Password:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
