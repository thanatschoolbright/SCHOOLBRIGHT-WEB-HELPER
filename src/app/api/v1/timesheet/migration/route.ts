import prisma from "@/helpers/prisma-timesheet";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "projects") {
      const projects = await prisma.project.findMany({
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ data: projects });
    }

    if (action === "features") {
      const projectId = searchParams.get("projectId");
      if (!projectId)
        return NextResponse.json(
          { error: "projectId required" },
          { status: 400 },
        );
      const features = await prisma.feature.findMany({
        where: { projectId: parseInt(projectId) },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ data: features });
    }

    if (action === "entries") {
      const sourceProjectId = searchParams.get("sourceProjectId");
      const sourceFeatureId = searchParams.get("sourceFeatureId");

      if (!sourceProjectId || !sourceFeatureId) {
        return NextResponse.json(
          { error: "sourceProjectId and sourceFeatureId are required" },
          { status: 400 },
        );
      }

      const entries = await prisma.timesheetEntry.findMany({
        where: {
          projectId: parseInt(sourceProjectId),
          featureId: parseInt(sourceFeatureId),
          is_deleted: false,
        },
        orderBy: {
          date: "asc",
        },
      });

      const adminIds = [
        ...new Set(
          entries
            .map((e: any) => e.createdBy)
            .filter((id: any): id is number => id !== null),
        ),
      ];
      const users = await prisma.user.findMany({
        where: { admin_id: { in: adminIds } },
        select: {
          admin_id: true,
          firstname_th: true,
          lastname_th: true,
          nickname: true,
        },
      });

      const data = entries.map((entry: any) => ({
        ...entry,
        user: users.find((u: any) => u.admin_id === entry.createdBy),
      }));

      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { timesheetId, targetProjectId, targetFeatureId } = body;

    if (!timesheetId || !targetProjectId || !targetFeatureId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const updated = await prisma.timesheetEntry.update({
      where: { id: timesheetId },
      data: {
        projectId: targetProjectId,
        featureId: targetFeatureId,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
