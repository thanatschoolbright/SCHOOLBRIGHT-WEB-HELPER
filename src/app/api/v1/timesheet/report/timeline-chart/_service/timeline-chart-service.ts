// ✨ Service สำหรับจัดการข้อมูล Project Timeline
import prisma from "@/helpers/prisma-timesheet";
import { TimelineChartQuery } from "../_validation/timeline-chart-schema";

export const timelineChartService = {
  /**
   * ✨ ดึงข้อมูลโครงการและโครงการย่อยสำหรับแสดงผล Timeline
   */
  async getProjectTimeline(query: TimelineChartQuery) {
    const {
      start_date,
      end_date,
      project_id,
      group_id,
      status_id,
      category_type,
      approval,
      sub_status_id,
      has_sub_projects,
      search,
    } = query;

    const whereClause: any = {
      is_deleted: false,
    };

    // ── กรองโครงการเจาะจง ─────────────────────────────────────
    if (project_id) {
      whereClause.id = project_id;
    }

    // ── กรองกลุ่มโครงการ ──────────────────────────────────────
    if (group_id) {
      whereClause.group_id = group_id;
    }

    // ── กรองสถานะโครงการ (projectStatusId) ───────────────────
    if (status_id) {
      whereClause.projectStatusId = status_id;
    }

    // ── กรองประเภทโครงการ ─────────────────────────────────────
    if (category_type) {
      whereClause.categoryType = category_type;
    }

    // ── กรองสถานะการอนุมัติ ───────────────────────────────────
    if (approval) {
      whereClause.approval = approval;
    }

    // ── ค้นหาชื่อโครงการ ──────────────────────────────────────
    if (search) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { name: { contains: search, mode: "insensitive" } },
        { name_en: { contains: search, mode: "insensitive" } },
      ];
    }

    // ── กรองช่วงวันที่ (โครงการที่คาบเกี่ยวกับช่วงที่ระบุ) ────
    if (start_date && end_date) {
      const dateFilter = [
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

      // ถ้ามี OR อยู่แล้ว (จาก search) ต้องใช้ AND ครอบ
      if (whereClause.OR) {
        whereClause.AND = [{ OR: whereClause.OR }, { OR: dateFilter }];
        delete whereClause.OR;
      } else {
        whereClause.OR = dateFilter;
      }
    }

    // ── กรองสถานะโครงการย่อย ─────────────────────────────────
    const featureWhere: any = { is_deleted: false };
    if (sub_status_id) {
      featureWhere.projectStatusId = sub_status_id;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        features: {
          where: featureWhere,
          orderBy: { startDate: "asc" },
          include: { projectStatus: true },
        },
        projectStatus: true,
        group: true,
      },
      orderBy: { start_date: "asc" },
    });

    // ── กรอง has_sub_projects หลัง query (Prisma ไม่รองรับ count condition ตรงๆ) ──
    const filtered =
      has_sub_projects === true
        ? projects.filter((p) => p.features.length > 0)
        : has_sub_projects === false
          ? projects.filter((p) => p.features.length === 0)
          : projects;

    return filtered.map((project) => ({
      id: `p-${project.id}`,
      name: project.name,
      name_en: project.name_en,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.status,
      status_name: project.projectStatus?.nameTh || project.status,
      category_type: project.categoryType,
      approval: project.approval,
      group_name: project.group?.name_th || null,
      type: "project",
      color_hex: project.colorHex ?? "#1890ff",
      color_hex_feature: project.colorHexFeature ?? "#52c41a",
      children: project.features.map((feature) => ({
        id: `f-${feature.id}`,
        name: feature.name,
        name_en: feature.name_en,
        start_date: feature.startDate,
        end_date: feature.endDate,
        status: feature.status,
        status_name: feature.projectStatus?.nameTh || feature.status,
        projectStatusId: feature.projectStatusId,
        type: "feature",
        project_id: project.id,
        // ใช้สีของ feature เองก่อน ถ้าไม่มีให้ fallback ไป colorHexFeature ของ parent
        color_hex: feature.colorHex ?? project.colorHexFeature ?? "#52c41a",
      })),
    }));
  },

  /**
   * ✨ ดึงรายการกลุ่มโครงการทั้งหมด (สำหรับ Dropdown)
   */
  async getGroupList() {
    const groups = await prisma.group.findMany({
      orderBy: { name_th: "asc" },
    });
    return groups.map((g) => ({ id: g.id, name: g.name_th, name_en: g.name_en }));
  },
};
