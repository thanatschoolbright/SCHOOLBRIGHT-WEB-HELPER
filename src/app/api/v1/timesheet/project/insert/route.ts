import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { Service } from "@services/backend/timesheet/project.service";
import { Service as SubProjectService } from "@services/backend/timesheet/sub-project/sub-project.service";
import { Schema } from "./route.validator";

const DEFAULT_SUB_PROJECTS = [
  {
    name: "เคสประจำวัน (Daily Case)",
    note: "Auto-generated daily case sub-project",
  },
  { name: "อื่น ๆ", note: "Auto-generated miscellaneous sub-project" },
] as const;

const DATE_CONFIG = {
  START: new Date("2025-01-01T00:00:00.000Z"),
  END: new Date("2025-12-31T23:59:59.999Z"),
} as const;

async function createDefaultSubProjects(projectId: number, userId: number) {
  await Promise.all(
    DEFAULT_SUB_PROJECTS.map(({ name, note }) =>
      SubProjectService.create({
        projectId,
        name,
        createdBy: userId,
        backlogDescription: { note },
        startDate: DATE_CONFIG.START,
        endDate: DATE_CONFIG.END,
      })
    )
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { data, error } = await validateRequest(request, Schema);
  if (error) return error;

  const { id, by, ...projectDetails } = data;

  try {
    if (id) {
      const updatedProject = await Service.update(id, {
        ...projectDetails,
        updatedBy: by,
      });

      return NextResponse.json(
        successResponse({
          data: updatedProject,
          message_en: "Project updated successfully",
          message_th: "อัปเดตโครงการสำเร็จ",
        })
      );
    }

    const newProject = await Service.create({
      ...projectDetails,
      createdBy: by,
    });

    await createDefaultSubProjects(newProject.id, by);

    return NextResponse.json(
      successResponse({
        data: newProject,
        message_en: "Project created successfully with default sub-projects",
        message_th: "สร้างโครงการและโครงการย่อยเริ่มต้นสำเร็จ",
      })
    );
  } catch (err: any) {
    return NextResponse.json(
      errorResponse({
        message_en: err.message,
        message_th: "เกิดข้อผิดพลาดในการดำเนินการ",
        error: err,
      })
    );
  }
}
