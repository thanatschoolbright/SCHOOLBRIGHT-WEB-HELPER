import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { Service } from "@services/backend/timesheet/entry.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import {
  projectIdValidation,
  subProjectIdValidation,
  updateTimesheetEntryIdValidation,
} from "@api/v1/timesheet/helper/timesheet.validation";

//** Schema กำหนดรูปแบบข้อมูลที่รับเข้ามา
const TimesheetEntrySchema = z.object({
  id: z.number().optional(),
  description: z.string().optional().default(""),
  project_id: z.union([z.string(), z.number()]).transform(Number),
  sub_project_id: z.union([z.string(), z.number()]).transform(Number),
  work_hour: z.union([z.string(), z.number()]).transform(Number),
  date: z.string(),
  status: z.string(),
  by: z.number().min(1).optional(),
  updated_by: z.number().min(1).optional(),
});

//** ตรวจสอบว่าข้อมูลอ้างอิงยังถูกต้องอยู่หรือไม่
async function ensureReferencesValid(
  projectId: number,
  subProjectId: number,
  entryId?: number
) {
  const validations = [
    projectIdValidation(projectId),
    subProjectIdValidation(subProjectId),
    entryId !== undefined
      ? updateTimesheetEntryIdValidation(entryId)
      : Promise.resolve(true),
  ];

  for (const validator of validations) {
    const result = await validator;
    if (result !== true) return result;
  }

  return true;
}

export async function POST(request: NextRequest) {
  //** ตรวจสอบ payload ที่ส่งเข้ามา
  const { data, error } = await validateRequest(request, TimesheetEntrySchema);
  if (error) {
    console.error("[timesheet][insert] validation error", error);
    return NextResponse.json(
      errorResponse({
        status: 400,
        message_en: "Validation failed",
        message_th: "ข้อมูลไม่ถูกต้อง",
        error,
      }),
      { status: 400 }
    );
  }

  const {
    id,
    description,
    project_id,
    sub_project_id,
    date,
    work_hour,
    status,
    by,
    updated_by,
  } = data;

  //** ตรวจสอบ project / sub-project และ entry (ถ้ามี id)
  const referencesValid = await ensureReferencesValid(
    project_id,
    sub_project_id,
    id
  );
  if (referencesValid !== true) {
    return NextResponse.json(referencesValid);
  }

  //** เตรียม payload ส่งให้ service (ใช้ camelCase ให้ตรงกับ Prisma)
  const payload = {
    description,
    projectId: project_id,
    subProjectId: sub_project_id,
    date: new Date(date),
    hour: work_hour,
    status,
  };

  try {
    //** เลือกสร้างหรืออัปเดตตามว่ามี id หรือไม่
    const entry = id
      ? await Service.update(id, {
          ...payload,
          updatedBy: updated_by ?? by,
        })
      : await Service.create({
          ...payload,
          createdBy: by,
        });

    const isUpdate = Boolean(id);
    const message_en = isUpdate
      ? "Timesheet entry updated successfully"
      : "Timesheet entry created successfully";
    const message_th = isUpdate
      ? "อัปเดตเวลาทำงานสำเร็จ"
      : "สร้างเวลาทำงานสำเร็จ";

    return NextResponse.json(
      successResponse({
        data: entry,
        message_en,
        message_th,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[timesheet][insert]", message, err);

    return NextResponse.json(
      errorResponse({
        message_en: message,
        message_th: "เกิดข้อผิดพลาด",
        error: err,
      })
    );
  }
}
