import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/sub-project/sub-project.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { z } from "zod";
import { projectIdValidation } from "@api/v1/timesheet/helper/timesheet.validation";

const ProjectCreateUpdateSchema = z.object({
  id: z.union([z.number().min(1), z.string().min(1).optional()]),
  name: z.string().min(1),
  project_id: z.union([z.number().min(1), z.string().min(1)]),
  by: z.union([z.number().min(1), z.string().min(1)]),
});

errorResponse
// ใช้สำหรับสร้างหรืออัปเดตโครงการ
export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(
    request,
    ProjectCreateUpdateSchema
  );
  if (error) return error;

  const { id, name, project_id, by } = data;

  try {
    const validationProject = await projectIdValidation(Number(project_id));
    if (validationProject !== true) return validationProject;
    const project = id
      ? await Service.update(Number(id), { name, updatedBy: Number(by) })
      : await Service.create({
          projectId: Number(project_id),
          name,
          createdBy: Number(by),
        });

    return NextResponse.json(
      successResponse({
        data: project,
        message_en: id
          ? "Sub Project updated successfully"
          : "Sub Project created successfully",
        message_th: id ? "อัปเดตโครงการย่อยสำเร็จ" : "สร้างโครงการย่อยสำเร็จ",
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
