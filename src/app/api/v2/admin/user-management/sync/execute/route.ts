import { errorResponse, successResponse } from "@/helpers/api/response";
import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../../service/user-management.service";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        errorResponse({
          message_en: "Invalid JSON body",
          message_th: "ข้อมูล JSON ไม่ถูกต้อง",
          status: 400,
        }),
        { status: 400 },
      );
    }
    const { items } = body; // Array of { type, remote, local? }
    const requestUserId = Number(request.headers.get("x-request-user") || 0);

    const results = [];

    for (const item of items) {
      const adminId = Number(item.remote?.admin_id);
      const username = item.remote?.username;
      const employeeCode = item.remote?.employee_code;

      if (!adminId) {
        continue;
      }

      if (item.type === "MISSING_IN_LOCAL") {
        // 1. Double check by admin_id (including deleted)
        let existing = await UserManagementService.findByAdminId(adminId);

        // 2. If not found by admin_id, check by other unique fields (username/empCode)
        if (!existing) {
          existing = await UserManagementService.findByUniqueFields({
            username: username || undefined,
            employee_code: employeeCode || undefined,
          });
        }

        if (existing) {
          const updatePayload = {
            admin_id: adminId,
            username: username || existing.username,
            employee_code: employeeCode || existing.employee_code,
            firstname_th: item.remote.firstname_th,
            lastname_th: item.remote.lastname_th,
            email: item.remote.email,
            phone: item.remote.tel || item.remote.phone,
            status: "ACTIVE",
            is_deleted: false,
            updated_by: requestUserId,
          };

          await UserManagementService.update(existing.id, updatePayload);

          results.push({
            status: "updated_instead_of_created",
            id: existing.id,
            admin_id: adminId,
          });
          continue;
        }

        // 3. Create new user in local DB
        try {
          let finalEmployeeCode = employeeCode;

          // ถ้าไม่มีรหัสพนักงาน ให้เจนโค้ดใหม่ JJ_UNKNOWN_CODE_xxx
          if (
            !finalEmployeeCode ||
            finalEmployeeCode === "" ||
            finalEmployeeCode === "null"
          ) {
            finalEmployeeCode =
              await UserManagementService.getNextUnknownCode();
          }

          const createPayload = {
            admin_id: adminId,
            username: username || `user_${adminId}`,
            password: "default_password",
            employee_code: finalEmployeeCode,
            firstname_th: item.remote.firstname_th,
            lastname_th: item.remote.lastname_th,
            nickname: item.remote.nickname,
            email: item.remote.email,
            phone: item.remote.tel || item.remote.phone,
            position: item.remote.position,
            created_by: requestUserId,
          };

          const newUser = await UserManagementService.create(createPayload);
          results.push({
            status: "created",
            id: newUser.id,
            admin_id: adminId,
          });
        } catch (createError: any) {
          console.error(
            "Failed to create user (adminId: %d): %s",
            adminId,
            createError.message,
          );
          throw createError;
        }
      } else if (item.type === "MISMATCH") {
        const localId = item.local?.id;
        if (localId) {
          await UserManagementService.update(localId, {
            admin_id: adminId,
            username: username,
            employee_code: employeeCode,
            firstname_th: item.remote.firstname_th,
            lastname_th: item.remote.lastname_th,
            email: item.remote.email,
            phone: item.remote.tel || item.remote.phone,
            updated_by: requestUserId,
            is_deleted: false,
            status: "ACTIVE",
          });
          results.push({
            status: "updated",
            id: localId,
            admin_id: adminId,
          });
        }
      }
    }

    return NextResponse.json(
      successResponse({
        data: results,
        message_en: "Sync completed successfully",
        message_th: "Sync ข้อมูลสำเร็จแล้ว",
      }),
    );
  } catch (error: any) {
    console.error("Sync execution failed: %j", error);

    // Construct a detailed error object for debugging
    const errorDetail = {
      message: error.message || "Unknown error",
      code: error.code,
      meta: error.meta,
      name: error.name,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };

    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Sync execution failed",
        message_th: "เกิดข้อผิดพลาดในการ Sync ข้อมูล",
        status: 500,
        error: errorDetail,
      }),
      { status: 500 },
    );
  }
}
