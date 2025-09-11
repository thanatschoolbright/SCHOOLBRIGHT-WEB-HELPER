import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/entry.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { z } from "zod";
import { validateRequest } from "@/helpers/api/validate.request";

const ProjectReadSchema = z
  .object({
    id: z.number().optional(),
    limit: z.number().min(1), // required
    page: z.number().min(1).optional(),
  })
  .refine((data) => data.id !== undefined || data.page !== undefined, {
    message: "ต้องระบุ id หรือ page อย่างน้อย 1 อย่าง และต้องกำหนด limit เสมอ",
  });

async function DTO(data: any) {
  return {
    id: data.id,
    project_id: data.projectId,
    project_name : data.project.name,
    feature_id: data.featureId,
    feature_name : data.feature.name,
    date: data.date,
    hours: data.hours,
    description: data.description,
    status: data.status,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
    created_by: data.createdBy,
    updated_by: data.updatedBy,
  };
}

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, ProjectReadSchema);
  if (error) {
    return error;
  }

  try {
    const { id, limit = 10, page = 1 } = data;
    const take = Number(limit);
    const currentPage = Number(page);
    let dataResult;
    let total = 0;

    if (id) {
      const result = await Service.findById(Number(id));
      dataResult = result ? await DTO(result) : null;
      total = dataResult ? 1 : 0;
    } else {
      const skip = (currentPage - 1) * take;
      const result = await Service.findAll({ limit: take, skip });
      dataResult = await Promise.all(result.items.map((item: any) => DTO(item)));
      total = result.total;
    }

    const totalPages = Math.ceil(total / take);

    return NextResponse.json(
      successResponse({
        data: dataResult,
        pagination: {
          page: currentPage,
          pageSize: take,
          total,
          totalPages,
        },
      })
    );
  } catch (error: any) {
    return NextResponse.json(errorResponse({ error }));
  }
}
