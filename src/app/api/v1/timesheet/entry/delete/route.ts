import { Service } from "@services/backend/timesheet/entry.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { z } from "zod";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";

const ProjectDeleteSchema = z.object({
  id: z.number(),
  by: z.number(),
});

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, ProjectDeleteSchema);
  if (error) return error;

  const { id, by } = data;

  try {
    await Service.delete(id, { deletedBy: by });

    return NextResponse.json(
      successResponse({
        data: null,
        message_en: "Project deleted successfully",
        message_th: "ลบโครงการสำเร็จ",
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
