import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { UserResponse } from "../validation/users.validation";

/* ✨ Service Class สำหรับ Users API */
export class UsersService {
  private prisma = PrismaTimesheet;

  /* ✨ ดึงรายชื่อ User ทั้งหมดแบบ Simple (GET) */
  async findAllUsers(search: string = ""): Promise<UserResponse[]> {
    try {
      const whereCondition = this.buildWhereCondition(search);

      const users = await this.prisma.user.findMany({
        select: {
          admin_id: true,
          firstname_en: true,
          firstname_th: true,
          lastname_en: true,
          lastname_th: true,
          nickname: true,
          employee_code: true,
        },
        where: whereCondition,
        orderBy: [{ firstname_th: "asc" }, { lastname_th: "asc" }],
        take: 100,
      });

      return users;
    } catch (error) {
      throw new Error(
        `Failed to fetch users: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /* ✨ ดึงรายชื่อ User พร้อม Pagination (POST) */
  async findUsersWithPagination(
    search: string = "",
    limit: number = 50,
    page: number = 1,
  ): Promise<{ users: UserResponse[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const whereCondition = this.buildWhereCondition(search);

      /* 🚀 Query DB แบบ Parallel เพื่อประสิทธิภาพที่ดีขึ้น */
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          select: {
            admin_id: true,
            firstname_en: true,
            firstname_th: true,
            lastname_en: true,
            lastname_th: true,
            nickname: true,
            employee_code: true,
          },
          where: whereCondition,
          orderBy: [{ firstname_th: "asc" }, { lastname_th: "asc" }],
          skip,
          take: limit,
        }),
        this.prisma.user.count({
          where: whereCondition,
        }),
      ]);

      return { users, total };
    } catch (error) {
      throw new Error(
        `Failed to fetch users with pagination: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /* 🛡️ สร้าง WHERE Condition สำหรับ Search */
  private buildWhereCondition(search: string) {
    return {
      status: "ACTIVE",
      is_deleted: false,
      ...(search && {
        OR: [
          { firstname_en: { contains: search, mode: "insensitive" as const } },
          {
            firstname_th: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          { lastname_en: { contains: search, mode: "insensitive" as const } },
          {
            lastname_th: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          { nickname: { contains: search, mode: "insensitive" as const } },
          {
            employee_code: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }),
    };
  }
}

/* ✨ Export Singleton Instance */
export const usersService = new UsersService();
