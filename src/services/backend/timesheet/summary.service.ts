import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import dayjs from "dayjs";

/**
 * Service สำหรับคำนวณข้อมูลสรุปรายเดือน
 * ย้าย Logic จาก Client-side มาที่ Server-side เพื่อความถูกต้องและประสิทธิภาพ
 */
export const SummaryService = {
  /**
   * คำนวณสรุปการลงเวลาทำงานรายเดือน
   * @param userId รหัสพนักงาน (admin_id)
   * @param month เดือน (1-12)
   * @param year ปี (ค.ศ.)
   * @param targetHours ชั่วโมงเป้าหมายต่อวัน (default: 8)
   */
  async calculateMonthly(
    userId: number,
    month: number,
    year: number,
    targetHours: number = 8,
  ) {
    // 1. กำหนดช่วงเวลาของเดือน
    const dateObj = dayjs()
      .year(year)
      .month(month - 1);
    const startOfMonth = dateObj.startOf("month").toDate();
    const endOfMonth = dateObj.endOf("month").toDate();
    const daysInMonth = dateObj.daysInMonth();

    // 2. ดึงข้อมูล Timesheet ทั้งหมดในเดือนนั้นของ User
    const entries = await PrismaTimesheet.timesheetEntry.findMany({
      where: {
        createdBy: userId,
        is_deleted: false,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        hours: true,
        status: true,
      },
    });

    // 3. จัดกลุ่มข้อมูลตามวันที่ (YYYY-MM-DD)
    const dailyMap = new Map<
      string,
      { totalHours: number; isCompleted: boolean }
    >();

    entries.forEach((entry) => {
      const dateKey = dayjs(entry.date).format("YYYY-MM-DD");
      const current = dailyMap.get(dateKey) || {
        totalHours: 0,
        isCompleted: false,
      };

      const hours = Number(entry.hours) || 0;
      const totalHours = current.totalHours + hours;

      dailyMap.set(dateKey, {
        totalHours,
        isCompleted: totalHours >= targetHours,
      });
    });

    // 4. สร้างข้อมูลให้ครบทุกวันในเดือน
    const monthlySummary = [];
    let totalHoursSum = 0;
    let completedDaysCount = 0;
    let workingDaysCount = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = dateObj.date(i);
      const dateKey = currentDay.format("YYYY-MM-DD");
      const dayOfWeek = currentDay.day();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayData = dailyMap.get(dateKey) || {
        totalHours: 0,
        isCompleted: false,
      };

      const item = {
        label: i.toString(),
        dateKey,
        displayDate: currentDay.format("DD/MM/YYYY"),
        totalHours: dayData.totalHours,
        percent: Math.min(
          Math.round((dayData.totalHours / targetHours) * 100),
          100,
        ),
        isCompleted: dayData.isCompleted,
        isWeekend,
      };

      monthlySummary.push(item);

      // เก็บสถิติ
      totalHoursSum += dayData.totalHours;
      if (dayData.isCompleted) completedDaysCount++;
      if (!isWeekend) workingDaysCount++;
    }

    // 5. คำนวณ Overall Stats
    const targetTotal = workingDaysCount * targetHours;
    const progressPercent = Math.min(
      Math.round((totalHoursSum / (targetTotal || 1)) * 100),
      100,
    );

    return {
      monthlySummary,
      stats: {
        totalHours: totalHoursSum,
        completedDays: completedDaysCount,
        workingDays: workingDaysCount,
        targetTotal,
        progress: progressPercent,
      },
      metadata: {
        userId,
        month,
        year,
        targetHours,
        generatedAt: new Date().toISOString(),
      },
    };
  },
};
