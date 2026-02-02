import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../../service/user-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { serverLogger as logger } from "@/helpers/logger.server";

export async function POST(request: NextRequest) {
  const syncLogger = logger.child({ context: "SyncExecute" });
  try {
    const body = await request.json();
    const { items } = body; // Array of { type, remote, local? }
    const requestUserId = Number(request.headers.get("x-request-user") || 0);

    const results = [];

    for (const item of items) {
      syncLogger.info(
        "Sync executing item: %s (Type: %s)",
        item.remote?.username,
        item.type,
      );
      syncLogger.debug("Full sync item data: %j", item);

      const adminId = Number(item.remote?.admin_id);
      const username = item.remote?.username;
      const employeeCode = item.remote?.employee_code;

      if (!adminId) {
        syncLogger.warn("Missing admin_id for item: %j", item);
        continue;
      }

      if (item.type === "MISSING_IN_LOCAL") {
        syncLogger.debug(
          "Attempting to find existing user for adminId: %d, username: %s, empCode: %s",
          adminId,
          username,
          employeeCode,
        );

        // 1. Double check by admin_id (including deleted)
        let existing = await UserManagementService.findByAdminId(adminId);

        // 2. If not found by admin_id, check by other unique fields (username/empCode)
        if (!existing) {
          existing = await UserManagementService.findByUniqueFields({
            username: username || undefined,
            employee_code: employeeCode || undefined,
          });

          if (existing) {
            syncLogger.info(
              "Detected duplicate unique field (ID: %d, current admin_id: %d) matching requested info. Overriding existing user to avoid P2002.",
              existing.id,
              existing.admin_id,
            );
          }
        }

        if (existing) {
          syncLogger.info(
            "User exists (Local ID: %d). Performing Update/Restore.",
            existing.id,
          );

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

          syncLogger.debug(
            "Update payload for ID %d: %j",
            existing.id,
            updatePayload,
          );

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
            syncLogger.info(
              "Generated substitute employee code: %s",
              finalEmployeeCode,
            );
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

          syncLogger.info("Creating new local user for adminId: %d", adminId);
          syncLogger.debug("Create payload: %j", createPayload);

          const newUser = await UserManagementService.create(createPayload);
          results.push({
            status: "created",
            id: newUser.id,
            admin_id: adminId,
          });
        } catch (createError: any) {
          syncLogger.error(
            "Failed to create user (adminId: %d): %s",
            adminId,
            createError.message,
          );
          syncLogger.debug("Prisma Error Details: %j", createError);
          throw createError;
        }
      } else if (item.type === "MISMATCH") {
        const localId = item.local?.id;
        if (localId) {
          syncLogger.info(
            "Updating mismatched user (Local ID: %d, Admin ID: %d)",
            localId,
            adminId,
          );

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
        } else {
          syncLogger.warn(
            "Received MISMATCH type but no local ID provided: %j",
            item,
          );
        }
      }
    }

    return NextResponse.json(
      successResponse(results, "Sync completed successfully"),
    );
  } catch (error: any) {
    syncLogger.error("Sync execution failed: %j", error);

    // Construct a detailed error object for debugging
    const errorDetail = {
      message: error.message || "Unknown error",
      code: error.code,
      meta: error.meta,
      name: error.name,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };

    return NextResponse.json(
      errorResponse(
        error.message || "เกิดข้อผิดพลาดในการ Sync ข้อมูล",
        500,
        errorDetail,
      ),
      { status: 500 },
    );
  }
}
