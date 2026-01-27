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
        // Create new user in local DB
        const newUser = await UserManagementService.create({
          ...item.remote,
          password: "default_password",
          username:
            item.remote.employee_code ||
            item.remote.username ||
            `user_${item.remote.admin_id}`,
        });
        results.push({
          status: "created",
          id: newUser.id,
          admin_id: item.remote.admin_id,
        });
      } else if (item.type === "MISMATCH") {
        // Update local user to match remote
        if (item.local && item.local.id) {
          const updated = await UserManagementService.update(item.local.id, {
            ...item.remote,
            // Ensure any other required fields for update are present or handled
            updated_by: 0, // System update
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
