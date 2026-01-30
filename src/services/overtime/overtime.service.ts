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
    startDate?: Date | string;
    endDate?: Date | string;
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
    startDate?: Date | string;
    endDate?: Date | string;
    duration: number | string;
    description?: string;
    assignee?: string | number;
  }>;
  approverId?: string;
  status?: string;
  updatedBy?: number;
}

interface FindAllQuery {
  limit?: number;
  skip?: number;
  requesterId?: string;
  status?: string;
  from?: Date;
  to?: Date;
}

interface DescriptionInput {
  date?: Date | string;
  startDate?: Date | string;
  endDate?: Date | string;
  duration: number | string;
  description?: string;
  assignee?: string | number;
}

interface DeleteOptions {
  deletedBy?: number;
}

const DEFAULT_LIMIT = 50;
const DEFAULT_SKIP = 0;
const DEFAULT_STATUS = "pending";
const DEFAULT_CREATED_BY = "0";

/**
 * Helper to map user names and details to overtime records using admin_id
 */
const mapUsersToOvertime = async (overtimeItems: any[]) => {
  const adminIds = new Set<number>();
  overtimeItems.forEach((item) => {
    if (item.requesterId && !isNaN(Number(item.requesterId)))
      adminIds.add(Number(item.requesterId));
    if (item.createdBy && !isNaN(Number(item.createdBy)))
      adminIds.add(Number(item.createdBy));
    if (item.updatedBy && !isNaN(Number(item.updatedBy)))
      adminIds.add(Number(item.updatedBy));
    if (item.descriptions) {
      item.descriptions.forEach((desc: any) => {
        if (desc.assignee && !isNaN(Number(desc.assignee)))
          adminIds.add(Number(desc.assignee));
      });
    }
  });

  const users = await (PrismaTimesheet as any).user.findMany({
    where: { admin_id: { in: Array.from(adminIds) } },
    select: {
      admin_id: true,
      firstname_th: true,
      lastname_th: true,
      employee_code: true,
      position_ref: { select: { name_th: true } },
    },
  });

  const userMap = new Map();
  users.forEach((u: any) => userMap.set(u.admin_id, u));

  return overtimeItems.map((item) => {
    const requester = userMap.get(Number(item.requesterId));
    const creator = userMap.get(Number(item.createdBy));
    const updater = userMap.get(Number(item.updatedBy));

    const enrichedDescriptions = item.descriptions?.map((desc: any) => {
      const assigneeUser = userMap.get(Number(desc.assignee));
      return {
        ...desc,
        assignee_name: assigneeUser
          ? `${assigneeUser.firstname_th} ${assigneeUser.lastname_th}`.trim()
          : desc.assignee,
      };
    });

    return {
      ...item,
      requester_name: requester
        ? `${requester.firstname_th} ${requester.lastname_th}`.trim()
        : null,
      requester_employee_code: requester?.employee_code || null,
      requester_position: requester?.position_ref?.name_th || null,
      creator_name: creator
        ? `${creator.firstname_th} ${creator.lastname_th}`.trim()
        : null,
      updater_name: updater
        ? `${updater.firstname_th} ${updater.lastname_th}`.trim()
        : null,
      descriptions: enrichedDescriptions,
    };
  });
};

