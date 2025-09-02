import { NextRequest, NextResponse } from "next/server";
import { ProjectService } from "@services/backend/timesheet/project.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { z } from "zod";

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
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(errorResponse({ error: "Invalid JSON body" }), {
      status: 400,
    });
  }

  const parsed = ProjectReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: 400,
        message: "Validation failed",
        errors: parsed.error.issues,
      },
      { status: 400 }
    );
  }
  const dto = parsed.data;

  try {
    const { id, limit = 10, page = 1 } = dto;
    const take = Number(limit);
    const currentPage = Number(page);
    let data;
    let total = 0;

    if (id) {
      data = await ProjectService.findById(Number(id));
      total = data ? 1 : 0;
    } else {
      const skip = (currentPage - 1) * take;
      const result = await ProjectService.findAll({ limit: take, skip });
      data = result.items;
      total = result.total;
    }

    const totalPages = Math.ceil(total / take);

    return NextResponse.json(
      successResponse({
        data,
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
