import { NextRequest, NextResponse } from "next/server";
import { ProjectService } from "@services/backend/timesheet/project.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { z } from "zod";

const ProjectCreateUpdateSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  description: z.string(),
  by: z.number().min(1),
});

async function validateRequest(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return {
      error: NextResponse.json(
        errorResponse({
          message_en: "Invalid JSON body",
          message_th: "ข้อมูล JSON ไม่ถูกต้อง",
        }),
        { status: 400 }
      ),
    };
  }

  const parsed = ProjectCreateUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return {
      error: NextResponse.json(
        {
          status: 400,
          message_en: "Validation failed",
          message_th: "การตรวจสอบไม่ผ่าน",
          errors: parsed.error.issues,
        },
        { status: 400 }
      ),
    };
  }

  return { data: parsed.data };
}

export async function POST(request: NextRequest) {
  // Parse and validate request
  const { data, error } = await validateRequest(request);
  if (error) return error;

  const { id, name, description, by } = data;

  try {
    const project = id
      ? await ProjectService.update(id, { name, description, updatedBy: by })
      : await ProjectService.create({ name, description, createdBy: by });

    return NextResponse.json(
      successResponse({
        data: project,
        message_en: id
          ? "Project updated successfully"
          : "Project created successfully",
        message_th: id ? "อัปเดตโครงการสำเร็จ" : "สร้างโครงการสำเร็จ",
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        message_en: error.message,
        message_th: "เกิดข้อผิดพลาด",
        error,
      })
    );
  }
}
