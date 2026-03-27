// ✨ Service สำหรับจัดการข้อมูล Project Timeline
import prisma from "@/helpers/prisma-timesheet";

export const timelineChartService = {
  /**
   * ✨ ดึงข้อมูลโครงการและโครงการย่อยสำหรับแสดงผล Timeline
   */
  async getProjectTimeline(query: {
    start_date?: string;
    end_date?: string;
    project_id?: number;
  }) {
    const { start_date, end_date, project_id } = query;

    const whereClause: any = {
      is_deleted: false,
    };

    if (project_id) {
      whereClause.id = project_id;
    }

    // สำหรับช่วงเวลา ถ้ามีระบุมาให้กรองโครงการที่คาบเกี่ยว
    if (start_date && end_date) {
      whereClause.OR = [
        {
          AND: [
            { start_date: { lte: new Date(end_date) } },
            { end_date: { gte: new Date(start_date) } },
          ],
        },
        {
          AND: [
            { start_date: { lte: new Date(end_date) } },
            { end_date: null },
          ],
        },
      ];
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        features: {
          where: { is_deleted: false },
          orderBy: { startDate: "asc" },
        },
        projectStatus: true,
      },
      orderBy: { start_date: "asc" },
    });

    return projects.map((project) => ({
      id: `p-${project.id}`,
      name: project.name,
      name_en: project.name_en,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.status,
      status_name: project.projectStatus?.nameTh || project.status,
      type: "project",
      children: project.features.map((feature) => ({
        id: `f-${feature.id}`,
        name: feature.name,
        name_en: feature.name_en,
        start_date: feature.startDate,
        end_date: feature.endDate,
        status: feature.status,
        type: "feature",
      })),
    }));
  },
};
