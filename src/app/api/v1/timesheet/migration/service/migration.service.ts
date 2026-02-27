import prisma from "@/helpers/prisma-timesheet";
import { generateDescriptionWithChatGPT } from "../../entry/automate-fill/chatgpt";

export class MigrationService {
  /* ดึงรายชื่อโปรเจก์ทั้งหมดที่ยังไม่ถูกลบ */
  static async getProjects() {
    return await prisma.project.findMany({
      where: { is_deleted: false },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });
  }

  /* ดึงรายชื่อ Feature (Sub-project) ตาม project_id */
  static async getFeatures(project_id: number) {
    return await prisma.feature.findMany({
      where: { projectId: project_id, is_deleted: false },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        ticket_number: true,
      },
    });
  }

  /* ดึงรายชื่อพนักงานทั้งหมดที่มีในระบบ และยังไม่ถูกลบ */
  static async getUsers() {
    return await prisma.user.findMany({
      where: { is_deleted: false },
      select: {
        admin_id: true,
        firstname_th: true,
        lastname_th: true,
        nickname: true,
        employee_code: true,
      },
      orderBy: [{ firstname_th: "asc" }],
    });
  }

  /* ดึงรายการ Timesheet ของพนักงาน พร้อมระบุว่ามีปัญหาหรือไม่ */
  static async getEntries(admin_id?: number, has_issues: boolean = false) {
    const whereClause: any = {
      is_deleted: false,
    };

    if (admin_id) {
      whereClause.createdBy = admin_id;
    }

    const entries = await prisma.timesheetEntry.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true } },
        feature: { select: { id: true, name: true, ticket_number: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    const results = entries.map((entry: any) => {
      const issues = [];
      if (!entry.description || entry.description.trim().length === 0) {
        issues.push("MISSING_DESCRIPTION");
      }
      return {
        ...entry,
        hasIssue: issues.length > 0,
        issueTypes: issues,
      };
    });

    if (has_issues) {
      return results.filter((e) => e.hasIssue);
    }

    return results;
  }

  /* ย้ายรายการ Timesheet ไปยังโปรเจกต์และ Feature ใหม่ (Bulk Update) */
  static async migrateEntries(
    entry_ids: number[],
    target_project_id: number,
    target_feature_id: number,
  ) {
    const result = await prisma.timesheetEntry.updateMany({
      where: {
        id: { in: entry_ids },
      },
      data: {
        projectId: target_project_id,
        featureId: target_feature_id,
      },
    });

    return result;
  }

  /* ใช้ ChatGPT ช่วยวิเคราะห์และสร้างรายละเอียดงาน (Auto-fill) จากประวัติการทำงาน 10 รายการล่าสุด */
  static async generateDescriptions(admin_id: number, entry_ids: number[]) {
    // 1. ดึงประวัติ 10 รายการล่าสุดที่มีรายละเอียดงาน เพื่อใช้เป็นตัวอย่าง (Context)
    const history = await prisma.timesheetEntry.findMany({
      where: {
        createdBy: admin_id,
        is_deleted: false,
        description: { not: null, not: "" },
      },
      include: {
        project: { select: { name: true } },
        feature: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    // 2. ดึงข้อมูลรายการที่ต้องการจะ Generate
    const targetEntries = await prisma.timesheetEntry.findMany({
      where: {
        id: { in: entry_ids },
      },
      include: {
        project: { select: { name: true } },
        feature: { select: { name: true } },
      },
    });

    // 3. วนลูปส่งให้ AI ช่วยคิด
    const results = await Promise.all(
      targetEntries.map(async (entry) => {
        const generated = await generateDescriptionWithChatGPT({
          history: [...history, entry],
          fallback: `ดำเนินการในส่วน ${entry.feature?.name || "งานทั่วไป"}`,
        });

        return {
          id: entry.id,
          original_description: entry.description,
          suggested_description: generated,
          project_name: entry.project?.name,
          feature_name: entry.feature?.name,
          date: entry.date,
          history_used: history.length,
        };
      }),
    );

    return results;
  }

  /* บันทึกรายละเอียดงานที่ ChatGPT ช่วยสรุปให้ (Bulk Update) */
  static async updateDescriptions(
    updates: { id: number; description: string }[],
  ) {
    return await prisma.$transaction(
      updates.map((u) =>
        prisma.timesheetEntry.update({
          where: { id: u.id },
          data: { description: u.description },
        }),
      ),
    );
  }
}
