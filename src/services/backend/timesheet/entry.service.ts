import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

interface CreateTimesheetEntryInput {
  description: string;
  createdBy?: number;
  projectId: number;
  subProjectId: number;
  date: Date;
  hour: number;
  status: string;
}

interface UpdateTimesheetEntryInput {
  description?: string;
  projectId?: number;
  subProjectId?: number;
  date?: Date;
  hour?: number;
  status?: string;
  updatedBy?: number;
}

export const Service = {
  async validatorID(id: number) {
    const find = await PrismaTimesheet.timesheetEntry.findUnique({
      where: { id: id },
    });
    return find !== null;
  },
  // * ดึงข้อมูล Project ทั้งหมด พร้อม pagination
  async findAll(
    opts: { limit?: number; skip?: number } = { limit: 50, skip: 0 }
  ) {
    const [items, total] = await Promise.all([
      PrismaTimesheet.timesheetEntry.findMany({
        take: opts.limit,
        skip: opts.skip,
        orderBy: { createdAt: "desc" },
        include: {
          project: {
            select: {
              id: true,
              name: true, // ✅ จะได้ project_name กลับมาด้วย
            },
          },
          feature: {
            select: {
              id: true,
              name: true, // ✅ จะได้ feature_name กลับมาด้วย
            },
          },
        },
      }),
      PrismaTimesheet.timesheetEntry.count(),
    ]);

    console.info("ITEMS",items)

    return { items, total };
  },

  // * ดึงข้อมูล  ตาม ID พร้อมโครงสร้างข้อมูลแบบเดียวกับ findAll
  async findById(id: number) {
    const timesheetEntry = await PrismaTimesheet.timesheetEntry.findUnique({
      where: { id },
    });
    if (timesheetEntry) {
      return { items: [timesheetEntry], total: 1 };
    } else {
      return { items: [], total: 0 };
    }
  },

  // * สร้าง
  async create(data: CreateTimesheetEntryInput) {
    return await PrismaTimesheet.timesheetEntry.create({
      data: {
        projectId: data.projectId,
        featureId: data.subProjectId,
        hours: data.hour,
        status: data.status,
        description: data.description,
        date: data.date,
        createdBy: data.createdBy ?? 0,
      },
    });
  },

  // * อัปเดต ตาม ID
  async update(id: number, data: UpdateTimesheetEntryInput) {
    if (!id || id <= 0) {
      throw new Error("Invalid id for update");
    }

    return PrismaTimesheet.timesheetEntry.update({
      where: { id },
      data: {
        projectId: data.projectId,
        featureId: data.subProjectId,
        hours: data.hour,
        status: data.status,
        description: data.description,
        date: data.date,
        updatedBy: data.updatedBy ?? 0,
      },
    });
  },

  // * ลบตาม ID
  async delete(id: number, p0: { deletedBy: number }) {
    return await PrismaTimesheet.timesheetEntry.delete({
      where: { id },
    });
  },
};
