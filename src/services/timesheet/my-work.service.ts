import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export const MyWorkService = {
  /**
   * ดึงข้อมูลงานที่ผู้ใช้ได้รับมอบหมาย (Project Assignments)
   * @param userId รหัสผู้ใช้
   * @returns รายการงานที่ได้รับมอบหมาย
   */
  async findMyWork(userId: number) {
    const assignments = await PrismaTimesheet.projectAssignee.findMany({
      where: {
        userId: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            name_en: true,
            description: true,
            status: true,
          },
        },
        feature: {
          select: {
            id: true,
            name: true,
            name_en: true,
            status: true,
          },
        },
      },
    });

    return assignments;
  },
};
