import { errorResponse, successResponse } from "@/helpers/api/response";
import { handleError } from "@/helpers/controller/handle-error.params";
import { logger } from "@/helpers/logger.server";
import { NextRequest, NextResponse } from "next/server";
import { usersService } from "./service/users.service";
import {
  GetUsersQuerySchema,
  PostUsersRequestSchema,
} from "./validation/users.validation";

/**
 * GET /api/v1/timesheet/overtime/users
 * ✨ ดึงข้อมูล User สำหรับ dropdown "พนักงานผู้ปฏิบัติงาน"
 * Returns only necessary fields to minimize data transfer
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    /* 🛡️ Validate Query Parameters */
    const validatedParams = GetUsersQuerySchema.parse({ search });

    /* ✨ Call Service Layer เพื่อดึงข้อมูล */
    const users = await usersService.findAllUsers(validatedParams.search);

    /* 📝 Log successful request */
    logger.info("[GET /api/v1/timesheet/overtime/users] Success", {
      search: validatedParams.search,
      resultCount: users.length,
      endpoint: "/api/v1/timesheet/overtime/users",
    });

    return NextResponse.json(
      successResponse({
        data: users,
        message_th: "ดึงข้อมูลพนักงานสำเร็จ",
        message_en: "Users retrieved successfully",
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    /* 🚨 Log error with details */
    const errorData = handleError(err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : "";

    logger.error("[GET /api/v1/timesheet/overtime/users] Error occurred", {
      endpoint: "/api/v1/timesheet/overtime/users",
      method: "GET",
      error: errorMessage,
      stack: errorStack,
      status_code: errorData.status || 500,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(errorResponse(errorData), {
      status: errorData.status || 500,
    });
  }
}

/**
 * POST /api/v1/timesheet/overtime/users
 * ✨ ดึงข้อมูล User พร้อม Pagination (สำหรับ search dropdown)
 * Supports pagination and advanced search filtering
 */
export async function POST(request: NextRequest) {
  try {
    /* 🛡️ Parse และ Validate Request Body */
    const body = await request.json();
    const validatedParams = PostUsersRequestSchema.parse(body);

    /* ✨ Call Service Layer เพื่อดึงข้อมูล */
    const { users, total } = await usersService.findUsersWithPagination(
      validatedParams.search,
      validatedParams.limit,
      validatedParams.page,
    );

    /* 📝 Log successful request */
    logger.info("[POST /api/v1/timesheet/overtime/users] Success", {
      search: validatedParams.search,
      page: validatedParams.page,
      limit: validatedParams.limit,
      resultCount: users.length,
      totalRecords: total,
      endpoint: "/api/v1/timesheet/overtime/users",
    });

    return NextResponse.json(
      successResponse({
        data: users,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total,
          total_pages: Math.ceil(total / validatedParams.limit),
        },
        message_th: "ดึงข้อมูลพนักงานสำเร็จ",
        message_en: "Users retrieved successfully",
      }),
      { status: 200 },
    );
  } catch (err: unknown) {
    /* 🚨 Log error with details */
    const errorData = handleError(err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : "";

    logger.error("[POST /api/v1/timesheet/overtime/users] Error occurred", {
      endpoint: "/api/v1/timesheet/overtime/users",
      method: "POST",
      error: errorMessage,
      stack: errorStack,
      status_code: errorData.status || 500,
      request_body: "Request body logged separately for security",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(errorResponse(errorData), {
      status: errorData.status || 500,
    });
  }
}
