import { NextRequest, NextResponse } from "next/server";
import { Service } from "@services/backend/timesheet/entry.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { Schema } from "./route.validator";
import { DTO } from "./route.dto";

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequest(request, Schema);
  if (error) {
    return error;
  }

  try {
    const { id = 0, limit = 10, page = 1, user_id } = data;
    const take = Number(limit);
    const currentPage = Number(page);
    let dataResult;
    let total = 0;

    if (id > 0) {
      const result = await Service.findById(Number(id));
      dataResult = result ? await DTO(result) : null;
      total = dataResult ? 1 : 0;
    } else {
      const skip = (currentPage - 1) * take;
      const result = await Service.findAll({ limit: take, skip, user_id });
      dataResult = await Promise.all(
        result.items.map((item: any) => DTO(item))
      );
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
