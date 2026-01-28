import { NextRequest, NextResponse } from "next/server";
import { PrismaTimesheet as prisma } from "@/helpers/prisma-timesheet";
import dayjs from "dayjs";

export async function POST(request: NextRequest) {
  try {
    // Fetch projects with features
    const projects = await prisma.project.findMany({
      where: { is_deleted: false },
      include: {
        features: {
          where: { is_deleted: false },
          orderBy: { startDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const timelineData = projects.map((project) => {
      // Calculate project dates based on features
      let startDate = project.createdAt; // Default to created at
      let endDate = dayjs(project.createdAt).add(1, "month").toDate(); // Default to 1 month later if no data

      const validFeatures = project.features.filter(
        (f) => f.startDate && f.endDate,
      );

      if (validFeatures.length > 0) {
        // Find min start and max end
        const startDates = validFeatures.map((f) =>
          new Date(f.startDate!).getTime(),
        );
        const endDates = validFeatures.map((f) =>
          new Date(f.endDate!).getTime(),
        );

        startDate = new Date(Math.min(...startDates));
        endDate = new Date(Math.max(...endDates));
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        startDate: startDate,
        endDate: endDate,
        categoryType: project.categoryType,
        features: project.features.map((f) => ({
          id: f.id,
          name: f.name,
          startDate: f.startDate || startDate, // Fallback to project start
          endDate: f.endDate || endDate, // Fallback to project end
          assetCaptureType: f.assetCaptureType,
        })),
      };
    });

    // Filter out projects that might have invalid dates or just to be safe
    const validTimelineData = timelineData.filter(
      (p) => p.startDate && p.endDate,
    );

    return NextResponse.json({
      success: true,
      data: validTimelineData,
    });
  } catch (error: any) {
    console.error("Error fetching timeline data:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
