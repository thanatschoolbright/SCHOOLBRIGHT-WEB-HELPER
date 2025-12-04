import { NextRequest, NextResponse } from "next/server";

import { errorResponse, successResponse } from "@helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { Service } from "@services/backend/timesheet/project.service";
import { Service as SubProjectService } from "@services/backend/timesheet/sub-project/sub-project.service";

import { Schema } from "./route.validator";

// Types
interface ProjectData {
  id?: number;
  name: string;
  description: string;
  categoryType: string;
  by: number;
  status: string;
  name_en?: string;
  start_date?: string;
  end_date?: string;
}

interface ResponseMessage {
  message_en: string;
  message_th: string;
}

interface DefaultSubProject {
  name: string;
  note: string;
}

// Constants
const DEFAULT_SUB_PROJECTS: DefaultSubProject[] = [
  {
    name: "เคสประจำวัน (Daily Case)",
    note: "Auto-generated daily case sub-project",
  },
  {
    name: "อื่น ๆ",
    note: "Auto-generated miscellaneous sub-project",
  },
];

const PROJECT_DATE_RANGE = {
  START_DATE: new Date("2025-01-01T00:00:00.000Z"),
  END_DATE: new Date("2030-01-01T00:00:00.000Z"),
} as const;

//** การทำงาน: จัดการการอัปเดตโครงการ */
async function handleProjectUpdate(
  projectId: number,
  projectData: Omit<ProjectData, "id">
): Promise<NextResponse> {
  const updatedProject = await Service.update(projectId, {
    name: projectData.name,
    description: projectData.description,
    categoryType: projectData.categoryType,
    status: projectData.status,
    updatedBy: projectData.by,
  });

  const responseMessage: ResponseMessage = {
    message_en: "Project updated successfully",
    message_th: "อัปเดตโครงการสำเร็จ",
  };

  return NextResponse.json(
    successResponse({
      data: updatedProject,
      ...responseMessage,
    })
  );
}

//** การทำงาน: จัดการการสร้างโครงการใหม่พร้อมโครงการย่อยเริ่มต้น */
async function handleProjectCreation(
  projectData: Omit<ProjectData, "id">
): Promise<NextResponse> {
  console.info("REQUEST", JSON.stringify(projectData, null, 2));
  //** สร้างโครงการหลัก */
  const newProject = await Service.create({
    name: projectData.name,
    description: projectData.description,
    categoryType: projectData.categoryType,
    createdBy: projectData.by,
    status: projectData.status,
    name_en: projectData.name_en,
    start_date: projectData.start_date,
    end_date: projectData.end_date,
  });

  //** สร้างโครงการย่อยเริ่มต้นแบบขนาน */
  await createDefaultSubProjects(newProject.id, projectData.by);

  const responseMessage: ResponseMessage = {
    message_en: "Project created successfully with default sub-projects",
    message_th: "สร้างโครงการและโครงการย่อยเริ่มต้นสำเร็จ",
  };

  return NextResponse.json(
    successResponse({
      data: newProject,
      ...responseMessage,
    })
  );
}

//** การทำงาน: สร้างโครงการย่อยเริ่มต้นทั้งหมดแบบขนาน */
async function createDefaultSubProjects(
  projectId: number,
  createdBy: number
): Promise<void> {
  const subProjectPromises = DEFAULT_SUB_PROJECTS.map((subProject) =>
    SubProjectService.create({
      projectId,
      name: subProject.name,
      createdBy,
      backlogDescription: { note: subProject.note },
      startDate: PROJECT_DATE_RANGE.START_DATE,
      endDate: PROJECT_DATE_RANGE.END_DATE,
    })
  );

  await Promise.all(subProjectPromises);
}

//** การทำงาน: API สำหรับสร้างหรืออัปเดตโครงการพร้อมสร้างโครงการย่อยเริ่มต้นอัตโนมัติ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  //** ตรวจสอบความถูกต้องของข้อมูลที่ส่งมา */
  const { data, error } = await validateRequest(request, Schema);
  if (error) return error;

  const {
    id,
    name,
    description,
    categoryType,
    by,
    status,
    name_en,
    start_date,
    end_date,
  }: ProjectData = data;

  try {
    //** ตรวจสอบว่าเป็นการอัปเดตหรือสร้างใหม่ */
    if (id) {
      return await handleProjectUpdate(id, {
        name,
        description,
        categoryType,
        by,
        status,
        name_en,
        start_date,
        end_date,
      });
    } else {
      return await handleProjectCreation({
        name,
        description,
        categoryType,
        by,
        status,
        name_en,
        start_date,
        end_date,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      errorResponse({
        message_en: error.message,
        message_th: "เกิดข้อผิดพลาดในการดำเนินการ",
        error,
      })
    );
  }
}
