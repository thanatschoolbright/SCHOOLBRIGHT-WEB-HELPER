import { NextRequest, NextResponse } from "next/server";
import { LegacyUserService } from "@services/backend/user-management/legacy-user.service";
import { UserManagementService } from "../../service/user-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";

export async function GET(request: NextRequest) {
  try {
    // 1. Fetch Local New Users
    const localUsers = await UserManagementService.findAll({
      page: 1,
      limit: 10000,
    }); // Large limit

    // 2. Fetch Legacy Old Users
    const legacyUsers = await LegacyUserService.fetchLegacyUsers();

    // 3. Map for comparison
    const localMap = new Map(localUsers.items.map((u: any) => [u.admin_id, u]));

    const diffs: any[] = [];
    const synced: any[] = [];

    // 4. Compare Legacy -> Local (Import Check)
    for (const remote of legacyUsers) {
      const legacyId = Number(remote.id || remote.admin_id);
      if (isNaN(legacyId) || legacyId === 0) continue;

      const local = localMap.get(legacyId);

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

      if (!legacyId) continue;

      if (!local) {
        diffs.push({
          type: "MISSING_IN_LOCAL",
          key: legacyId,
          remote: remoteData,
          local: null,
          message: "New user in Legacy System",
        });
      } else {
        // Simple comparison of key fields
        const isDiff =
          (local.username || "") !== (remoteData.username || "") ||
          (local.firstname_th || "") !== (remoteData.firstname_th || "") ||
          (local.lastname_th || "") !== (remoteData.lastname_th || "") ||
          (local.email || "") !== (remoteData.email || "") ||
          (local.phone || "") !== (remoteData.tel || "") ||
          (local.position || "") !== (remoteData.position || "");

        if (isDiff) {
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

    // Optional: Check Local -> Legacy (Missing in Remote?) Not requested but good to know
    // Skipped to focus on "Import" flow

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
    return NextResponse.json(
      errorResponse({
        message_th: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล",
        message_en: err.message,
        error: err,
      }),
    );
  }
}
