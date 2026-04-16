import { successResponse } from "@helpers/api/response";
import { buildPagination } from "@helpers/controller/build-pagination.params";
import { formatDate } from "@helpers/controller/format-date.params";
import { handleError } from "@helpers/controller/handle-error.params";
import safeParseRequestBody from "@helpers/controller/safe-parse.params";
import { validateParams } from "@helpers/controller/validate.params";
import Service from "@services/overtime/overtime.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for validating overtime read request parameters
const ReadOvertimeSchema = z.object({
  id: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v),
    z.number().int().positive().optional(),
  ),
  limit: z.preprocess(
    (v) => (v === undefined || v === null ? undefined : Number(v)),
    z.number().int().nonnegative().optional(),
  ),
  offset: z.preprocess(
    (v) => (v === undefined || v === null ? undefined : Number(v)),
    z.number().int().nonnegative().optional(),
  ),
  request_id: z.preprocess(
    (v) => (v === null ? undefined : typeof v === "number" ? String(v) : v),
    z.string().optional(),
  ),
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
    // Extensive logging for 500 errors to help debug
    console.error("POST /api/v1/timesheet/overtime/read error details:", err);
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

  // Validate dates to prevent Prisma Invalid Date crashes
  const from =
    params.from && !isNaN(Date.parse(params.from))
      ? new Date(params.from)
      : undefined;
  const to =
    params.to && !isNaN(Date.parse(params.to))
      ? new Date(params.to)
      : undefined;

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

// Transforms user object to safe JSON format
function transformUser(u: any) {
  if (!u) return null;
  return {
    admin_id: u.admin_id,
    employee_code: u.employee_code,
    firstname_th: u.firstname_th,
    lastname_th: u.lastname_th,
    firstname_en: u.firstname_en,
    lastname_en: u.lastname_en,
    nickname: u.nickname,
    position_th: u.position_ref?.name_th || u.position_th || null,
    department_th: u.department?.name_th || null,
    profile_image:
      u.profile_image_path || u.profile_image || u.image_profile || null,
  };
}

// Transforms overtime object from camelCase to snake_case format
function transformOvertimeToSnakeCase(overtime: any) {
  return {
    id: overtime.id,
    requester_id: overtime.requesterId,
    requester_name: overtime.requester_name,
    requester_employee_code: overtime.requester_employee_code,
    requester_position: overtime.requester_position,
    requester_department: overtime.requester_department || null,
    requester_user: transformUser(overtime.requester_user),
    request_date: formatDate(overtime.requestDate),
    status: overtime.status,
    created_by: overtime.createdBy,
    creator_name: overtime.creator_name,
    creator_user: transformUser(overtime.creator_user),
    updated_by: overtime.updatedBy ?? null,
    updater_name: overtime.updater_name,
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

  return descriptions.map((desc) => {
    // Safely cast duration to string to handle Prisma Decimal objects
    const durationStr =
      desc.duration !== undefined && desc.duration !== null
        ? String(desc.duration)
        : "0";

    return {
      id: desc.id,
      overtime_id: desc.overtimeId,
      date: formatDate(desc.date),
      start_date: formatDate(desc.startDate),
      end_date: formatDate(desc.endDate),
      duration: durationStr,
      description: desc.description || "",
      assignee: desc.assignee || "",
      assignee_name: desc.assignee_name || "",
      assignee_user: transformUser(desc.assignee_user),
      proof: desc.proof ?? {},
    };
  });
}

// (Pagination building delegated to shared helper)
