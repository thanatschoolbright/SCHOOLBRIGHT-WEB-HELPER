import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export interface ProjectStatDetail {
  feature_id: number | null;
  feature_name: string;
  asset_capture_type: string;
  hours: number;
  percent: number;
}

export interface ProjectStatResult {
  project_id: number;
  project_code: string;
  project_name: string;
  capturable_percent: number;
  uncapturable_percent: number;
  capturable_hours: number;
  uncapturable_hours: number;
  hours: number;
  hours_percent: number;
  details: ProjectStatDetail[];
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
        project: {
          is_deleted: false,
        },
        feature: {
          is_deleted: false,
        },
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
      },
      select: {
        id: true,
        name: true,
        timesheets: {
          where: {
            is_deleted: false,
            feature: {
              is_deleted: false,
            },
            date: {
              gte: start,
              lte: end,
            },
          },
          select: {
            hours: true,
            feature: {
              select: {
                id: true,
                name: true,
                assetCaptureType: true,
              },
            },
          },
        },
      },
    });

    const results = projects.map((p): ProjectStatResult => {
      let totalHours = 0;
      let capturableHours = 0;
      let uncapturableHours = 0;

      // Group by feature to provide detailed breakdown
      const featureMap: Record<string, ProjectStatDetail> = {};

      p.timesheets.forEach((t) => {
        const h = Number(t.hours);
        totalHours += h;

        const featureId = t.feature?.id || 0;
        const featureName = t.feature?.name || "ไม่ระบุฟีเจอร์/งานย่อย";
        const captureType = t.feature?.assetCaptureType || "UNCAPTUREABLE";

        if (captureType === "CAPTUREABLE") {
          capturableHours += h;
        } else {
          uncapturableHours += h;
        }

        const key = `${featureId}-${captureType}`;
        if (!featureMap[key]) {
          featureMap[key] = {
            feature_id: t.feature?.id || null,
            feature_name: featureName,
            asset_capture_type: captureType,
            hours: 0,
            percent: 0,
          };
        }
        featureMap[key].hours += h;
      });

      const details = Object.values(featureMap).map((d) => ({
        ...d,
        hours: Number(d.hours.toFixed(2)),
        percent:
          totalHours > 0
            ? Number(((d.hours / totalHours) * 100).toFixed(2))
            : 0,
      }));

      // Sort details by hours descending
      details.sort((a, b) => b.hours - a.hours);

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
        capturable_hours: Number(capturableHours.toFixed(2)),
        uncapturable_hours: Number(uncapturableHours.toFixed(2)),
        hours: Number(totalHours.toFixed(2)),
        hours_percent: Number(hoursPercent.toFixed(2)),
        details,
      };
    });

    results.sort((a, b) => b.hours - a.hours);

    return results;
  },

  async getSummary(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1. Get total hours aggregated by capture type
    const entries = await PrismaTimesheet.timesheetEntry.findMany({
      where: {
        is_deleted: false,
        project: {
          is_deleted: false,
        },
        feature: {
          is_deleted: false,
        },
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
        projectId: true,
      },
    });

    let totalHours = 0;
    let capturableHours = 0;

    entries.forEach((e) => {
      const h = Number(e.hours);
      totalHours += h;
      if (e.feature?.assetCaptureType === "CAPTUREABLE") {
        capturableHours += h;
      }
    });

    // 2. Count all active projects (even those with 0 hours)
    const totalProjectsCount = await PrismaTimesheet.project.count({
      where: {
        is_deleted: false,
      },
    });

    // 3. Calculate percentages to sum exactly to 100%
    let avgCapturable = 0;
    let avgUncapturable = 0;

    if (totalHours > 0) {
      // Round the first one to 2 decimal places
      avgCapturable = Number(((capturableHours / totalHours) * 100).toFixed(2));
      // Subtract from 100 to get the second one, ensuring they sum to exactly 100.00
      avgUncapturable = Number((100 - avgCapturable).toFixed(2));
    }

    return {
      totalProjects: totalProjectsCount,
      totalHours: Number(totalHours.toFixed(2)),
      avgCapturable,
      avgUncapturable,
    };
  },
};
