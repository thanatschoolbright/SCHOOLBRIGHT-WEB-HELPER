import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import bcrypt from "bcryptjs";

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
  department_id?: number | null;
  email?: string;
  phone?: string;
  role_id?: number | null;
  position_id?: number | null;
  profile_image?: string | null;
  created_by?: number | null;
  joined_date?: string | Date | null;
  resigned_date?: string | Date | null;
  employment_type?: string | null;
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
  department_id?: number | null;
  status?: string;
  email?: string;
  phone?: string;
  role_id?: number | null;
  position_id?: number | null;
  profile_image?: string | null;
  updated_by?: number | null;
  joined_date?: string | Date | null;
  resigned_date?: string | Date | null;
  employment_type?: string | null;
}

export const UserManagementService = {
  // สร้างผู้ใช้งานใหม่
  async create(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await PrismaTimesheet.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        admin_id: Number(data.admin_id),
        employee_code: data.employee_code,
        firstname_th: data.firstname_th,
        lastname_th: data.lastname_th,
        firstname_en: data.firstname_en,
        lastname_en: data.lastname_en,
        nickname: data.nickname,
        department_id: data.department_id ?? undefined,
        email: data.email,
        phone: data.phone || (data as any).tel,
        status: "ACTIVE",
        role_id: data.role_id ?? undefined,
        position_id: data.position_id ?? undefined,
        profile_image_path: data.profile_image,
        joined_date: data.joined_date ? new Date(data.joined_date) : undefined,
        resigned_date: data.resigned_date
          ? new Date(data.resigned_date)
          : undefined,
        employment_type: data.employment_type || "FULL_TIME",
      },
    });
  },

  // อัปเดตข้อมูลผู้ใช้งาน
  async update(id: number, data: UpdateUserDto) {
    const updateData: any = {
      username: data.username,
      admin_id: data.admin_id ? Number(data.admin_id) : undefined,
      employee_code: data.employee_code,
      firstname_th: data.firstname_th,
      lastname_th: data.lastname_th,
      firstname_en: data.firstname_en,
      lastname_en: data.lastname_en,
      nickname: data.nickname,
      department_id: data.department_id ?? undefined,
      email: data.email,
      phone: data.phone || (data as any).tel,
      status: data.status,
      role_id: data.role_id ?? undefined,
      position_id: data.position_id ?? undefined,
      profile_image_path: data.profile_image,
      joined_date: data.joined_date ? new Date(data.joined_date) : undefined,
      resigned_date: data.resigned_date
        ? new Date(data.resigned_date)
        : undefined,
      employment_type: data.employment_type,
      updated_at: new Date(),
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return await PrismaTimesheet.user.update({
      where: { id },
      data: updateData,
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
        department: true,
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
        include: { role: true, position_ref: true, department: true },
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
