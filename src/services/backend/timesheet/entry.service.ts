import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

interface CreateTimesheetEntryInput {
  description?: string;
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
    query: { limit?: number; skip?: number; user_id?: number } = {
      limit: 50,
      skip: 0,
    }
  ) {
    const [items, total] = await Promise.all([
      PrismaTimesheet.timesheetEntry.findMany({
        take: query.limit,
        skip: query.skip,
        orderBy: { createdAt: "desc" },
        where: { is_deleted: false, createdBy: query.user_id },
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
      PrismaTimesheet.timesheetEntry.count({
        where: { is_deleted: false, createdBy: query.user_id },
      }),
    ]);

    return { items, total };
  },

  // * ดึงข้อมูล  ตาม ID พร้อมโครงสร้างข้อมูลแบบเดียวกับ findAll
  async findById(id: number) {
    const data = await PrismaTimesheet.timesheetEntry.findFirst({
      where: { id, is_deleted: false },
    });

    if (data) {
      return { items: [data], total: 1 };
    } else {
      return { items: [], total: 0 };
    }
  },

  // * สร้าง
  async create(data: CreateTimesheetEntryInput) {
    console.log("CREATE ENTRY TIMESHEET");

    return await PrismaTimesheet.timesheetEntry.create({
      data: {
        projectId: data.projectId,
        featureId: data.subProjectId,
        hours: data.hour,
        status: data.status,
        description: data.description ?? "",
        date: data.date,
        createdBy: data.createdBy ?? 0,
      },
    });
  },

  // * อัปเดต ตาม ID
  async update(id: number, data: UpdateTimesheetEntryInput) {
    console.log("UPDATE ENTRY TIMESHEET");
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
    return await PrismaTimesheet.timesheetEntry.update({
      where: { id },
      data: {
        is_deleted: true,
        updatedBy: p0.deletedBy,
      },
    });
  },
};