export const Service = {
  // ตรวจสอบว่า OT ID มีอยู่ในระบบหรือไม่
  async validatorID(id: number): Promise<boolean> {
    const overtime = await (PrismaTimesheet as any).overtime.findUnique({
      where: { id },
    });
    return overtime !== null;
  },

  // ดึงรายการ OT ทั้งหมดพร้อม pagination และ filter
  async findAll(query: FindAllQuery = {}) {
    const { limit = DEFAULT_LIMIT, skip = DEFAULT_SKIP } = query;
    const where = buildWhereClause(query);

    const [items, total] = await Promise.all([
      (PrismaTimesheet as any).overtime.findMany({
        take: limit,
        skip,
        where,
        orderBy: { createdAt: "desc" },
        include: { descriptions: true },
      }),
      (PrismaTimesheet as any).overtime.count({ where }),
    ]);

    return { items: await mapUsersToOvertime(items), total };
  },

  // ดึงข้อมูล OT ตาม ID
  async findById(id: number) {
    const overtime = await (PrismaTimesheet as any).overtime.findFirst({
      where: { id, isDeleted: false },
      include: { descriptions: true },
    });

    if (overtime) {
      const enrichedItems = await mapUsersToOvertime([overtime]);
      return { items: enrichedItems, total: 1 };
    }

    return { items: [], total: 0 };
  },

  // สร้าง OT ใหม่
  async create(data: CreateOvertimeInput) {
    logger.info("CREATE OVERTIME REQUEST");

    const descriptions = prepareDescriptions(data.descriptions);

    return (PrismaTimesheet as any).overtime.create({
      data: {
        requesterId: data.requesterId,
        requestDate: data.requestDate ? new Date(data.requestDate) : new Date(),
        status: data.status ?? DEFAULT_STATUS,
        descriptions:
          descriptions.length > 0 ? { create: descriptions } : undefined,
        createdBy: String(data.createdBy ?? DEFAULT_CREATED_BY),
      },
      include: { descriptions: true },
    });
  },

  // แก้ไข OT
  async update(id: number, data: UpdateOvertimeInput) {
    logger.info("UPDATE OVERTIME", id);

    validateId(id);
    await ensureOvertimeExists(id);

    const descriptions = prepareDescriptions(data.descriptions);
    const updateData = buildUpdateData(data);

    if (descriptions.length > 0) {
      return (PrismaTimesheet as any).overtime.update({
        where: { id },
        data: {
          ...updateData,
          descriptions: {
            deleteMany: {},
            create: descriptions,
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

  // ลบ OT (Soft Delete)
  async delete(id: number, opts: DeleteOptions = {}) {
    await ensureOvertimeExists(id);

    return (PrismaTimesheet as any).overtime.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedBy:
          opts.deletedBy !== undefined ? String(opts.deletedBy) : undefined,
      },
    });
  },

  // เพิ่ม description ให้ OT ที่มีอยู่
  async addDescription(overtimeId: number, desc: DescriptionInput) {
    const data: any = {
      overtimeId,
      duration: Number(desc.duration),
      description: desc.description ?? "",
      assignee: desc.assignee ? String(desc.assignee) : undefined,
    };

    if (desc.startDate) {
      data.startDate = new Date(desc.startDate);
      data.date = new Date(desc.startDate);
    }

    if (desc.endDate) {
      data.endDate = new Date(desc.endDate);
    }

    if (desc.date && !desc.startDate) {
      data.date = new Date(desc.date);
    }

    return (PrismaTimesheet as any).overtimeDescription.create({ data });
  },
};

// สร้าง where clause สำหรับ query
function buildWhereClause(query: FindAllQuery) {
  const where: any = { isDeleted: false };

  if (query.requesterId) {
    where.requesterId = query.requesterId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.from || query.to) {
    where.requestDate = {};
    if (query.from) where.requestDate.gte = query.from;
    if (query.to) where.requestDate.lte = query.to;
  }

  return where;
}

// แปลง descriptions เป็นรูปแบบที่ Prisma รับได้
function prepareDescriptions(descriptions?: DescriptionInput[]) {
  if (!descriptions) return [];

  return descriptions.map((desc) => {
    const result: any = {
      duration: Number(desc.duration),
      description: desc.description ?? "",
      assignee: desc.assignee ? String(desc.assignee) : undefined,
    };

    if (desc.startDate) {
      result.startDate = new Date(desc.startDate);
      result.date = new Date(desc.startDate);
    }

    if (desc.endDate) {
      result.endDate = new Date(desc.endDate);
    }

    if (desc.date && !desc.startDate) {
      result.date = new Date(desc.date);
    }

    return result;
  });
}

// สร้าง update data โดยลบ undefined fields
function buildUpdateData(data: UpdateOvertimeInput) {
  const updateData: any = {
    requesterId: data.requesterId,
    requestDate: data.requestDate ? new Date(data.requestDate) : undefined,
    status: data.status,
    updatedBy:
      data.updatedBy !== undefined ? String(data.updatedBy) : undefined,
  };

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  return updateData;
}

// ตรวจสอบว่า ID ถูกต้อง
function validateId(id: number): void {
  if (!id || id <= 0) {
    throw new Error("Invalid id for update");
  }
}

// ตรวจสอบว่า OT มีอยู่ในระบบ ถ้าไม่มีโยน error 404
async function ensureOvertimeExists(id: number): Promise<void> {
  const exists = await Service.validatorID(id);

  if (!exists) {
    throw {
      status: 404,
      error: {
        name: "PrismaClientKnownRequestError",
        code: "P2025",
        meta: {
          modelName: "Overtime",
          cause: "No record was found for an update.",
        },
      },
    };
  }
}

export default Service;
