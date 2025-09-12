import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/sub-project/sub-project.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { z } from "zod";
import { validateRequest } from "@/helpers/api/validate.request";

const Schema = z.object({
  project_id: z.union([z.number().min(1), z.string().min(1)]),
  limit: z.union([z.number().min(1), z.string().optional()]),
  page: z.union([z.number().min(1), z.string().optional()]),
});

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, Schema);
  if (error) {
    return error;
  }

  try {
    const { project_id, limit = 10, page = 1 } = data;
    const take = Number(limit);
    const currentPage = Number(page);
    let dataResult;
    let total = 0;

    if (project_id) {
      dataResult = await Service.findByProjectId(Number(project_id));
      total = dataResult ? 1 : 0;
    } else {
      const skip = (currentPage - 1) * take;
      const result = await Service.findAll({ limit: take, skip });
      dataResult = result.items;
      total = result.total;
    }

    const total_pages = Math.ceil(total / take);

    return NextResponse.json(
      successResponse({
        data: dataResult,
        pagination: {
          page: currentPage,
          page_size: take,
          total,
          total_pages,
        },
      })
    );
  } catch (error: any) {
    return NextResponse.json(errorResponse({ error }));
  }
}
