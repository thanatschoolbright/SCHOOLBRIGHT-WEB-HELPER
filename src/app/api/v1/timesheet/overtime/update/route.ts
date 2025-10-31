import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/helpers/api/response";
import Service, {
  UpdateOvertimeInput,
} from "@services/overtime/overtime.service";
import { logger } from "@helpers/logger";
import { z } from "zod";
import { validateRequest } from "@/helpers/api/validate.request";
import { handleError } from "@helpers/controller/handle-error.params";

const DescriptionSchema = z.object({
  date: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v : v),
    z.string().optional()
  ),
  duration: z.preprocess((v) => {
    if (typeof v === "string" && v.trim() !== "") return Number(v);
    return v;
  }, z.number().nonnegative()),
  description: z.string().optional(),
  assignee: z.union([z.string(), z.number()]).optional(),
});

// accept snake_case input from clients for update
const UpdateOvertimeSnakeSchema = z.object({
  requester_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  employee_code: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  request_date: z.preprocess(
    (v) => (typeof v === "string" ? v : v),
    z.string().optional()
  ),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  overtime_type: z.string().optional(),
  descriptions: z.array(DescriptionSchema).optional(),
  approver_id: z.string().optional(),
  status: z.string().optional(),
  updated_by: z.preprocess(
    (v) => (typeof v === "string" ? Number(v) : v),
    z.number().int().optional()
  ),
});

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json(
      errorResponse({ message_en: "Missing id parameter", status: 400 }),
      { status: 400 }
    );
  }

  const id = Number(idParam);
  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json(
      errorResponse({ message_en: "Invalid id", status: 400 }),
      { status: 400 }
    );
  }

  const { data, error } = await validateRequest(
    request,
    UpdateOvertimeSnakeSchema
  );
  if (error) return error;

  try {
    const d = data as z.infer<typeof UpdateOvertimeSnakeSchema>;
    const payload: UpdateOvertimeInput = {
      requesterId: d.requester_id,
      firstname: d.first_name ?? undefined,
      lastname: d.last_name ?? undefined,
      employee_code: d.employee_code,
      role: d.role,
      department: d.department,
      requestDate: d.request_date ? new Date(d.request_date) : undefined,
      startTime: d.start_time,
      endTime: d.end_time,
      overtimeType: d.overtime_type,
      descriptions: d.descriptions,
      approverId: d.approver_id,
      status: d.status,
      updatedBy: d.updated_by,
    };

    const updated = await Service.update(id, payload);

    return NextResponse.json(
      successResponse({ data: updated, status: 200, message_en: "Updated" }),
      { status: 200 }
    );
  } catch (err: any) {
    return handleError(err, "POST /api/v1/timesheet/overtime/update error");
  }
}
