import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export type SubProjectAssetCaptureType = "CAPTUREABLE" | "UN_CAPTUREABLE";

interface PaginationOptions {
  limit?: number;
  skip?: number;
}

interface CreateFeatureDto {
  projectId: number;
  name: string;
  name_en?: string;
  createdBy?: number;
  backlogDescription?: any;
  startDate: Date | string;
  endDate: Date | string;
  assetCaptureType?: SubProjectAssetCaptureType;
}

interface UpdateFeatureDto {
  name?: string;
  name_en?: string;
  updatedBy?: number;
  backlogDescription?: any;
  startDate?: Date | string;
  endDate?: Date | string;
  assetCaptureType?: SubProjectAssetCaptureType;
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
      }),
      PrismaTimesheet.feature.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: number) {
    const feature = await PrismaTimesheet.feature.findFirst({
      where: { id, is_deleted: false },
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
      }),
      PrismaTimesheet.feature.count({ where }),
    ]);

    return { items, total };
  },

  async create(data: CreateFeatureDto) {
    return await PrismaTimesheet.feature.create({
      data: {
        ...data,
        createdBy: data.createdBy ?? 0,
        assetCaptureType: data.assetCaptureType ?? "CAPTUREABLE",
      },
    });
  },

  async update(id: number, data: UpdateFeatureDto) {
    return await PrismaTimesheet.feature.update({
      where: { id },
      data: {
        ...data,
        updatedBy: data.updatedBy ?? 0,
      },
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
