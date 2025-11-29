import { NextRequest, NextResponse } from "next/server";
import { successResponse } from "@helpers/api/response";
import Service from "@services/overtime/overtime.service";
import { z } from "zod";
import { validateParams } from "@helpers/controller/validate.params";
import safeParseRequestBody from "@helpers/controller/safe-parse.params";
import { handleError } from "@helpers/controller/handle-error.params";
import { buildPagination } from "@helpers/controller/build-pagination.params";
import { formatDate } from "@helpers/controller/format-date.params";

// Schema for validating overtime read request parameters
const ReadOvertimeSchema = z.object({
  id: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v),
    z.number().int().positive().optional()
  ),
  limit: z.preprocess(
    (v) => (v === undefined ? undefined : Number(v)),
    z.number().int().nonnegative().optional()
  ),
  offset: z.preprocess(
    (v) => (v === undefined ? undefined : Number(v)),
    z.number().int().nonnegative().optional()
  ),
  request_id: z.string().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

type ReadOvertimeParams = z.infer<typeof ReadOvertimeSchema>;

const DEFAULT_LIMIT = 50;
const DEFAULT_SKIP = 0;

// Retrieves overtime records by ID or filtered list with pagination
export async function POST(request: NextRequest) {
  try {
    const body = await safeParseRequestBody(request);
    const params = validateParams(ReadOvertimeSchema, body);

    if (params.id) {
      return handleFindById(params.id);
    }

    return handleFindAll(params);
  } catch (err: unknown) {
    return handleError(err, "POST /api/v1/timesheet/overtime/read error");
  }
}

// Fetches single overtime record by ID
async function handleFindById(id: number) {
  const result = await Service.findById(id);
  const data = result.items.map(transformOvertimeToSnakeCase);
  return NextResponse.json(successResponse({ data, status: 200 }), {
    status: 200,
  });
}

// Fetches filtered overtime records with pagination
async function handleFindAll(params: ReadOvertimeParams) {
  const limit = params.limit ?? DEFAULT_LIMIT;
  const offset = params.offset ?? DEFAULT_SKIP;
  const from = params.from ? new Date(params.from) : undefined;
  const to = params.to ? new Date(params.to) : undefined;

  const result = await Service.findAll({
    limit,
    skip: offset,
    requesterId: params.request_id,
    status: params.status,
    from,
    to,
  });

  const data = result.items.map(transformOvertimeToSnakeCase);
  const pagination = buildPagination(offset, limit, result.total);

  return NextResponse.json(successResponse({ data, pagination, status: 200 }), {
    status: 200,
  });
}

// Transforms overtime object from camelCase to snake_case format
function transformOvertimeToSnakeCase(overtime: any) {
  return {
    id: overtime.id,
    requester_id: overtime.requesterId,
    request_date: formatDate(overtime.requestDate),
    status: overtime.status,
    created_by: overtime.createdBy,
    updated_by: overtime.updatedBy ?? null,
    created_at: formatDate(overtime.createdAt),
    updated_at: formatDate(overtime.updatedAt),
    is_deleted: !!overtime.isDeleted,
    descriptions: transformDescriptions(overtime.descriptions),
  };
}

// Transforms description array from camelCase to snake_case format
function transformDescriptions(descriptions: any[]): any[] {
  if (!Array.isArray(descriptions)) {
    return [];
  }

  return descriptions.map((desc) => ({
    id: desc.id,
    overtime_id: desc.overtimeId,
    date: formatDate(desc.date),
    start_date: formatDate(desc.startDate),
    end_date: formatDate(desc.endDate),
    duration:
      typeof desc.duration === "number" ? String(desc.duration) : desc.duration,
    description: desc.description,
    assignee: desc.assignee,
  }));
}

// (Pagination building delegated to shared helper)
