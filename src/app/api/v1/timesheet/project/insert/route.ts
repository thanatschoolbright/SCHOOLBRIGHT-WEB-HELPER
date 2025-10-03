import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/project.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { validateRequest } from "@helpers/api/validate.request";
import { Schema } from "./route.validator";

// ใช้สำหรับสร้างหรืออัปเดตโครงการ
export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, Schema);
  if (error) return error;

  const { id, name, description, categoryType, by } = data;

  try {
    let project;
    let message_en;
    let message_th;

    if (id) {
      // Update
      project = await Service.update(id, {
        name: name,
        description: description,
        categoryType: categoryType,
        updatedBy: by,
      });
      message_en = "Project updated successfully";
      message_th = "อัปเดตโครงการสำเร็จ";
    } else {
      // Create
      project = await Service.create({
        name: name,
        description: description,
        categoryType: categoryType,
        createdBy: by,
      });
      message_en = "Project created successfully";
      message_th = "สร้างโครงการสำเร็จ";
    }

    return NextResponse.json(
      successResponse({
        data: project,
        message_en,
        message_th,
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
