import { UserManagementService } from "@/app/api/v2/admin/user-management/service/user-management.service";
import { errorResponse, successResponse } from "@/helpers/api/response";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";

/**
 * API ค้นหารายชื่อพนักงานเพื่อมอบหมายงาน (Assignee Search)
 * ใช้สำหรับฟิลด์ "ทีมงานผู้รับผิดชอบ" ในหน้า Sub Project
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const idsString = searchParams.get("ids") || "";

    // กรณีขอข้อมูลด้วย IDs เจาะจง (ใช้เมื่อโหลดข้อมูลเริ่มต้นในโหมด Edit)
    if (idsString) {
      const ids = idsString
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
      if (ids.length > 0) {
        const users = await PrismaTimesheet.user.findMany({
          where: {
            admin_id: { in: ids },
            is_deleted: false,
          },
          include: { position_ref: true, department: true, role: true },
        });

        const formattedData = users.map((u: any) => ({
          admin_id: u.admin_id,
          username: u.username,
          employee_code: u.employee_code,
          firstname_th: u.firstname_th,
          lastname_th: u.lastname_th,
          firstname_en: u.firstname_en,
          lastname_en: u.lastname_en,
          nickname: u.nickname,
          email: u.email,
          phone: u.phone,
          status: u.status,
          position_id: u.position_id,
          department_id: u.department_id,
          role_id: u.role_id,
          joined_date: u.joined_date,
          firstname: u.firstname_th || u.firstname_en || "",
          lastname: u.lastname_th || u.lastname_en || "",
          position: u.position_ref?.name_th || u.position || "พนักงาน",
        }));

        return NextResponse.json(successResponse({ data: formattedData }));
      }
    }

    // ค้นหาพนักงานปกติ
    const cleanQuery = query.trim();

    // หากเป็นตัวเลขอย่างเดียว ให้พยายามหาจาก admin_id ตรงๆ ด้วย
    const adminIdQuery = parseInt(cleanQuery);

    const result = await UserManagementService.findAll({
      search: cleanQuery,
      limit: 50,
    });

    // แปลงรูปแบบข้อมูลให้ตรงกับที่ Frontend ต้องการ (คืนข้อมูลพนักงานแบบแบนราบ เพื่อป้องกัน Circular Reference)
    let formattedData = result.items.map((u: any) => ({
      admin_id: u.admin_id,
      username: u.username,
      employee_code: u.employee_code,
      firstname_th: u.firstname_th,
      lastname_th: u.lastname_th,
      firstname_en: u.firstname_en,
      lastname_en: u.lastname_en,
      nickname: u.nickname,
      email: u.email,
      phone: u.phone,
      status: u.status,
      position_id: u.position_id,
      department_id: u.department_id,
      role_id: u.role_id,
      joined_date: u.joined_date,
      firstname: u.firstname_th || u.firstname_en || "",
      lastname: u.lastname_th || u.lastname_en || "",
      position: u.position_ref?.name_th || u.position || "พนักงาน",
    }));

    // ถ้ายังไม่เจอ และ query เป็นตัวเลข ให้ลองหาด้วย admin_id ตรงๆ
    if (formattedData.length === 0 && !isNaN(adminIdQuery)) {
      const directUser =
        await UserManagementService.findByAdminId(adminIdQuery);
      if (directUser && !directUser.is_deleted) {
        formattedData = [
          {
            admin_id: directUser.admin_id,
            username: directUser.username,
            employee_code: directUser.employee_code,
            firstname_th: directUser.firstname_th,
            lastname_th: directUser.lastname_th,
            firstname_en: directUser.firstname_en,
            lastname_en: directUser.lastname_en,
            nickname: directUser.nickname,
            email: directUser.email,
            phone: directUser.phone,
            status: directUser.status,
            position_id: directUser.position_id,
            department_id: directUser.department_id,
            role_id: directUser.role_id,
            joined_date: directUser.joined_date,
            firstname: directUser.firstname_th || directUser.firstname_en || "",
            lastname: directUser.lastname_th || directUser.lastname_en || "",
            position:
              (directUser as any).position_ref?.name_th ||
              (directUser as any).position ||
              "พนักงาน",
          },
        ];
      }
    }

    return NextResponse.json(successResponse({ data: formattedData }));
  } catch (error: any) {
    console.error("Assignee search failed:", error);
    return NextResponse.json(
      errorResponse({
        message_th: "ไม่สามารถค้นหารายชื่อทีมงานได้",
        message_en: "Failed to search for team members",
        error,
      }),
    );
  }
}
