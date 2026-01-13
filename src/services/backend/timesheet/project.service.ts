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
        include: { features: true, projectAssignees: true },
      }),
      PrismaTimesheet.project.count(),
    ]);
    return { items, total };
  },

  // * ดึงข้อมูล Project ตาม ID พร้อมโครงสร้างข้อมูลแบบเดียวกับ findAll
  async findById(id: number) {
    const project = await PrismaTimesheet.project.findFirst({
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
    categoryType: string;
    name_en?: string;
    start_date?: string;
    end_date?: string;
    createdBy?: number;
    status?: string;
    assignees?: { userId: number; position?: string }[];
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
        projectAssignees: data.assignees
          ? {
              create: data.assignees.map((a) => ({
                userId: a.userId,
                position: a.position,
              })),
            }
          : undefined,
      },
    });
  },

  // * อัปเดต Project ตาม ID
  // * อัปเดต Project ตาม ID
  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      updatedBy?: number;
      categoryType?: string;
      status?: string;
      start_date?: string;
      end_date?: string;
      name_en?: string;
      assignees?: { userId: number; position?: string }[];
    }
  ) {
    const { assignees, ...projectData } = data;
    return await PrismaTimesheet.project.update({
      where: { id },
      data: {
        ...projectData,
        updatedBy: data.updatedBy ?? 0,
        projectAssignees: assignees
          ? {
              deleteMany: {},
              create: assignees.map((a) => ({
                userId: a.userId,
                position: a.position,
              })),
            }
          : undefined,
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
