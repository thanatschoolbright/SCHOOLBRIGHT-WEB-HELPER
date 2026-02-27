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

import { logger } from "@/helpers/logger";

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
    },
  ) {
    const [items, total] = await Promise.all([
      PrismaTimesheet.timesheetEntry.findMany({
        take: query.limit,
        skip: query.skip,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        where: { is_deleted: false, createdBy: query.user_id },
        include: {
          project: {
            select: {
              id: true,
              name: true, // จะได้ project_name กลับมาด้วย
            },
          },
          feature: {
            select: {
              id: true,
              name: true, // จะได้ feature_name กลับมาด้วย
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

  // * ดึงข้อมูลทุกคน ผู้ที่ยังไม่กรอก Timesheet วันนี้ (เงื่อนไข วันนี้ยังกรอกไม่ครบ 8 ชั่วโมง)
  async findNotEntryToday() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Find all entries today
    const entries = await PrismaTimesheet.timesheetEntry.findMany({
      where: {
        is_deleted: false,
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        createdBy: true,
        hours: true,
      },
    });

    // Group by createdBy and sum hours
    const userHoursMap: Record<number, number> = {};
    for (const entry of entries) {
      const userId = entry.createdBy ?? 0; // Default to 0 or handle null appropriately
      const hours = Number(entry.hours) || 0;
      if (userId in userHoursMap) {
        userHoursMap[userId] += hours;
      } else {
        userHoursMap[userId] = hours;
      }
    }

    // Build result for all users who have entries today
    return Object.entries(userHoursMap).map(([userIdStr, totalHours]) => {
      const user_id = Number(userIdStr);
      const total_hours = totalHours;
      const remaining_hours = 8 - total_hours;
      let status = "";
      if (total_hours === 0) {
        status = "ยังไม่ได้กรอก";
      } else if (total_hours < 8) {
        status = "กรอกไม่ครบ";
      } else {
        status = "ครบ";
      }
      return {
        user_id,
        total_hours,
        remaining_hours,
        status,
      };
    });
  },

  async findEntriesBetween(
    startDate: Date,
    endDate: Date,
    includeDeleted: boolean = false,
  ) {
    return PrismaTimesheet.timesheetEntry.findMany({
      where: {
        ...(includeDeleted ? {} : { is_deleted: false }),
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdBy: true,
        hours: true,
        date: true,
        description: true,
        project: {
          select: {
            name: true,
            name_en: true,
          },
        },
        feature: {
          select: {
            name: true,
            name_en: true,
            backlogDescription: true,
          },
        },
      },
    });
  },

  async findEntriesForExport(filter: {
    startDate: Date;
    endDate: Date;
    projectId?: number;
    subProjectId?: number;
    createdBy?: number;
  }) {
    const where: any = {
      is_deleted: false,
      date: {
        gte: filter.startDate,
        lte: filter.endDate,
      },
    };

    if (filter.projectId) {
      where.projectId = filter.projectId;
    }

    if (filter.subProjectId) {
      where.featureId = filter.subProjectId;
    }

    if (filter.createdBy) {
      where.createdBy = filter.createdBy;
    }

    return PrismaTimesheet.timesheetEntry.findMany({
      where,
      orderBy: [{ date: "asc" }, { id: "asc" }],
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        feature: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  // * สร้าง
  async create(data: CreateTimesheetEntryInput) {
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
    logger.info("UPDATE ENTRY TIMESHEET");
    if (!id || id <= 0) {
      throw new Error("Invalid id for update");
    }

    const response = PrismaTimesheet.timesheetEntry.update({
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

    logger.info("[UPDATE TIMESHEET ENTRY]", response);

    return response;
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
