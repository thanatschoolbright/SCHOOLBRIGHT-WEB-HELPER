import { NextRequest, NextResponse } from "next/server";
import { UserManagementService } from "../../service/user-management.service";
import { successResponse, errorResponse } from "@/helpers/api/response";
// Assuming you might want to push back to legacy here too?
// But for now, let's implement Import/Update Local from Legacy

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body; // Array of { type, remote, local? }

    const results = [];

    for (const item of items) {
      console.log("Sync executing item:", JSON.stringify(item, null, 2));
      if (item.type === "MISSING_IN_LOCAL") {
        // Create new user in local DB - Map fields explicitly to avoid conflicts
        const newUser = await UserManagementService.create({
          admin_id: item.remote.admin_id,
          username:
            item.remote.username ||
            item.remote.employee_code ||
            `user_${item.remote.admin_id}`,
          password: "default_password",
          employee_code: item.remote.employee_code,
          firstname_th: item.remote.firstname_th,
          lastname_th: item.remote.lastname_th,
          firstname_en: item.remote.firstname_en,
          lastname_en: item.remote.lastname_en,
          nickname: item.remote.nickname,
          email: item.remote.email,
          phone: item.remote.tel || item.remote.phone,
          position: item.remote.position,
          department_id: item.remote.department_id,
          position_id: item.remote.position_id,
          role_id: item.remote.role_id,
          created_by: 0, // System sync
        });
        results.push({
          status: "created",
          id: newUser.id,
          admin_id: item.remote.admin_id,
        });
      } else if (item.type === "MISMATCH") {
        // Update local user to match remote - Map fields explicitly
        if (item.local && item.local.id) {
          const updated = await UserManagementService.update(item.local.id, {
            admin_id: item.remote.admin_id,
            username: item.remote.username,
            employee_code: item.remote.employee_code,
            firstname_th: item.remote.firstname_th,
            lastname_th: item.remote.lastname_th,
            firstname_en: item.remote.firstname_en,
            lastname_en: item.remote.lastname_en,
            nickname: item.remote.nickname,
            email: item.remote.email,
            phone: item.remote.tel || item.remote.phone,
            position: item.remote.position,
            department_id: item.remote.department_id,
            position_id: item.remote.position_id,
            role_id: item.remote.role_id,
            updated_by: 0, // System sync
          });
          results.push({
            status: "updated",
            id: item.local.id,
            admin_id: item.remote.admin_id,
          });
        }
      }
    }

    return NextResponse.json(successResponse({ data: results }));
  } catch (err: any) {
    return NextResponse.json(errorResponse({ error: err }), { status: 500 });
  }
}
