import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export interface CreateRoleDto {
  role_name: string;
  description?: string;
  is_active?: boolean;
  permission_ids?: number[];
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {
  id: number;
}

export const RoleManagementService = {
  // Find All
  async findAll({ search = "" }: { search?: string }) {
    const where: any = {
      is_deleted: false,
    };

    if (search) {
      where.OR = [
        { role_name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await PrismaTimesheet.role.findMany({
      where,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return { items };
  },

  // Find By Id
  async findById(id: number) {
    const role = await PrismaTimesheet.role.findFirst({
      where: { id, is_deleted: false },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    return role;
  },

  // Create
  async create(data: CreateRoleDto) {
    const { permission_ids, ...roleData } = data;

    return await PrismaTimesheet.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          ...roleData,
          is_active: roleData.is_active ?? true,
        },
      });

      if (permission_ids && permission_ids.length > 0) {
        await tx.rolePermission.createMany({
          data: permission_ids.map((pId) => ({
            role_id: role.id,
            permission_id: pId,
          })),
        });
      }

      return role;
    });
  },

  // Update
  async update(id: number, data: Omit<UpdateRoleDto, "id">) {
    const { permission_ids, ...roleData } = data;

    return await PrismaTimesheet.$transaction(async (tx) => {
      const role = await tx.role.update({
        where: { id },
        data: roleData,
      });

      if (permission_ids !== undefined) {
        // Clear existing permissions
        await tx.rolePermission.deleteMany({
          where: { role_id: id },
        });

        // Add new permissions
        if (permission_ids.length > 0) {
          await tx.rolePermission.createMany({
            data: permission_ids.map((pId) => ({
              role_id: id,
              permission_id: pId,
            })),
          });
        }
      }

      return role;
    });
  },

  // Soft Delete
  async delete(id: number) {
    // Check if role is ADMIN
    const role = await PrismaTimesheet.role.findUnique({ where: { id } });
    if (role?.role_name === "ADMIN") {
      throw new Error("Cannot delete ADMIN role");
    }

    return await PrismaTimesheet.role.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
      },
    });
  },
};
