import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export interface CreateDepartmentDto {
  name_th: string;
  name_en?: string;
  is_active?: boolean;
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {
  id: number;
}

export const DepartmentManagementService = {
  // Create
  async create(data: CreateDepartmentDto) {
    return await PrismaTimesheet.department.create({
      data: {
        ...data,
        is_active: data.is_active ?? true,
      },
    });
  },

  // Update
  async update(id: number, data: Omit<UpdateDepartmentDto, "id">) {
    return await PrismaTimesheet.department.update({
      where: { id },
      data: {
        ...data,
      },
    });
  },

  // Soft Delete
  async delete(id: number) {
    return await PrismaTimesheet.department.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
      },
    });
  },

  // Find All (with pagination & search)
  async findAll({ page = 1, limit = 50, search = "", isActive }: any) {
    const skip = (page - 1) * limit;
    const where: any = {
      is_deleted: false,
    };

    if (search) {
      where.OR = [
        { name_th: { contains: search, mode: "insensitive" } },
        { name_en: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined && isActive !== null && isActive !== "") {
      where.is_active = isActive === "true" || isActive === true;
    }

    const [items, total] = await Promise.all([
      PrismaTimesheet.department.findMany({
        where,
        take: Number(limit),
        skip: Number(skip),
        orderBy: { created_at: "desc" },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      PrismaTimesheet.department.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  // Find One
  async findById(id: number) {
    return await PrismaTimesheet.department.findFirst({
      where: { id, is_deleted: false },
    });
  },

  // Get Members
  async getMembers(departmentId: number) {
    return await PrismaTimesheet.user.findMany({
      where: {
        department_id: departmentId,
        is_deleted: false,
      },
      select: {
        id: true,
        employee_code: true,
        firstname_th: true,
        lastname_th: true,
        firstname_en: true,
        lastname_en: true,
        nickname: true,
        email: true,
        status: true,
        position_ref: {
          select: {
            name_th: true,
            name_en: true,
          },
        },
        role: {
          select: {
            role_name: true,
          },
        },
      },
      orderBy: {
        employee_code: "asc",
      },
    });
  },

  // Seed Departments
  async seedDepartments() {
    const departments = [
      { name_th: "บริหารงานทั่วไป", name_en: "General Administration" },
      { name_th: "เทคโนโลยีสารสนเทศ", name_en: "Information Technology" },
      { name_th: "ทรัพยากรบุคคล", name_en: "Human Resources" },
      { name_th: "บัญชีและการเงิน", name_en: "Accounting and Finance" },
      { name_th: "การตลาด", name_en: "Marketing" },
      { name_th: "ฝ่ายขาย", name_en: "Sales" },
      { name_th: "พัฒนาผลิตภัณฑ์", name_en: "Product Development" },
      { name_th: "วิศวกรรม", name_en: "Engineering" },
      { name_th: "ประกันคุณภาพ", name_en: "Quality Assurance" },
      { name_th: "บริการลูกค้า", name_en: "Customer Service" },
      { name_th: "วิจัยและพัฒนา", name_en: "Research and Development" },
      { name_th: "ฝ่ายปฏิบัติการ", name_en: "Operations" },
    ];

    let createdCount = 0;

    for (const dept of departments) {
      const exists = await PrismaTimesheet.department.findFirst({
        where: {
          name_th: dept.name_th,
          is_deleted: false,
        },
      });

      if (!exists) {
        await PrismaTimesheet.department.create({
          data: {
            ...dept,
            is_active: true,
          },
        });
        createdCount++;
      }
    }

    return createdCount;
  },
};
