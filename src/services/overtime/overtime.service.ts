import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export interface CreateOvertimeInput {
  requesterId?: string | number;
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
  requesterId?: string | number;
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
  requesterId?: string | number;
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
const DEFAULT_CREATED_BY = 0;

/**
 * Helper to map user names and details to overtime records using admin_id
 */
const mapUsersToOvertime = async (overtimeItems: any[]) => {
  const userIds = new Set<number>();
  overtimeItems.forEach((item) => {
    // Collect IDs for users not already provided by Prisma include
    if (!item.requester && item.requesterId && !isNaN(Number(item.requesterId)))
      userIds.add(Number(item.requesterId));
    if (!item.creator && item.createdBy && !isNaN(Number(item.createdBy)))
      userIds.add(Number(item.createdBy));
    if (item.updatedBy && !isNaN(Number(item.updatedBy)))
      userIds.add(Number(item.updatedBy));
    if (item.descriptions) {
      item.descriptions.forEach((desc: any) => {
        if (desc.assignee && !isNaN(Number(desc.assignee)))
          userIds.add(Number(desc.assignee));
      });
    }
  });

  let userMap = new Map();
  if (userIds.size > 0) {
    const users = await (PrismaTimesheet as any).user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: {
        id: true,
        admin_id: true,
        firstname_th: true,
        lastname_th: true,
        employee_code: true,
        position_ref: { select: { name_th: true } },
      },
    });
    users.forEach((u: any) => userMap.set(u.id, u));
  }

  return overtimeItems.map((item) => {
    const requester = item.requester || userMap.get(Number(item.requesterId));
    const creator = item.creator || userMap.get(Number(item.createdBy));
    const updater = userMap.get(Number(item.updatedBy));

    // Helper to get formatted name from user object
    const formatName = (u: any) => {
      if (!u) return null;
      const thName = `${u.firstname_th || ""} ${u.lastname_th || ""}`.trim();
      const enName = `${u.firstname_en || ""} ${u.lastname_en || ""}`.trim();
      const nickname = u.nickname ? `(${u.nickname})` : "";

      const fullName = thName || enName || u.username || String(u.id);
      return nickname ? `${fullName} ${nickname}`.trim() : fullName;
    };

    const enrichedDescriptions = item.descriptions?.map((desc: any) => {
      const assigneeUser = userMap.get(Number(desc.assignee));
      return {
        ...desc,
        assignee_name: formatName(assigneeUser) || desc.assignee,
        assignee_user: assigneeUser || null,
      };
    });

    return {
      ...item,
      requester_user: requester || null,
      creator_user: creator || null,
      updater_user: updater || null,
      requester_name: formatName(requester),
      requester_employee_code: requester?.employee_code || null,
      requester_position: requester?.position_ref?.name_th || null,
      creator_name: formatName(creator),
      updater_name: formatName(updater),
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
        include: {
          descriptions: true,
          requester: {
            include: { position_ref: { select: { name_th: true } } },
          },
          creator: {
            include: { position_ref: { select: { name_th: true } } },
          },
        },
      }),
      (PrismaTimesheet as any).overtime.count({ where }),
    ]);

    return { items: await mapUsersToOvertime(items), total };
  },

  // ดึงข้อมูล OT ตาม ID
  async findById(id: number) {
    const overtime = await (PrismaTimesheet as any).overtime.findFirst({
      where: { id, isDeleted: false },
      include: {
        descriptions: true,
        requester: {
          include: { position_ref: { select: { name_th: true } } },
        },
        creator: {
          include: { position_ref: { select: { name_th: true } } },
        },
      },
    });

    if (overtime) {
      const enrichedItems = await mapUsersToOvertime([overtime]);
      return { items: enrichedItems, total: 1 };
    }

    return { items: [], total: 0 };
  },

  // สร้าง OT ใหม่
  async create(data: CreateOvertimeInput) {
    const descriptions = prepareDescriptions(data.descriptions);

    return (PrismaTimesheet as any).overtime.create({
      data: {
        requesterId: data.requesterId ? Number(data.requesterId) : null,
        requestDate: data.requestDate ? new Date(data.requestDate) : new Date(),
        status: data.status ?? DEFAULT_STATUS,
        descriptions:
          descriptions.length > 0 ? { create: descriptions } : undefined,
        createdBy: data.createdBy ? Number(data.createdBy) : DEFAULT_CREATED_BY,
      },
      include: { descriptions: true },
    });
  },

  // แก้ไข OT
  async update(id: number, data: UpdateOvertimeInput) {
    validateId(id);
    await ensureOvertimeExists(id);

    const descriptions = prepareDescriptions(data.descriptions);
    const updateData = buildUpdateData(data);

    return (PrismaTimesheet as any).overtime.update({
      where: { id },
      data: {
        ...updateData,
        descriptions:
          descriptions.length > 0
            ? {
                deleteMany: {},
                create: descriptions,
              }
            : undefined,
      },
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
          opts.deletedBy !== undefined ? Number(opts.deletedBy) : undefined,
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

  // Ensuring requesterId is a valid number before using it filter if the schema says it's Int.
  // If the requesterId is passed from frontend as "null" or non-numeric, it's ignored to avoid 500.
  if (
    query.requesterId !== undefined &&
    query.requesterId !== null &&
    query.requesterId !== "" &&
    !isNaN(Number(query.requesterId))
  ) {
    where.requesterId = Number(query.requesterId);
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
    requesterId:
      data.requesterId !== undefined ? Number(data.requesterId) : undefined,
    requestDate: data.requestDate ? new Date(data.requestDate) : undefined,
    status: data.status,
    updatedBy:
      data.updatedBy !== undefined ? Number(data.updatedBy) : undefined,
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
