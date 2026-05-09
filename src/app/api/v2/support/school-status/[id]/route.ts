import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { auth } from "@/auth";


// ✨ Schema ตรวจสอบ body สำหรับปรับสถานะโรงเรียน
const UpdateStatusSchema = z.object({
  active: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

// ✨ ปรับสถานะโรงเรียนใน TCompany (Active = เปิดใช้งานระบบ, isActive = เปิดเข้าสู่ระบบ)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        errorResponse({ status: 401, message_th: "กรุณาเข้าสู่ระบบ", message_en: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { id } = await params;
    const nCompany = parseInt(id, 10);
    if (isNaN(nCompany)) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "school_id ไม่ถูกต้อง", message_en: "Invalid school_id" }),
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = UpdateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "รูปแบบข้อมูลไม่ถูกต้อง", message_en: "Invalid body" }),
        { status: 400 }
      );
    }

    const { active, is_active } = parsed.data;

    if (active === undefined && is_active === undefined) {
      return NextResponse.json(
        errorResponse({ status: 400, message_th: "ต้องระบุ active หรือ is_active อย่างน้อยหนึ่งค่า", message_en: "Provide at least one field to update" }),
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีโรงเรียนนี้ใน TCompany
    const school = await PrismaJabjaiMaster.tCompany.findUnique({
      where: { nCompany },
      select: { nCompany: true, sCompany: true, Active: true, isActive: true },
    });

    if (!school) {
      return NextResponse.json(
        errorResponse({ status: 404, message_th: "ไม่พบข้อมูลโรงเรียน", message_en: "School not found" }),
        { status: 404 }
      );
    }

    // สร้าง update payload เฉพาะ field ที่ส่งมา
    const updateData: { Active?: boolean; isActive?: boolean } = {};
    if (active !== undefined) updateData.Active = active;
    if (is_active !== undefined) updateData.isActive = is_active;

    const updated = await PrismaJabjaiMaster.tCompany.update({
      where: { nCompany },
      data: updateData,
      select: { nCompany: true, sCompany: true, Active: true, isActive: true },
    });

    return NextResponse.json(
      successResponse({
        data: {
          school_id: updated.nCompany,
          company_name: updated.sCompany,
          active: updated.Active,
          is_active: updated.isActive,
        },
        message_th: `อัปเดตสถานะโรงเรียน ${updated.sCompany} สำเร็จ`,
        message_en: "School status updated successfully",
      }),
      { status: 200 }
    );
  } catch (err) {
    return handleError(err, "[SCHOOL_STATUS_UPDATE_ERROR]");
  }
}
