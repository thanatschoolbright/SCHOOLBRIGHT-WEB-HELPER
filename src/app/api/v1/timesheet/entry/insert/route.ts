import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/entry.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { z } from "zod";
import {
  projectIdValidation,
  subProjectIdValidation,
  updateTimesheetEntryIdValidation,
} from "@api/v1/timesheet/helper/timesheet.validation";

// Timesheet entry validation schema
const timesheetEntrySchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1),
  project_id: z.string().transform((val) => Number(val)),
  sub_project_id: z.string().transform((val) => Number(val)),
  date: z.string().datetime(),
  work_hour: z.string().transform((val) => Number(val)),
  status: z.string(),
  by: z.number().min(1).optional(),
  updated_by: z.number().min(1).optional(),
});

// Helper to validate references and return early if invalid
async function validateReferences(projectId: number, subProjectId: number, id?: number) {
  const validators = [
    projectIdValidation(projectId),
    subProjectIdValidation(subProjectId),
    id !== undefined ? updateTimesheetEntryIdValidation(id) : Promise.resolve(true),
  ];
  for (const validationPromise of validators) {
    const result = await validationPromise;
    if (result !== true) return result;
  }
  return true;
}

export async function POST(request: NextRequest) {
  // Validate request body
  const { data, error } = await validateRequest(request, timesheetEntrySchema);
  if (error) return error;

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

  // Validate project, sub-project, and timesheet entry references
  const referencesValidation = await validateReferences(Number(project_id), Number(sub_project_id), id);
  if (referencesValidation !== true) return referencesValidation;

  // Prepare payload for service call
  const payload = {
    description,
    project_id,
    sub_project_id,
    date: new Date(date),
    hour: Number(work_hour),
    status,
  };

  try {
    // Create or update timesheet entry
    const entry = id
      ? await Service.update(id, { ...payload, updatedBy:updated_by })
      : await Service.create({
        ...payload, createdBy: by,
        projectId: project_id,
        subProjectId: sub_project_id
      });

    // Prepare success messages
    const messageEn = id
      ? "Timesheet entry updated successfully"
      : "Timesheet entry created successfully";
    const messageTh = id ? "อัปเดตเวลาทำงานสำเร็จ" : "สร้างเวลาทำงานสำเร็จ";

    // Return successful response
    return NextResponse.json(
      successResponse({
        data: entry,
        message_en: messageEn,
        message_th: messageTh,
      })
    );
  } catch (error: any) {
    // Return error response
    return NextResponse.json(
      errorResponse({
        message_en: error.message,
        message_th: "เกิดข้อผิดพลาด",
        error,
      })
    );
  }
}
