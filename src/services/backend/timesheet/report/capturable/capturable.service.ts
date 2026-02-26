import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export interface ProjectStatDetail {
  feature_id: number | null;
  feature_name: string;
  is_deleted: boolean; // Add this
  asset_capture_type: string;
  hours: number;
  percent: number;
}

export interface ProjectStatResult {
  project_id: number;
  project_code: string;
  project_name: string;
  is_deleted: boolean; // Add this
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
    // ⚡️ Fix Timezone Offset: Use T00:00:00 to ensure local time parsing (ICT+7) which aligns with Summary API
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    const grandTotalAgg = await PrismaTimesheet.timesheetEntry.aggregate({
      _sum: {
        hours: true,
      },
      where: {
        date: {
          gte: start,
          lte: end,
        },
        is_deleted: false,
      },
    });

    const globalTotalHours = Number(grandTotalAgg._sum.hours) || 0;

    const projects = await PrismaTimesheet.project.findMany({
      where: {
        // Include both active projects and deleted ones that have activity in this period
        // to ensure the total hours in the project breakdown matches the Grand Total (Summary).
        OR: [
          { is_deleted: false },
          {
            timesheets: {
              some: {
                date: {
                  gte: start,
                  lte: end,
                },
                is_deleted: false,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        is_deleted: true,
        timesheets: {
          where: {
            date: {
              gte: start,
              lte: end,
            },
            is_deleted: false,
          },
          select: {
            hours: true,
            is_deleted: true,
            feature: {
              select: {
                id: true,
                name: true,
                is_deleted: true,
                assetCaptureType: true,
              },
            },
          },
        },
      },
    });

    const results = projects
      .map((project): ProjectStatResult => {
        let totalHours = 0;
        let capturableHours = 0;
        let uncapturableHours = 0;

        // Group by feature to provide detailed breakdown
        const featureMap: Record<string, ProjectStatDetail> = {};

        project.timesheets.forEach((entry) => {
          const hoursValue = Number(entry.hours);
          totalHours += hoursValue;

          const featureId = entry.feature?.id || 0;
          const featureName = entry.feature?.name || "No Feature/Sub-task";
          const captureType =
            entry.feature?.assetCaptureType || "UNCAPTUREABLE";

          if (captureType === "CAPTUREABLE") {
            capturableHours += hoursValue;
          } else {
            uncapturableHours += hoursValue;
          }

          const compositeKey = `${featureId}-${captureType}`;
          if (!featureMap[compositeKey]) {
            featureMap[compositeKey] = {
              feature_id: entry.feature?.id || null,
              feature_name: featureName,
              is_deleted: entry.feature?.is_deleted || false,
              asset_capture_type: captureType,
              hours: 0,
              percent: 0,
            };
          }
          featureMap[compositeKey].hours += hoursValue;
        });

        const details = Object.values(featureMap).map((detail) => ({
          ...detail,
          hours: Number(detail.hours.toFixed(2)),
          percent:
            totalHours > 0
              ? Number(((detail.hours / totalHours) * 100).toFixed(2))
              : 0,
        }));

        // Sort details by hours descending
        details.sort(
          (firstDetail, secondDetail) => secondDetail.hours - firstDetail.hours,
        );

        const capturablePercent =
          totalHours > 0 ? (capturableHours / totalHours) * 100 : 0;
        const uncapturablePercent =
          totalHours > 0 ? (uncapturableHours / totalHours) * 100 : 0;
        const hoursPercent =
          globalTotalHours > 0 ? (totalHours / globalTotalHours) * 100 : 0;

        return {
          project_id: project.id,
          project_code: project.id.toString().padStart(4, "0"),
          project_name: project.name + (project.is_deleted ? " (DELETED)" : ""),
          is_deleted: project.is_deleted,
          capturable_percent: Number(capturablePercent.toFixed(2)),
          uncapturable_percent: Number(uncapturablePercent.toFixed(2)),
          capturable_hours: Number(capturableHours.toFixed(2)),
          uncapturable_hours: Number(uncapturableHours.toFixed(2)),
          hours: Number(totalHours.toFixed(2)),
          hours_percent: Number(hoursPercent.toFixed(2)),
          details,
        };
      })
      .filter((p) => p.hours > 0 || !p.is_deleted);

    results.sort(
      (firstResult, secondResult) => secondResult.hours - firstResult.hours,
    );

    return results;
  },

  async getSummary(startDate: string, endDate: string) {
    // ⚡️ Fix Timezone Offset: Use T00:00:00 to ensure local time parsing (ICT+7) which aligns with Summary API
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    // 1. Get total hours aggregated by capture type
    const entries = await PrismaTimesheet.timesheetEntry.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        is_deleted: false,
      },
      select: {
        hours: true,
        feature: {
          select: {
            assetCaptureType: true,
            is_deleted: true, // Also track if feature is deleted
          },
        },
        projectId: true,
        project: {
          select: {
            is_deleted: true, // Also track if project is deleted
          },
        },
      },
    });

    let totalHours = 0;
    let capturableHours = 0;

    entries.forEach((entry) => {
      const hoursValue = Number(entry.hours);
      totalHours += hoursValue;
      if (entry.feature?.assetCaptureType === "CAPTUREABLE") {
        capturableHours += hoursValue;
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
