import { PrismaTimesheet } from "@helpers/prisma-timesheet";

export const Service = {
  // * ดึงข้อมูล Project ทั้งหมด พร้อม pagination
  async findAll(
    opts: { limit?: number; skip?: number } = { limit: 50, skip: 0 }
  ) {
    const [items, total] = await Promise.all([
      PrismaTimesheet.project.findMany({
        where: { is_deleted: false },
        take: opts.limit,
        skip: opts.skip,
        orderBy: { createdAt: "desc" },
        include: { features: true },
      }),
      PrismaTimesheet.project.count({ where: { is_deleted: false } }),
    ]);
    return { items, total };
  },

  // * ดึงข้อมูล Project ตาม ID พร้อมโครงสร้างข้อมูลแบบเดียวกับ findAll
  async findById(id: number) {
    const project = await PrismaTimesheet.project.findFirst({
      where: { id, is_deleted: false },
    });
    if (project) {
      return { items: [project], total: 1 };
    } else {
      return { items: [], total: 0 };
    }
  },

  // * สร้าง Project ใหม่
  async create(data: {
    name: string;
    description: string;
    categoryType: string;
    name_en?: string;
    start_date?: string;
    end_date?: string;
    createdBy?: number;
    status?: string;
  }) {
    return await PrismaTimesheet.project.create({
      data: {
        name: data.name,
        description: data.description,
        categoryType: data.categoryType,
        name_en: data.name_en,
        start_date: data.start_date,
        end_date: data.end_date,
        createdBy: data.createdBy !== undefined ? data.createdBy : 0,
        status: data.status !== undefined ? data.status : "open",
      },
    });
  },

  // * อัปเดต Project ตาม ID
  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      updatedBy?: number;
      categoryType?: string;
      status?: string;
    }
  ) {
    return await PrismaTimesheet.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        updatedBy: data.updatedBy !== undefined ? data.updatedBy : 0,
        ...(data.categoryType && { categoryType: data.categoryType }),
        ...(data.status && { status: data.status }),
      },
    });
  },

  // * ลบ Project ตาม ID
  async delete(id: number, query: { deletedBy: number }) {
    return await PrismaTimesheet.project.update({
      where: { id },
      data: {
        is_deleted: true,
        updatedBy: query.deletedBy,
      },
    });
  },
};
