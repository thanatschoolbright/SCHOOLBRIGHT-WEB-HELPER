import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/sub-project/sub-project.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { z } from "zod";
import { projectIdValidation } from "@api/v1/timesheet/helper/timesheet.validation";

const ProjectCreateUpdateSchema = z.object({
  id: z.union([z.number().min(1), z.string().min(1).optional()]),
  name: z.string().min(1),
  by: z.union([z.number().min(1), z.string().min(1)]),
  description: z.any().optional(),
});

// ใช้สำหรับสร้างหรืออัปเดตโครงการ
export async function POST(
  request: NextRequest,
  context: { params: { subproject_id: string } }
) {
  const { data, error } = await validateRequest(
    request,
    ProjectCreateUpdateSchema
  );
  if (error) return error;

  const { id, name, by, description } = data;
  const { subproject_id } = context.params;

  try {
    const validationProject = await projectIdValidation(Number(subproject_id));
    if (validationProject !== true) return validationProject;
    const project = id
      ? await Service.update(Number(id), {
          name,
          updatedBy: Number(by),
          backlogDescription: description,
        })
      : await Service.create({
          projectId: Number(subproject_id),
          name,
          createdBy: Number(by),
          backlogDescription: description,
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
