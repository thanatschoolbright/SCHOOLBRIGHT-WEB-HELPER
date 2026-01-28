import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export const PermissionManagementService = {
  // Find All
  async findAll() {
    return await PrismaTimesheet.permission.findMany({
      where: { is_deleted: false },
      orderBy: { p_code: "asc" },
    });
  },

  // Seed Permissions
  async seed(
    permissions: { p_code: string; name_th: string; description?: string }[],
  ) {
    return await PrismaTimesheet.$transaction(async (tx) => {
      const results = [];
      for (const p of permissions) {
        const result = await tx.permission.upsert({
          where: { p_code: p.p_code },
          update: {
            name_th: p.name_th,
            description: p.description,
            is_deleted: false,
          },
          create: {
            p_code: p.p_code,
            name_th: p.name_th,
            description: p.description,
          },
        });
        results.push(result);
      }
      return results;
    });
  },

  // Delete Permission (Soft Delete)
  async delete(ids: number | number[]) {
    const idList = Array.isArray(ids) ? ids : [ids];
    return await PrismaTimesheet.permission.updateMany({
      where: { id: { in: idList.map((id) => Number(id)) } },
      data: { is_deleted: true },
    });
  },
};
