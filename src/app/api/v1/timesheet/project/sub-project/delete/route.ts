import { Service } from "@services/backend/timesheet/sub-project/sub-project.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { z } from "zod";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";

const ProjectDeleteSchema = z.object({
  id: z.union([z.number().min(1), z.string()]),
  by: z.union([z.number().min(1), z.string()]),
});

const projectIdValidation = async (projectId: number) => {
  const validationSubProjectId = await Service.findById(Number(projectId));
  if (validationSubProjectId.total === 0) {
    return NextResponse.json(
      errorResponse({
        message_en: "The sub project id does not exist",
        message_th: "sub project id นี้ไม่มีอยู่ในระบบ",
        status: 200,
      }),
      { status: 200 }
    );
  }
  return true;
};

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, ProjectDeleteSchema);
  if (error) return error;

  const { id, by } = data;
  const validationProject = await projectIdValidation(Number(id));
  if (validationProject !== true) return validationProject;

  try {
    const response = await Service.delete(Number(id), {
      deletedBy: Number(by),
    });

    return NextResponse.json(
      successResponse({
        data: response,
        message_en: "Sub Project deleted successfully",
        message_th: "ลบโครงการย่อยสำเร็จ",
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
