import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export const Service = {
  async validateProjectId(projectId: number) {
    const project = await PrismaTimesheet.project.findUnique({
      where: { id: projectId },
    });
    return project !== null;
  },

  async validateSubProjectId(subProjectId: number) {
    const find = await PrismaTimesheet.feature.findUnique({
      where: { id: subProjectId },
    });
    return find !== null;
  },

  // * ดึงข้อมูล Feature ทั้งหมด พร้อม pagination
  async findAll(
    opts: { limit?: number; skip?: number } = { limit: 50, skip: 0 }
  ) {
    const [items, total] = await Promise.all([
      PrismaTimesheet.feature.findMany({
        take: opts.limit,
        skip: opts.skip,
        orderBy: { createdAt: "desc" },
        where: { is_deleted: false },
      }),
      PrismaTimesheet.feature.count({ where: { is_deleted: false } }),
    ]);
    return { items, total };
  },

  // * ดึงข้อมูล Feature ตาม ID พร้อมโครงสร้างข้อมูลแบบเดียวกับ findAll
  async findById(id: number) {
    const feature = await PrismaTimesheet.feature.findFirst({
      where: { id, is_deleted: false },
    });
    if (feature) {
      return { items: [feature], total: 1 };
    } else {
      return { items: [], total: 0 };
    }
  },

  // * ดึงข้อมูล Feature ทั้งหมดใน Project เดียวกัน
  async findByProjectId(projectId: number) {
    const [items, total] = await Promise.all([
      PrismaTimesheet.feature.findMany({
        where: { projectId, is_deleted: false },
        orderBy: { createdAt: "desc" },
      }),
      PrismaTimesheet.feature.count({
        where: { projectId, is_deleted: false },
      }),
    ]);
    return { items, total };
  },

  // * สร้าง Feature ใหม่
  async create(data: { projectId: number; name: string; createdBy?: number }) {
    return await PrismaTimesheet.feature.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        createdBy: data.createdBy !== undefined ? data.createdBy : 0,
      },
    });
  },

  // * อัปเดต Feature ตาม ID
  async update(id: number, data: { name?: string; updatedBy?: number }) {
    return await PrismaTimesheet.feature.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        updatedBy: data.updatedBy !== undefined ? data.updatedBy : 0,
      },
    });
  },

  // * ลบ Feature ตาม ID
  async delete(id: number, p0: { deletedBy: number }) {
    return await PrismaTimesheet.feature.update({
      where: { id },
      data: { is_deleted: true, updatedBy: p0.deletedBy },
    });
  },
};
