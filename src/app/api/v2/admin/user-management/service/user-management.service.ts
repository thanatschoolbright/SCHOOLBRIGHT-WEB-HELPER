import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export interface CreateUserDto {
  username: string;
  password: string;
  admin_id: number;
  employee_code?: string;
  firstname_th?: string;
  lastname_th?: string;
  firstname_en?: string;
  lastname_en?: string;
  nickname?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  role_id?: number;
  position_id?: number;
  profile_image?: string;
  created_by?: number;
}

export interface UpdateUserDto {
  username?: string;
  password?: string;
  admin_id?: number;
  employee_code?: string;
  firstname_th?: string;
  lastname_th?: string;
  firstname_en?: string;
  lastname_en?: string;
  nickname?: string;
  position?: string;
  department?: string;
  status?: string;
  email?: string;
  phone?: string;
  role_id?: number;
  position_id?: number;
  profile_image?: string;
  updated_by?: number;
}

export const UserManagementService = {
  // สร้างผู้ใช้งานใหม่
  async create(data: CreateUserDto) {
    return await PrismaTimesheet.user.create({
      data: {
        username: data.username,
        password: data.password,
        admin_id: Number(data.admin_id),
        employee_code: data.employee_code,
        firstname_th: data.firstname_th,
        lastname_th: data.lastname_th,
        firstname_en: data.firstname_en,
        lastname_en: data.lastname_en,
        nickname: data.nickname,
        department: data.department,
        email: data.email,
        phone: data.phone || (data as any).tel,
        status: "ACTIVE",
        role_id: data.role_id ?? undefined,
        position_id: data.position_id ?? undefined,
        profile_image_path: data.profile_image,
      },
    });
  },

  // อัปเดตข้อมูลผู้ใช้งาน
  async update(id: number, data: UpdateUserDto) {
    return await PrismaTimesheet.user.update({
      where: { id },
      data: {
        username: data.username,
        admin_id: data.admin_id ? Number(data.admin_id) : undefined,
        employee_code: data.employee_code,
        firstname_th: data.firstname_th,
        lastname_th: data.lastname_th,
        firstname_en: data.firstname_en,
        lastname_en: data.lastname_en,
        nickname: data.nickname,
        department: data.department,
        email: data.email,
        phone: data.phone || (data as any).tel,
        status: data.status,
        role_id: data.role_id ?? undefined,
        position_id: data.position_id ?? undefined,
        profile_image_path: data.profile_image,
        updated_at: new Date(),
      },
    });
  },

  // ลบผู้ใช้งาน (Soft Delete)
  async delete(id: number, deletedBy?: number) {
    return await PrismaTimesheet.user.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        updated_by: deletedBy, // Assuming updated_by can be used for who deleted it or add a deleted_by field if Schema supports it.
        // Schema has deleted_at but not explicit deleted_by. We can use updated_by.
      },
    });
  },

  // ดึงข้อมูลผู้ใช้งานตาม ID
  async findById(id: number) {
    return await PrismaTimesheet.user.findFirst({
      where: { id, is_deleted: false },
      include: {
        role: true,
        position_ref: true,
      },
    });
  },

  // ดึงข้อมูลผู้ใช้งานทั้งหมด (รองรับ Pagination & Search)
  async findAll({
    page = 1,
    limit = 50,
    search = "",
    status,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const skip = (page - 1) * limit;
    const where: any = {
      is_deleted: false,
    };

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { firstname_th: { contains: search, mode: "insensitive" } },
        { lastname_th: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employee_code: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      PrismaTimesheet.user.findMany({
        where,
        take: limit,
        skip,
        orderBy: { created_at: "desc" },
        include: { role: true },
      }),
      PrismaTimesheet.user.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findConstants() {
    const roles = await PrismaTimesheet.role.findMany({
      where: { is_deleted: false, is_active: true },
    });
    return { roles };
  },
};
