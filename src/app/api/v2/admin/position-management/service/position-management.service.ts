import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export interface CreatePositionDto {
  name_th: string;
  name_en?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdatePositionDto extends Partial<CreatePositionDto> {
  id: number;
}

export const PositionManagementService = {
  // Create
  async create(data: CreatePositionDto) {
    return await PrismaTimesheet.position.create({
      data: {
        ...data,
        is_active: data.is_active ?? true,
      },
    });
  },

  // Update
  async update(id: number, data: Omit<UpdatePositionDto, "id">) {
    return await PrismaTimesheet.position.update({
      where: { id },
      data: {
        ...data,
      },
    });
  },

  // Soft Delete
  async delete(id: number) {
    return await PrismaTimesheet.position.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
      },
    });
  },

  // Find All (with pagination & search)
  // Find All (with pagination & search)
  async findAll({ page = 1, limit = 50, search = "", isActive }: any) {
    const skip = (page - 1) * limit;
    const where: any = {
      is_deleted: false,
    };

    if (search) {
      where.OR = [
        { name_th: { contains: search, mode: "insensitive" } },
        { name_en: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined && isActive !== null && isActive !== "") {
      where.is_active = isActive === "true" || isActive === true;
    }

    const [items, total] = await Promise.all([
      PrismaTimesheet.position.findMany({
        where,
        take: Number(limit),
        skip: Number(skip),
        orderBy: { created_at: "desc" },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      PrismaTimesheet.position.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  // Find One
  async findById(id: number) {
    return await PrismaTimesheet.position.findFirst({
      where: { id, is_deleted: false },
    });
  },

  // Seed Tech Positions
  async seedTechPositions() {
    const techPositions = [
      {
        name_th: "Chief Technology Officer (CTO)",
        name_en: "Chief Technology Officer (CTO)",
      },
      { name_th: "VP of Engineering", name_en: "VP of Engineering" },
      { name_th: "Engineering Manager", name_en: "Engineering Manager" },
      { name_th: "Tech Lead", name_en: "Tech Lead" },
      { name_th: "Software Architect", name_en: "Software Architect" },
      {
        name_th: "Senior Software Engineer",
        name_en: "Senior Software Engineer",
      },
      { name_th: "Software Engineer", name_en: "Software Engineer" },
      {
        name_th: "Junior Software Engineer",
        name_en: "Junior Software Engineer",
      },
      { name_th: "Full-Stack Developer", name_en: "Full-Stack Developer" },
      { name_th: "Front-end Developer", name_en: "Front-end Developer" },
      { name_th: "Back-end Developer", name_en: "Back-end Developer" },
      { name_th: "Mobile Developer (iOS)", name_en: "Mobile Developer (iOS)" },
      {
        name_th: "Mobile Developer (Android)",
        name_en: "Mobile Developer (Android)",
      },
      { name_th: "DevOps Engineer", name_en: "DevOps Engineer" },
      {
        name_th: "Site Reliability Engineer (SRE)",
        name_en: "Site Reliability Engineer (SRE)",
      },
      { name_th: "Cloud Engineer", name_en: "Cloud Engineer" },
      { name_th: "QA Engineer", name_en: "QA Engineer" },
      { name_th: "QA Automation Engineer", name_en: "QA Automation Engineer" },
      { name_th: "UI/UX Designer", name_en: "UI/UX Designer" },
      { name_th: "Product Manager", name_en: "Product Manager" },
      { name_th: "Product Owner", name_en: "Product Owner" },
      { name_th: "Scrum Master", name_en: "Scrum Master" },
      { name_th: "Data Scientist", name_en: "Data Scientist" },
      { name_th: "Data Engineer", name_en: "Data Engineer" },
      { name_th: "Data Analyst", name_en: "Data Analyst" },
      {
        name_th: "Machine Learning Engineer",
        name_en: "Machine Learning Engineer",
      },
      { name_th: "Security Engineer", name_en: "Security Engineer" },
      { name_th: "Network Engineer", name_en: "Network Engineer" },
      { name_th: "System Administrator", name_en: "System Administrator" },
      {
        name_th: "Database Administrator (DBA)",
        name_en: "Database Administrator (DBA)",
      },
      { name_th: "IT Support Specialist", name_en: "IT Support Specialist" },
      { name_th: "Business Analyst", name_en: "Business Analyst" },
    ];

    let createdCount = 0;

    for (const pos of techPositions) {
      // Check if exists to avoid duplicates (by name_th)
      const exists = await PrismaTimesheet.position.findFirst({
        where: {
          name_th: pos.name_th,
          is_deleted: false,
        },
      });

      if (!exists) {
        await PrismaTimesheet.position.create({
          data: {
            name_th: pos.name_th,
            name_en: pos.name_en,
            description: "Default Tech Position",
            is_active: true,
          },
        });
        createdCount++;
      }
    }

    return createdCount;
  },
};
