import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { logger } from "@/helpers/logger";

export interface CreateOvertimeInput {
  requesterId?: string;
  firstname?: string;
  lastname?: string;
  employee_code?: string;
  role?: string;
  department?: string;
  requestDate: Date | string;
  startTime?: string;
  endTime?: string;
  overtimeType?: string;
  descriptions?: Array<{
    date?: Date | string;
    duration: number | string;
    description?: string;
    assignee?: string | number;
  }>;
  approverId?: string;
  status?: string;
  createdBy?: number;
}

export interface UpdateOvertimeInput {
  requesterId?: string;
  firstname?: string;
  lastname?: string;
  employee_code?: string;
  role?: string;
  department?: string;
  requestDate?: Date | string;
  startTime?: string;
  endTime?: string;
  overtimeType?: string;
  descriptions?: Array<{
    date?: Date | string;
    duration: number | string;
    description?: string;
    assignee?: string | number;
  }>;
  approverId?: string;
  status?: string;
  updatedBy?: number;
}

export const Service = {
  async validatorID(id: number) {
    const find = await (PrismaTimesheet as any).overtime.findUnique({
      where: { id },
    });
    return find !== null;
  },

  // list with pagination and optional filters
  async findAll(
    query: {
      limit?: number;
      skip?: number;
      requesterId?: string;
      status?: string;
      from?: Date;
      to?: Date;
    } = { limit: 50, skip: 0 }
  ) {
    const where: any = { isDeleted: false };
    if (query.requesterId) where.requesterId = query.requesterId;
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.requestDate = {};
      if (query.from) where.requestDate.gte = query.from;
      if (query.to) where.requestDate.lte = query.to;
    }

    const [items, total] = await Promise.all([
      (PrismaTimesheet as any).overtime.findMany({
        take: query.limit,
        skip: query.skip,
        where,
        orderBy: { createdAt: "desc" },
        include: { descriptions: true },
      }),
      (PrismaTimesheet as any).overtime.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: number) {
    const data = await (PrismaTimesheet as any).overtime.findFirst({
      where: { id, isDeleted: false },
      include: { descriptions: true },
    });

    if (data) return { items: [data], total: 1 };
    return { items: [], total: 0 };
  },

  async create(data: CreateOvertimeInput) {
    logger.info("CREATE OVERTIME REQUEST");
    // prepare nested descriptions create array
    const descCreate = (data.descriptions || []).map((d) => ({
      date: d.date ? new Date(d.date) : undefined,
      duration: Number(d.duration),
      description: d.description ?? "",
      assignee: d.assignee ? String(d.assignee) : undefined,
    }));

    return (PrismaTimesheet as any).overtime.create({
      data: {
        requesterId: data.requesterId,
        requestDate: data.requestDate ? new Date(data.requestDate) : new Date(),
        status: data.status ?? "pending",
        descriptions: descCreate.length > 0 ? { create: descCreate } : undefined,
        createdBy: String(data.createdBy ?? "0"),
      },
      include: { descriptions: true },
    });
  },

  async update(id: number, data: UpdateOvertimeInput) {
    logger.info("UPDATE OVERTIME", id);
    if (!id || id <= 0) throw new Error("Invalid id for update");

    // prepare nested descriptions create array if present
    const descCreate = (data.descriptions || []).map((d) => ({
      date: d.date ? new Date(d.date) : undefined,
      duration: Number(d.duration),
      description: d.description ?? "",
      assignee: d.assignee ? String(d.assignee) : undefined,
    }));

    const updateData: any = {
      requesterId: data.requesterId,
      requestDate: data.requestDate ? new Date(data.requestDate) : undefined,
      status: data.status,
      updatedBy: data.updatedBy ?? 0,
    };

    // remove undefined keys
    Object.keys(updateData).forEach(
      (k) => updateData[k] === undefined && delete updateData[k]
    );

    if (descCreate.length > 0) {
      // update with nested writes: delete existing descriptions and create new ones
      return (PrismaTimesheet as any).overtime.update({
        where: { id },
        data: {
          ...updateData,
          descriptions: {
            deleteMany: {},
            create: descCreate,
          },
        },
        include: { descriptions: true },
      });
    }

    return (PrismaTimesheet as any).overtime.update({
      where: { id },
      data: updateData,
      include: { descriptions: true },
    });
  },

  async delete(id: number, opts: { deletedBy?: number } = {}) {
    return (PrismaTimesheet as any).overtime.update({
      where: { id },
      data: { isDeleted: true, updatedBy: opts.deletedBy ?? 0 },
    });
  },

  // helper: add a description item to existing overtime
  async addDescription(
    overtimeId: number,
    desc: {
      date?: Date | string;
      duration: number | string;
      description?: string;
      assignee?: string | number;
    }
  ) {
    return (PrismaTimesheet as any).overtimeDescription.create({
      data: {
        overtimeId,
        date: desc.date ? new Date(desc.date) : new Date(),
        duration: Number(desc.duration),
        description: desc.description ?? "",
        assignee: desc.assignee ? String(desc.assignee) : undefined,
      },
    });
  },
};

export default Service;
