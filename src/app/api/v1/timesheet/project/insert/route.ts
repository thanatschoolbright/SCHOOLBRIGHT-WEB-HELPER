import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { Service } from "@services/backend/timesheet/project.service";
import { Service as SubProjectService } from "@services/backend/timesheet/sub-project/sub-project.service";
import { Schema } from "./route.validator";

// --- Constants ---
const DEFAULT_SUB_PROJECTS = [
  {
    name: "เคสประจำวัน (Daily Case)",
    note: "Auto-generated daily case sub-project",
  },
  { name: "อื่น ๆ", note: "Auto-generated miscellaneous sub-project" },
] as const;

const DATE_CONFIG = {
  START: new Date("2025-01-01T00:00:00.000Z"),
  END: new Date("2030-01-01T00:00:00.000Z"),
} as const;

// --- Helper: Create Default Sub-Projects ---
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

// --- Main Handler ---
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { data, error } = await validateRequest(request, Schema);
  if (error) return error;

  // แยก id และ by (userId) ออกมา ส่วนที่เหลือคือข้อมูล Project เพียวๆ
  const { id, by, ...projectDetails } = data;

  try {
    // CASE 1: UPDATE
    if (id) {
      const updatedProject = await Service.update(id, {
        ...projectDetails,
        updatedBy: by, // Map 'by' -> 'updatedBy'
      });

      return NextResponse.json(
        successResponse({
          data: updatedProject,
          message_en: "Project updated successfully",
          message_th: "อัปเดตโครงการสำเร็จ",
        })
      );
    }

    // CASE 2: CREATE
    const newProject = await Service.create({
      ...projectDetails,
      createdBy: by, // Map 'by' -> 'createdBy'
    });

    // Side Effect: Create Sub-projects
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
