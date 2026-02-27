import prisma from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";

/**
 * API for Timesheet Migration
 * Handles fetching projects, sub-projects, users, and migrating entries.
 */

// --- GET METHOD ---
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // 1. Fetch all projects for migration target
    if (action === "projects") {
      const projects = await prisma.project.findMany({
        where: { is_deleted: false },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      });
      return NextResponse.json({ data: projects });
    }

    // 2. Fetch all sub-projects (features) for a given project
    if (action === "features") {
      const projectId = searchParams.get("projectId");
      if (!projectId) {
        return NextResponse.json(
          { error: "projectId required" },
          { status: 400 },
        );
      }
      const features = await prisma.feature.findMany({
        where: { projectId: parseInt(projectId), is_deleted: false },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          ticket_number: true,
        },
      });
      return NextResponse.json({ data: features });
    }

    // 3. Fetch all users who have entries (for selection)
    if (action === "users") {
      const activeUsers = await prisma.user.findMany({
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
      return NextResponse.json({ data: activeUsers });
    }

    // 4. Fetch timesheet entries for migration
    if (action === "entries") {
      const adminId = searchParams.get("admin_id");
      const hasIssues = searchParams.get("hasIssues") === "true";

      const whereClause: any = {
        is_deleted: false,
      };

      if (adminId) {
        whereClause.createdBy = parseInt(adminId);
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

      const finalData = hasIssues ? results.filter((e) => e.hasIssue) : results;
      return NextResponse.json({ data: finalData });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API_MIGRATION_GET_ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST METHOD ---
// มั่นใจว่ามี POST เพียงแค่อันเดียวในไฟล์นี้
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    /** * ตรวจสอบว่า Client ส่งค่ามาในรูปแบบไหน
     * จาก Error log ก่อนหน้าดูเหมือนระบบคาดหวัง timesheetId
     * แต่ใน Logic นี้ใช้ entryIds (Array)
     */
    const { entryIds, targetProjectId, targetFeatureId } = body;

    if (
      !Array.isArray(entryIds) ||
      entryIds.length === 0 ||
      !targetProjectId ||
      !targetFeatureId
    ) {
      return NextResponse.json(
        {
          error:
            "entryIds (array), targetProjectId, and targetFeatureId are required",
        },
        { status: 400 },
      );
    }

    const result = await prisma.timesheetEntry.updateMany({
      where: {
        id: { in: entryIds.map((id: any) => parseInt(id)) },
      },
      data: {
        projectId: parseInt(targetProjectId),
        featureId: parseInt(targetFeatureId),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${result.count} entries`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("[API_MIGRATION_POST_ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
