import { NextRequest, NextResponse } from "next/server";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const keyword = searchParams.get("keyword");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const whereClause: any = {
      is_deleted: false,
    };

    if (status && status !== "All") {
      whereClause.status = status; // Adjust if status logic is complex
    }

    if (keyword) {
      whereClause.OR = [
        { name: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ];
    }

    // Fetch projects with features
    const projects = await PrismaTimesheet.project.findMany({
      where: whereClause,
      include: {
        features: {
          where: { is_deleted: false },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform and calculate metrics
    let totalProjects = 0;
    let totalSubProjects = 0;
    let overdue = 0;
    let completed = 0;
    let inProgress = 0;

    const timelineData = projects.map((project) => {
      totalProjects++;
      const features = project.features || [];
      totalSubProjects += features.length;

      // Calculate project start/end from features if not available (Project doesn't have start/end in schema)
      let projectStart = null;
      let projectEnd = null;
      let projectProgress = 0;

      if (features.length > 0) {
        const startDates = features
          .map((f) => (f.startDate ? dayjs(f.startDate).valueOf() : null))
          .filter((d) => d !== null) as number[];
        const endDates = features
          .map((f) => (f.endDate ? dayjs(f.endDate).valueOf() : null))
          .filter((d) => d !== null) as number[];

        if (startDates.length > 0)
          projectStart = dayjs(Math.min(...startDates)).toISOString();
        if (endDates.length > 0)
          projectEnd = dayjs(Math.max(...endDates)).toISOString();

        // Calculate progress based on completed features or time elapsed
        // Simple logic: % of features completed (status = 'close' or similar?)
        // Schema has 'status' string. Let's assume 'close' or 'completed'.
        // Or based on time.
        // Let's use status for now.
        const completedFeatures = features.filter(
          (f) => f.status === "close" || f.status === "completed"
        ).length;
        projectProgress =
          features.length > 0
            ? Math.round((completedFeatures / features.length) * 100)
            : 0;
      }

      // Metrics
      if (project.status === "close") completed++;
      else if (project.status === "open") inProgress++;
      // Overdue logic could be added here

      return {
        id: `p-${project.id}`,
        realId: project.id,
        type: "project",
        name: project.name,
        description: project.description,
        status: project.status,
        start: projectStart,
        end: projectEnd,
        progress: projectProgress,
        categoryType: project.categoryType,
        children: features.map((f) => ({
          id: `s-${f.id}`,
          realId: f.id,
          type: "sub-project",
          name: f.name,
          start: f.startDate,
          end: f.endDate,
          status: f.status,
          assetCaptureType: f.assetCaptureType,
          projectId: project.id,
        })),
      };
    });

    return NextResponse.json({
      data: timelineData,
      metrics: {
        totalProjects,
        totalSubProjects,
        overdue, // Placeholder
        completed,
        inProgress,
      },
    });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type === "project") {
      const newProject = await PrismaTimesheet.project.create({
        data: {
          name: data.name,
          description: data.description || "",
          categoryType: data.categoryType,
          status: data.status || "open",
          createdBy: data.by, // Assuming 'by' is passed
        },
      });
      return NextResponse.json({ success: true, data: newProject });
    } else if (type === "sub-project") {
      const newFeature = await PrismaTimesheet.feature.create({
        data: {
          projectId: data.project_id,
          name: data.name,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          assetCaptureType: data.assetCaptureType || "CAPTUREABLE",
          status: data.status || "open",
          createdBy: data.by,
          backlogDescription: data.backlogDescription || {},
        },
      });
      return NextResponse.json({ success: true, data: newFeature });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Error creating:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, data } = body;

    if (type === "project") {
      const updated = await PrismaTimesheet.project.update({
        where: { id: Number(id) },
        data: {
          name: data.name,
          description: data.description,
          categoryType: data.categoryType,
          status: data.status,
          updatedBy: data.by,
        },
      });
      return NextResponse.json({ success: true, data: updated });
    } else if (type === "sub-project") {
      const updated = await PrismaTimesheet.feature.update({
        where: { id: Number(id) },
        data: {
          name: data.name,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          assetCaptureType: data.assetCaptureType,
          status: data.status,
          backlogDescription: data.backlogDescription,
          updatedBy: data.by,
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Error updating:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, by } = body;

    if (type === "project") {
      await PrismaTimesheet.project.update({
        where: { id: Number(id) },
        data: { is_deleted: true, updatedBy: by },
      });
    } else if (type === "sub-project") {
      await PrismaTimesheet.feature.update({
        where: { id: Number(id) },
        data: { is_deleted: true, updatedBy: by },
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
