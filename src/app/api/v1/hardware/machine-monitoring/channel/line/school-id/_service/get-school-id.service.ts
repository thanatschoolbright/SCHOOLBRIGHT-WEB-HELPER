import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";

// ✨ ดึงข้อมูลกลุ่ม LINE ทั้งหมดจาก Jabjai Master DB
export async function getSchoolGroup() {
  const response = await PrismaJabjaiMaster.tLineGroup.findMany();
  return response;
}
