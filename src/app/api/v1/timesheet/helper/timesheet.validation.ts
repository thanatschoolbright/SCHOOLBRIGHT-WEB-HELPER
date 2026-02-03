import { errorResponse } from "@/helpers/api/response";
import { Service as EntryService } from "@services/backend/timesheet/entry.service";
import { Service } from "@services/backend/timesheet/sub-project/sub-project.service";
import { NextResponse } from "next/server";

export const projectIdValidation = async (projectId: number) => {
  const project = await Service.validateProjectId(projectId);
  if (!project) {
    return NextResponse.json(
      errorResponse({
        message_en: "The project_id does not exist",
        message_th: "ไม่พบรหัสโครงการนี้ในระบบ",
      }),
      { status: 400 },
    );
  }

  if (project.is_deleted) {
    return NextResponse.json(
      errorResponse({
        message_en:
          "This project has been deleted and cannot accept new entries",
        message_th: "โครงการนี้ถูกลบไปแล้ว ไม่สามารถเพิ่มข้อมูลใหม่ได้",
      }),
      { status: 400 },
    );
  }

  return true;
};

export const subProjectIdValidation = async (subProjectId: number) => {
  const feature = await Service.validateSubProjectId(subProjectId);
  if (!feature) {
    return NextResponse.json(
      errorResponse({
        message_en: "The sub_project_id does not exist",
        message_th: "ไม่พบรหัสโครงการย่อยนี้ในระบบ",
      }),
      { status: 400 },
    );
  }

  if (feature.is_deleted) {
    return NextResponse.json(
      errorResponse({
        message_en:
          "This sub-project has been deleted and cannot accept new entries",
        message_th: "โครงการย่อยนี้ถูกลบไปแล้ว ไม่สามารถเพิ่มข้อมูลใหม่ได้",
      }),
      { status: 400 },
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
      { status: 400 },
    );
  }
  return true;
};
