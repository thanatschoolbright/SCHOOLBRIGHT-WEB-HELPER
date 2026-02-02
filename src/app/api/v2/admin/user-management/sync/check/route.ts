import { NextRequest, NextResponse } from "next/server";
import { LegacyUserService } from "@services/backend/user-management/legacy-user.service";
import { UserManagementService } from "../../service/user-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
import { serverLogger as logger } from "@/helpers/logger.server";

export async function GET(request: NextRequest) {
  const syncLogger = logger.child({ context: "SyncCheck" });

  try {
    syncLogger.info("Starting sync check process...");

    // 1. Fetch Local New Users
    const localUsers = await UserManagementService.findAll({
      page: 1,
      limit: 10000,
    }); // Large limit
    syncLogger.info("Local users found: %d", localUsers.total);

    // 2. Fetch Legacy Old Users
    const legacyUsers = await LegacyUserService.fetchLegacyUsers();
    syncLogger.info("Legacy users found: %d", legacyUsers.length);

    if (legacyUsers.length === 0) {
      syncLogger.warn(
        "No legacy users found from legacy API. Sync might be broken or service unreachable.",
      );
    }

    // 3. Map for comparison
    const localAdminIdMap = new Map(
      localUsers.items.map((u: any) => [u.admin_id, u]),
    );
    const localUsernameMap = new Map(
      localUsers.items.map((u: any) => [u.username, u]),
    );
    const localEmployeeCodeMap = new Map(
      localUsers.items
        .filter((u: any) => u.employee_code)
        .map((u: any) => [u.employee_code, u]),
    );

    const diffs: any[] = [];
    const synced: any[] = [];

    // 4. Compare Legacy -> Local (Import Check)
    for (const remote of legacyUsers) {
      const legacyId = Number(remote.id || remote.admin_id);
      if (isNaN(legacyId) || legacyId === 0) {
        syncLogger.debug("Skipping invalid legacy ID: %j", remote);
        continue;
      }

      // Try to find local user by Admin ID (Legacy Link)
      let local = localAdminIdMap.get(legacyId);

      // Helper to clean "null" string from legacy APIs
      const cleanStr = (val: any) => {
        if (val === null || val === undefined || val === "null") return "";
        return String(val);
      };

      const empCode = cleanStr(remote.employee_code);
      const remoteData = {
        admin_id: legacyId,
        username: empCode || cleanStr(remote.username) || `user_${legacyId}`,
        firstname_th: cleanStr(remote.firstname || remote.firstname_th),
        lastname_th: cleanStr(remote.lastname || remote.lastname_th),
        nickname: cleanStr(remote.nickname),
        email: cleanStr(remote.email),
        tel: cleanStr(remote.tel || remote.phone),
        position: cleanStr(remote.position),
        employee_code: empCode,
      };

      // If not found by Admin ID, try finding by Username or Employee Code
      // (This handles users created locally before sync set up)
      if (!local) {
        local =
          localUsernameMap.get(remoteData.username) ||
          localEmployeeCodeMap.get(remoteData.employee_code);

        if (local) {
          syncLogger.debug(
            "Found local user by username/empCode instead of admin_id: %s",
            remoteData.username,
          );
        }
      }

      if (!local) {
        diffs.push({
          type: "MISSING_IN_LOCAL",
          key: legacyId,
          remote: remoteData,
          local: null,
          message: "New user in Legacy System",
        });
      } else {
        // Simple comparison of key fields (Excluding Position as requested)
        const isDiff =
          Number(local.admin_id) !== Number(remoteData.admin_id) ||
          (local.username || "") !== (remoteData.username || "") ||
          (local.firstname_th || "") !== (remoteData.firstname_th || "") ||
          (local.lastname_th || "") !== (remoteData.lastname_th || "") ||
          (local.email || "") !== (remoteData.email || "") ||
          (local.phone || "") !== (remoteData.tel || "");

        if (isDiff) {
          syncLogger.debug(
            "Mismatch found for user %s (legacyId: %d)",
            remoteData.username,
            legacyId,
          );
          diffs.push({
            type: "MISMATCH",
            key: legacyId,
            remote: remoteData,
            local: {
              id: local.id, // Primary Key for local update
              admin_id: local.admin_id,
              firstname_th: local.firstname_th,
              lastname_th: local.lastname_th,
              nickname: local.nickname,
              email: local.email,
              phone: local.phone,
              position: local.position,
              employee_code: local.employee_code,
            },
            message: "Data mismatch between systems",
          });
        } else {
          synced.push(local);
        }
      }
    }

    syncLogger.info(
      "Sync check finished: %d diffs, %d synced",
      diffs.length,
      synced.length,
    );

    return NextResponse.json(
      successResponse({
        data: {
          diffs,
          synced_count: synced.length,
          total_legacy: legacyUsers.length,
          total_local: localUsers.total,
        },
        message_th: "ตรวจสอบความแตกต่างข้อมูลสำเร็จ",
        message_en: "Sync check completed",
      }),
    );
  } catch (err: any) {
    syncLogger.error("Sync process error: %s", err.stack);
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล",
        message_en: err.message,
        error: err,
      }),
    );
  }
}
