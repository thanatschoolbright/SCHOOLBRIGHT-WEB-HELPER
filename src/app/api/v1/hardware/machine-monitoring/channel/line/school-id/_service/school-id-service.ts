import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";

/**
 * ✨ ดึงข้อมูลกลุ่ม LINE ทั้งหมดจาก Jabjai Master DB พร้อมระบบแบ่งหน้า
 * @param params { limit: number; skip: number; school_id?: number }
 */
export async function getSchoolGroupService(params: {
  limit: number;
  skip: number;
  school_id?: number;
}) {
  const { limit, skip, school_id } = params;

  const where = {
    ...(school_id ? { SchoolId: school_id } : {}),
  };

  const [items, total] = await Promise.all([
    PrismaJabjaiMaster.tLineGroup.findMany({
      where,
      take: limit,
      skip: skip,
      orderBy: {
        CreateDate: "desc",
      },
    }),
    PrismaJabjaiMaster.tLineGroup.count({ where }),
  ]);

  return { items, total };
}
