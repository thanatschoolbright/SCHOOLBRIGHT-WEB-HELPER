import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export type SubProjectAssetCaptureType = "CAPTUREABLE" | "UN_CAPTUREABLE";

interface PaginationOptions {
  limit?: number;
  skip?: number;
}

interface CreateFeatureDto {
  projectId: number;
  name: string;
  name_en?: string | null;
  createdBy?: number;
  backlogDescription?: any;
  startDate: Date | string;
  endDate: Date | string;
  assetCaptureType?: SubProjectAssetCaptureType;
  status?: string;
  projectStatusId?: number | null;
  assignees?: { userId: number; position?: string | null }[];
}

interface UpdateFeatureDto {
  name?: string;
  name_en?: string | null;
  updatedBy?: number;
  backlogDescription?: any;
  startDate?: Date | string;
  endDate?: Date | string;
  assetCaptureType?: SubProjectAssetCaptureType;
  status?: string;
  projectStatusId?: number | null;
  assignees?: { userId: number; position?: string | null }[];
}

export const Service = {
  async validateProjectId(projectId: number) {
    const project = await PrismaTimesheet.project.findUnique({
      where: { id: projectId },
    });
    return !!project;
  },

  async validateSubProjectId(subProjectId: number) {
    const feature = await PrismaTimesheet.feature.findUnique({
      where: { id: subProjectId },
    });
    return !!feature;
  },

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

    return { items, total };
  },

  async findById(id: number) {
    const feature = await PrismaTimesheet.feature.findFirst({
      where: { id, is_deleted: false },
      include: { projectAssignees: true, projectStatus: true },
    });

    return feature ? { items: [feature], total: 1 } : { items: [], total: 0 };
  },

  async findByProjectId(
    projectId: number,
    { limit, skip = 0 }: PaginationOptions = {}
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

    return { items, total };
  },

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
              projectId: feature.projectId,
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
};
