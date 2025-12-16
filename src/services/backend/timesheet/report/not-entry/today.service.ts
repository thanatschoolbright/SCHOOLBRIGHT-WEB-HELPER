import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export const Service = {
  /**
   * 1. หา ID คนที่เคยลงเวลา แต่ "วันนี้" ยังไม่ได้ลงเลย
   */
  async getUnsubmittedUserIds() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // 1.1 คนที่เคยมีประวัติ
    const allHistoryUsers = await PrismaTimesheet.timesheetEntry.findMany({
      where: { is_deleted: false, createdBy: { not: null } },
      distinct: ["createdBy"],
      select: { createdBy: true },
    });

    // 1.2 คนที่ลงวันนี้
    const todayUsers = await PrismaTimesheet.timesheetEntry.findMany({
      where: {
        is_deleted: false,
        createdBy: { not: null },
        date: { gte: startOfDay, lte: endOfDay },
      },
      distinct: ["createdBy"],
      select: { createdBy: true },
    });

    const allUserIds = allHistoryUsers.map((u) => u.createdBy as number);
    const submittedUserIds = todayUsers.map((u) => u.createdBy as number);

    // A - B = คนที่หายไป
    return allUserIds.filter((id) => !submittedUserIds.includes(id));
  },

  /**
   * 2. หาคนที่ลงเวลาวันนี้ แต่รวมกันแล้วน้อยกว่า 8 ชั่วโมง
   */
  async getIncompleteUsers() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Group By createdBy และ Sum Hours
    const entries = await PrismaTimesheet.timesheetEntry.groupBy({
      by: ["createdBy"],
      where: {
        is_deleted: false,
        createdBy: { not: null },
        date: { gte: startOfDay, lte: endOfDay },
      },
      _sum: {
        hours: true,
      },
    });

    // กรองเอาเฉพาะคนที่ hours < 8
    return entries
      .filter((entry) => {
        const total = Number(entry._sum.hours || 0);
        return total < 8;
      })
      .map((entry) => ({
        user_id: entry.createdBy as number,
        total_hours: Number(entry._sum.hours || 0),
      }));
  },
};
