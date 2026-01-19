import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/sub-project/sub-project.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { projectIdValidation } from "@api/v1/timesheet/helper/timesheet.validation";
import { Schema } from "./route.validator";

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, Schema);
  if (error) return error;

  const {
    id,
    project_id,
    by,
    name,
    name_en,
    backlogDescription,
    startDate,
    endDate,
    asset_capture_type,
    status,
    projectStatusId,
    assignees,
  } = data;

  const projectId = Number(project_id);
  const userId = Number(by);
  const assetCaptureType = asset_capture_type ?? "UN_CAPTUREABLE";

  try {
    const isProjectValid = await projectIdValidation(projectId);
    if (isProjectValid !== true) return isProjectValid;

    const commonPayload = {
      name,
      name_en,
      backlogDescription,
      assetCaptureType,
      startDate,
      endDate,
      status,
      projectStatusId,
      assignees,
    };

    if (id) {
      const updatedProject = await Service.update(Number(id), {
        ...commonPayload,
        projectId,
        updatedBy: userId,
      });

      return NextResponse.json(
        successResponse({
          data: updatedProject,
          message_en: "Sub Project updated successfully",
          message_th: "อัปเดตโครงการย่อยสำเร็จ",
        })
      );
    }

    const newProject = await Service.create({
      ...commonPayload,
      projectId,
      createdBy: userId,
    });

    return NextResponse.json(
      successResponse({
        data: newProject,
        message_en: "Sub Project created successfully",
        message_th: "สร้างโครงการย่อยสำเร็จ",
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
