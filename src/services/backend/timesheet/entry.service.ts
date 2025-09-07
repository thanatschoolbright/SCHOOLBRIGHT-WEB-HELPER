import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export const Service = {
  // * ดึงข้อมูล Project ทั้งหมด พร้อม pagination
  async findAll(
    opts: { limit?: number; skip?: number } = { limit: 50, skip: 0 }
  ) {
    const [items, total] = await Promise.all([
      PrismaTimesheet.timesheetEntry.findMany({
        take: opts.limit,
        skip: opts.skip,
        orderBy: { createdAt: "desc" },
      }),
      PrismaTimesheet.timesheetEntry.count(),
    ]);
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
  async create(data: {
    name: string;
    description: string;
    createdBy?: number;
    projectId: number;
    subProjectId: number;
    date: Date;
    hour: number;
    status: string;
  }) {
    return await PrismaTimesheet.timesheetEntry.create({
      data: {
        projectId: data.projectId,
        featureId: data.subProjectId,
        hours: data.hour,
        status: data.status,
        description: data.description,
        date: data.date,
        createdBy: data.createdBy !== undefined ? data.createdBy : 0,
      },
    });
  },

  // * อัปเดต ตาม ID
  async update(
    id: number,
    data: {
      description?: string;
      projectId?: number;
      subProjectId?: number;
      date?: Date;
      hour?: number;
      status?: string;
      updatedBy?: number;
    }
  ) {
    return await PrismaTimesheet.timesheetEntry.update({
      where: { id },
      data: {
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.subProjectId !== undefined && {
          featureId: data.subProjectId,
        }),
        ...(data.hour !== undefined && { hours: data.hour }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.date !== undefined && { date: data.date }),
        updatedBy: data.updatedBy !== undefined ? data.updatedBy : 0,
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
