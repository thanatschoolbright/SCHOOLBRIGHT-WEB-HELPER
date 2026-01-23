import { PrismaTimesheet } from "@helpers/prisma-timesheet";
import { transformFeature } from "./sub-project/sub-project.service";

const calculateWorkingDays = (
  startDate: Date | null,
  endDate: Date | null,
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
  // * กรองรายชื่อผู้รับผิดชอบที่ไม่ซ้ำกัน (Distinct by userId)
  const uniqueAssigneesMap = new Map();
  if (project.projectAssignees) {
    project.projectAssignees.forEach((assignee: any) => {
      if (!uniqueAssigneesMap.has(assignee.userId)) {
        uniqueAssigneesMap.set(assignee.userId, assignee);
      }
    });
  }
  const uniqueAssignees = Array.from(uniqueAssigneesMap.values());

  const assigneesCount = uniqueAssignees.length;
  const workingDays = calculateWorkingDays(
    project.start_date,
    project.end_date,
  );
  const estimate_hour = assigneesCount * 8 * workingDays;

  return {
    ...project,
    projectAssignees: uniqueAssignees,
    estimate_hour,
    completeDate: project.completeDate,
    estimateWorkhours: project.estimateWorkhours,
    assetCaptureType: project.assetCaptureType,
    features: project.features
      ? project.features.map(transformFeature)
      : project.features,
  };
};

export const Service = {
  // * ดึงข้อมูล Project ทั้งหมด พร้อม pagination
  async findAll(
    opts: { limit?: number; skip?: number } = { limit: 50, skip: 0 },
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
    projectStatusId?: number | null;
    completeDate?: string | null;
    estimateWorkhours?: number | null;
    assetCaptureType?: any;
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
        projectStatusId: data.projectStatusId,
        projectAssignees: data.assignees
          ? {
              create: data.assignees.map((a) => ({
                userId: a.userId,
                position: a.position,
              })),
            }
          : undefined,
        completeDate: data.completeDate,
        estimateWorkhours: data.estimateWorkhours,
        assetCaptureType: data.assetCaptureType,
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
      projectStatusId?: number | null;
      completeDate?: string | null;
      estimateWorkhours?: number | null;
      assetCaptureType?: string;
      assignees?: { userId: number; position?: string }[];
    },
  ) {
    const { assignees, ...projectData } = data;
    return await PrismaTimesheet.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        categoryType: data.categoryType,
        status: data.status,
        name_en: data.name_en,
        start_date: data.start_date,
        end_date: data.end_date,
        projectStatusId: data.projectStatusId,
        completeDate: data.completeDate,
        estimateWorkhours: data.estimateWorkhours,
        assetCaptureType: data.assetCaptureType as any,
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

  // * คำนวณสถิติต่างๆ ของโปรเจกต์
  async getStats() {
    const validProjects = await PrismaTimesheet.project.findMany({
      where: { is_deleted: false },
      include: { projectStatus: true },
    });

    const total = validProjects.length;
    const active = validProjects.filter((p) => p.status === "open").length;
    const closed = validProjects.filter((p) => p.status === "close").length;
    const successRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    // Detailed stats by status name (English for API standardization)
    const trackings: Record<string, number> = {};
    validProjects.forEach((p) => {
      const statusKey = p.projectStatus?.nameEn || p.status || "unspecified";
      if (statusKey !== "close" && statusKey !== "Closed") {
        trackings[statusKey] = (trackings[statusKey] || 0) + 1;
      }
    });

    // Stats by Category
    const byCategory: Record<string, number> = {};
    validProjects.forEach((p) => {
      if (p.categoryType) {
        byCategory[p.categoryType] = (byCategory[p.categoryType] || 0) + 1;
      }
    });

    return {
      health: {
        total,
        open: active,
        close: closed,
        success_rate: successRate,
      },
      trackings,
      by_category: byCategory,
      by_asset_capture: {
        CAPTUREABLE: validProjects.filter(
          (p: any) =>
            p.assetCaptureType === "CAPTUREABLE" || p.assetCaptureType === null,
        ).length,
        UN_CAPTUREABLE: validProjects.filter(
          (p: any) => p.assetCaptureType === "UN_CAPTUREABLE",
        ).length,
      },
    };
  },
};
