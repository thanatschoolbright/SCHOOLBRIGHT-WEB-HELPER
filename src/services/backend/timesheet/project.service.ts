import { PrismaTimesheet } from "@helpers/prisma-timesheet";

export const Service = {
  // * ดึงข้อมูล Project ทั้งหมด พร้อม pagination
  async findAll(
    opts: { limit?: number; skip?: number } = { limit: 50, skip: 0 }
  ) {
    const [items, total] = await Promise.all([
      PrismaTimesheet.project.findMany({
        take: opts.limit,
        skip: opts.skip,
        orderBy: { createdAt: "desc" },
      }),
      PrismaTimesheet.project.count(),
    ]);
    return { items, total };
  },

  // * ดึงข้อมูล Project ตาม ID พร้อมโครงสร้างข้อมูลแบบเดียวกับ findAll
  async findById(id: number) {
    const project = await PrismaTimesheet.project.findUnique({
      where: { id },
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
    createdBy?: number;
  }) {
    return await PrismaTimesheet.project.create({
      data: {
        name: data.name,
        description: data.description,
        createdBy: data.createdBy !== undefined ? data.createdBy : 0,
      },
    });
  },

  // * อัปเดต Project ตาม ID
  async update(
    id: number,
    data: { name?: string; description?: string; updatedBy?: number }
  ) {
    return await PrismaTimesheet.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        updatedBy: data.updatedBy !== undefined ? data.updatedBy : 0,
      },
    });
  },

  // * ลบ Project ตาม ID
  async delete(id: number, p0: { deletedBy: number }) {
    return await PrismaTimesheet.project.delete({
      where: { id },
    });
  },
};
