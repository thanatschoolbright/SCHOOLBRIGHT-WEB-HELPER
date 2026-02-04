import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import dayjs from "dayjs";

export type SubProjectAssetCaptureType = "CAPTUREABLE" | "UN_CAPTUREABLE";

// ฟังก์ชันคำนวณ Man Hour จากวันที่เริ่มต้นถึงสิ้นสุด
// สูตร: จำนวนคน x 8 ชม./วัน x 22 วันทำงาน/เดือน
const calculateEstimateManHours = (
  startDate: Date | string | null,
  endDate: Date | string | null,
  numberOfPeople: number = 1,
): number => {
  if (!startDate || !endDate) return 0;

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
    return 0;
  }

  // คำนวณจำนวนเดือนระหว่างสองวัน
  const months = end.diff(start, "month", true); // true = รวมเศษส่วนของเดือน

  // สูตร: จำนวนคน x 8 ชั่วโมง/วัน x 22 วัน/เดือน x จำนวนเดือน
  const estimatedHours = Math.ceil(numberOfPeople * 8 * 22 * months);

  return estimatedHours > 0 ? estimatedHours : 0;
};

export const transformFeature = (item: any) => ({
  ...item,
  estimate_sub_feature_workhours: calculateEstimateManHours(
    item.startDate,
    item.endDate,
    item.projectAssignees?.length || 1,
  ),
});

interface PaginationOptions {
  limit?: number;
  skip?: number;
}

interface CreateFeatureDto {
  projectId: number;
  name: string;
  name_en?: string | null;
  ticket_number?: string | null;
  createdBy?: number;
  backlogDescription?: any;
  startDate: Date | string;
  endDate: Date | string;
  assetCaptureType?: SubProjectAssetCaptureType;
  status?: string;
  projectStatusId?: number | null;
  completeDate?: Date | string | null;
  estimateWorkhours?: number | null;
  assignees?: { userId: number; position?: string | null }[];
}

interface UpdateFeatureDto {
  name?: string;
  name_en?: string | null;
  ticket_number?: string | null;
  updatedBy?: number;
  backlogDescription?: any;
  startDate?: Date | string;
  endDate?: Date | string;
  assetCaptureType?: SubProjectAssetCaptureType;
  status?: string;
  projectStatusId?: number | null;
  completeDate?: Date | string | null;
  estimateWorkhours?: number | null;
  projectId?: number;
  assignees?: { userId: number; position?: string | null }[];
}

export const Service = {
  /* ✨ ตรวจสอบความถูกต้องของ Project ID */
  async validateProjectId(projectId: number) {
    return await PrismaTimesheet.project.findUnique({
      where: { id: projectId },
      select: { id: true, is_deleted: true },
    });
  },

  /* ✨ ตรวจสอบความถูกต้องของ Sub-Project (Feature) ID */
  async validateSubProjectId(subProjectId: number) {
    return await PrismaTimesheet.feature.findUnique({
      where: { id: subProjectId },
      select: { id: true, is_deleted: true },
    });
  },

  /* ✨ ค้นหาโครงการย่อยทั้งหมด พร้อมคำนวณ Man Hour */
  async findAll({ limit = 50, skip = 0 }: PaginationOptions = {}) {
    const where = { is_deleted: false };

    const [items, total] = await Promise.all([
      PrismaTimesheet.feature.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: { projectAssignees: true, projectStatus: true },
      }),
      PrismaTimesheet.feature.count({ where }),
    ]);

    // เพิ่มการคำนวณ estimate_sub_feature_workhours
    const itemsWithEstimate = items.map((item) => ({
      ...item,
      estimate_sub_feature_workhours: calculateEstimateManHours(
        item.startDate,
        item.endDate,
        item.projectAssignees?.length || 1,
      ),
    }));

    return { items: itemsWithEstimate, total };
  },

  async findById(id: number) {
    const feature = await PrismaTimesheet.feature.findFirst({
      where: { id, is_deleted: false },
      include: { projectAssignees: true, projectStatus: true },
    });

    if (!feature) {
      return { items: [], total: 0 };
    }

    return { items: [transformFeature(feature)], total: 1 };
  },

  async findByProjectId(
    projectId: number,
    { limit, skip = 0 }: PaginationOptions = {},
  ) {
    const where = { projectId, is_deleted: false };

    const [items, total] = await Promise.all([
      PrismaTimesheet.feature.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: { projectAssignees: true, projectStatus: true },
      }),
      PrismaTimesheet.feature.count({ where }),
    ]);

    // เพิ่มการคำนวณ estimate_sub_feature_workhours
    const itemsWithEstimate = items.map((item) => ({
      ...item,
      estimate_sub_feature_workhours: calculateEstimateManHours(
        item.startDate,
        item.endDate,
        item.projectAssignees?.length || 1,
      ),
    }));

    return { items: itemsWithEstimate, total };
  },

  /* ✨ สร้างโครงการย่อยใหม่พร้อมกำหนดผู้รับผิดชอบ */
  async create(data: CreateFeatureDto) {
    const { assignees, ...rest } = data;
    return await PrismaTimesheet.feature.create({
      data: {
        ...rest,
        createdBy: data.createdBy ?? 0,
        assetCaptureType: data.assetCaptureType ?? "CAPTUREABLE",
        projectAssignees: {
          create: assignees?.map((a) => ({
            userId: a.userId,
            position: a.position,
            projectId: data.projectId,
          })),
        },
      },
      include: { projectAssignees: true, projectStatus: true },
    });
  },

  /* ✨ อัปเดตข้อมูลโครงการย่อยและจัดการข้อมูลผู้รับผิดชอบใหม่ */
  async update(id: number, data: UpdateFeatureDto) {
    const { assignees, ...rest } = data;

    // Handle assignees update: delete old ones and create new ones
    if (assignees) {
      // Get the projectId for this feature first
      const feature = await PrismaTimesheet.feature.findUnique({
        where: { id },
        select: { projectId: true },
      });

      if (feature) {
        await PrismaTimesheet.projectAssignee.deleteMany({
          where: { featureId: id },
        });

        if (assignees.length > 0) {
          await PrismaTimesheet.projectAssignee.createMany({
            data: assignees.map((a) => ({
              userId: a.userId,
              position: a.position,
              projectId: data.projectId ?? feature.projectId,
              featureId: id,
            })),
          });
        }
      }
    }

    return await PrismaTimesheet.feature.update({
      where: { id },
      data: {
        ...rest,
        updatedBy: data.updatedBy ?? 0,
      },
      include: { projectAssignees: true, projectStatus: true },
    });
  },

  async delete(id: number, { deletedBy }: { deletedBy: number }) {
    return await PrismaTimesheet.feature.update({
      where: { id },
      data: {
        is_deleted: true,
        updatedBy: deletedBy,
      },
    });
  },

  async search(query: string, { limit = 50 }: { limit?: number } = {}) {
    return await PrismaTimesheet.feature.findMany({
      where: {
        is_deleted: false,
        project: {
          is_deleted: false,
        },
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { name_en: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            name_en: true,
          },
        },
      },
    });
  },
};
