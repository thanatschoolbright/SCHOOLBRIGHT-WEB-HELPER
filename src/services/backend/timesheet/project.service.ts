import { PrismaTimesheet } from "@helpers/prisma-timesheet";

const calculateWorkingDays = (
  startDate: Date | null,
  endDate: Date | null
): number => {
  if (!startDate || !endDate) return 0;

  let count = 0;
  const curDate = new Date(startDate);
  const finalDate = new Date(endDate);

  // Set to midnight to avoid issues with time
  curDate.setHours(0, 0, 0, 0);
  finalDate.setHours(0, 0, 0, 0);

  while (curDate <= finalDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday (0) or Saturday (6)
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

const withEstimateHours = (project: any) => {
  const assigneesCount = project.projectAssignees?.length || 0;
  const workingDays = calculateWorkingDays(
    project.start_date,
    project.end_date
  );
  const estimate_hour = assigneesCount * 8 * workingDays;

  return {
    ...project,
    estimate_hour,
  };
};

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
    return {
      items: items.map(withEstimateHours),
      total,
    };
  },

  // * ดึงข้อมูล Project ตาม ID พร้อมโครงสร้างข้อมูลแบบเดียวกับ findAll
  async findById(id: number) {
    const project = await PrismaTimesheet.project.findFirst({
      where: { id },
      include: { features: true, projectAssignees: true },
    });
    if (project) {
      return { items: [withEstimateHours(project)], total: 1 };
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
