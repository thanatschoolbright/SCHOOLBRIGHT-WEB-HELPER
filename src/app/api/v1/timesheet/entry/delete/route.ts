import { Service } from "@services/backend/timesheet/entry.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { z } from "zod";
import { validateRequest } from "@/helpers/api/validate.request";
import { NextRequest, NextResponse } from "next/server";

const ProjectDeleteSchema = z.object({
  ids: z.array(z.number()),
  by: z.number(),
});

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, ProjectDeleteSchema);
  if (error) return error;

  const { ids, by } = data;

  try {
    await Promise.all(
      ids.map((id: number) => Service.delete(id, { deletedBy: by }))
    );

    return NextResponse.json(
      successResponse({
        data: null,
        message_en: "Projects deleted successfully",
        message_th: "ลบโครงการที่เลือกสำเร็จ",
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
