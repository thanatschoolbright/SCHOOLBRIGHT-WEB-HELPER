import { PrismaTimesheet } from "@helpers/prisma-timesheet";

export const Service = {
  /**
   * Get all project statuses ordered by priority asc
   */
  async findAll() {
    return await PrismaTimesheet.projectStatus.findMany({
      orderBy: { priority: "asc" },
    });
  },

  /**
   * Get project status by ID
   */
  async findById(id: number) {
    return await PrismaTimesheet.projectStatus.findUnique({
      where: { id },
    });
  },

  /**
   * Create new project status
   */
  async create(data: {
    nameTh: string;
    nameEn?: string | null;
    priority: number;
  }) {
    // Check if priority already exists
    const existing = await PrismaTimesheet.projectStatus.findFirst({
      where: { priority: data.priority },
    });

    if (existing) {
      throw new Error(`Priority ${data.priority} มีผู้ใช้งานแล้ว`);
    }

    return await PrismaTimesheet.projectStatus.create({
      data,
    });
  },

  /**
   * Update existing project status
   */
  async update(
    id: number,
    data: { nameTh?: string; nameEn?: string | null; priority?: number }
  ) {
    if (data.priority !== undefined) {
      const existing = await PrismaTimesheet.projectStatus.findFirst({
        where: {
          priority: data.priority,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error(`Priority ${data.priority} มีผู้ใช้งานแล้ว`);
      }
    }

    return await PrismaTimesheet.projectStatus.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete project status
   */
  async delete(id: number) {
    return await PrismaTimesheet.projectStatus.delete({
      where: { id },
    });
  },
};
