import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/project.service";
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
      dataResult = await Service.findById(Number(id));
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
