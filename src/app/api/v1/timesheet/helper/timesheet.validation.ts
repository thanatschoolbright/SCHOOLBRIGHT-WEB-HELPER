import { Service } from "@services/backend/timesheet/sub-project/sub-project.service";
import { Service as EntryService } from "@services/backend/timesheet/entry.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { NextRequest, NextResponse } from "next/server";

export const projectIdValidation = async (projectId: number) => {
  const isValidProject = await Service.validateProjectId(projectId);
  if (!isValidProject) {
    return NextResponse.json(
      errorResponse({
        message_en: "The project_id does not exist",
        message_th: "project_id นี้ไม่มีอยู่ในระบบ",
      }),
      { status: 200 }
    );
  }
  return true;
};

export const subProjectIdValidation = async (subProjectId: number) => {
  const isValidProject = await Service.validateSubProjectId(subProjectId);
  if (!isValidProject) {
    return NextResponse.json(
      errorResponse({
        message_en: "The sub_project_id does not exist",
        message_th: "sub_project_id นี้ไม่มีอยู่ในระบบ",
      }),
      { status: 200 }
    );
  }
  return true;
};

export const updateTimesheetEntryIdValidation = async (id: number) => {
  const isValid = await EntryService.validatorID(id);
  if (!isValid) {
    return NextResponse.json(
      errorResponse({
        message_en: "The timesheet entry id does not exist",
        message_th: "timesheet entry id นี้ไม่มีอยู่ในระบบ",
      }),
      { status: 200 }
    );
  }
  return true;
};
