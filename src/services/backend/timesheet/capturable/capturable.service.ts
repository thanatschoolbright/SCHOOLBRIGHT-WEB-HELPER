import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export interface ProjectStatResult {
  project_id: number;
  project_code: string;
  project_name: string;
  capturable_percent: number;
  uncapturable_percent: number;
  hours: number;
  hours_percent: number;
}

export const Service = {
  async getProjectStats(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const grandTotalAgg = await PrismaTimesheet.timesheetEntry.aggregate({
      _sum: {
        hours: true,
      },
      where: {
        is_deleted: false,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    const globalTotalHours = Number(grandTotalAgg._sum.hours) || 0;

    const projects = await PrismaTimesheet.project.findMany({
      where: {
        is_deleted: false,
        timesheets: {
          some: {
            date: { gte: start, lte: end },
            is_deleted: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        timesheets: {
          where: {
            is_deleted: false,
            date: {
              gte: start,
              lte: end,
            },
          },
          select: {
            hours: true,
            feature: {
              select: {
                assetCaptureType: true,
              },
            },
          },
        },
      },
    });

    const results = projects.map((p) => {
      let totalHours = 0;
      let capturableHours = 0;
      let uncapturableHours = 0;

      p.timesheets.forEach((t) => {
        const h = Number(t.hours);
        totalHours += h;

        if (t.feature.assetCaptureType === "CAPTUREABLE") {
          capturableHours += h;
        } else {
          uncapturableHours += h;
        }
      });

      const capturablePercent =
        totalHours > 0 ? (capturableHours / totalHours) * 100 : 0;
      const uncapturablePercent =
        totalHours > 0 ? (uncapturableHours / totalHours) * 100 : 0;
      const hoursPercent =
        globalTotalHours > 0 ? (totalHours / globalTotalHours) * 100 : 0;

      return {
        project_id: p.id,
        project_code: p.id.toString().padStart(4, "0"),
        project_name: p.name,
        capturable_percent: Number(capturablePercent.toFixed(2)),
        uncapturable_percent: Number(uncapturablePercent.toFixed(2)),
        hours: Number(totalHours.toFixed(2)),
        hours_percent: Number(hoursPercent.toFixed(2)),
      };
    });

    results.sort((a, b) => b.hours - a.hours);

    return results;
  },
};
