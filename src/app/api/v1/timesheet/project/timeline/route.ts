import { errorResponse, successResponse } from "@/helpers/api/response";
import { validateRequest } from "@/helpers/api/validate.request";
import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const GetTimelineSchema = z.object({
  status: z.string().optional(),
  keyword: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  name_en: z.string().optional(),
  description: z.string().default(""),
  categoryType: z.string().optional(),
  status: z.string().default("open"),
  approval: z.string().default("pending"),
  approval_status: z.string().default("pending"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  estimateWorkhours: z.number().optional(),
  group_id: z.number().optional(),
  projectStatusId: z.number().optional(),
  by: z.union([z.number(), z.string()]),
});

const CreateFeatureSchema = z.object({
  project_id: z.number().min(1, "Project ID is required"),
  name: z.string().min(1, "Feature name is required"),
  name_en: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assetCaptureType: z
    .enum(["CAPTUREABLE", "UN_CAPTUREABLE"])
    .default("CAPTUREABLE"),
  status: z.string().default("open"),
  projectStatusId: z.number().optional(),
  backlogDescription: z.any().optional(),
  estimateWorkhours: z.number().optional(),
  by: z.union([z.number(), z.string()]),
});

const UpdateProjectSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().optional(),
  name_en: z.string().optional(),
  description: z.string().optional(),
  categoryType: z.string().optional(),
  status: z.string().optional(),
  approval: z.string().optional(),
  approval_status: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  estimateWorkhours: z.number().optional(),
  group_id: z.number().optional(),
  projectStatusId: z.number().optional(),
  by: z.union([z.number(), z.string()]),
});

const UpdateFeatureSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().optional(),
  name_en: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assetCaptureType: z.enum(["CAPTUREABLE", "UN_CAPTUREABLE"]).optional(),
  status: z.string().optional(),
  projectStatusId: z.number().optional(),
  backlogDescription: z.any().optional(),
  estimateWorkhours: z.number().optional(),
  projectId: z.number().optional(),
  by: z.union([z.number(), z.string()]),
});

const DeleteSchema = z.object({
  type: z.enum(["project", "sub-project"]),
  id: z.union([z.number(), z.string()]),
  by: z.union([z.number(), z.string()]),
});

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

const validateProjectExists = async (projectId: number) => {
  const project = await PrismaTimesheet.project.findUnique({
    where: { id: projectId, is_deleted: false },
  });

  if (!project) {
    return NextResponse.json(
      errorResponse({
        message_en: "Project not found",
        message_th: "ไม่พบโครงการที่ระบุ",
        status: 404,
      }),
      { status: 404 },
    );
  }

  return true;
};

const validateFeatureExists = async (featureId: number) => {
  const feature = await PrismaTimesheet.feature.findUnique({
    where: { id: featureId, is_deleted: false },
  });

  if (!feature) {
    return NextResponse.json(
      errorResponse({
        message_en: "Feature not found",
        message_th: "ไม่พบ feature ที่ระบุ",
        status: 404,
      }),
      { status: 404 },
    );
  }

  return true;
};

// ==========================================
// GET - Fetch Timeline Data
// ==========================================

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const keyword = searchParams.get("keyword") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const whereClause: any = {
      is_deleted: false,
    };

    // Filter by status
    if (status && status !== "All") {
      whereClause.status = status;
    }

    // Filter by keyword
    if (keyword) {
      whereClause.OR = [
        { name: { contains: keyword, mode: "insensitive" } },
        { name_en: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ];
    }

    // Filter by date range
    if (from || to) {
      whereClause.start_date = {};
      if (from) whereClause.start_date.gte = new Date(from);
      if (to) whereClause.start_date.lte = new Date(to);
    }

    // Fetch projects with features
    const projects = await PrismaTimesheet.project.findMany({
      where: whereClause,
      include: {
        features: {
          where: { is_deleted: false },
          include: {
            projectStatus: true,
            projectAssignees: true,
          },
        },
        group: true,
        projectStatus: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate metrics
    let totalProjects = 0;
    let totalSubProjects = 0;
    let overdue = 0;
    let completed = 0;
    let inProgress = 0;

    const timelineData = projects.map((project) => {
      totalProjects++;
      const features = project.features || [];
      totalSubProjects += features.length;

      // Calculate project metrics
      let projectStart = project.start_date?.toISOString() || null;
      let projectEnd = project.end_date?.toISOString() || null;
      let projectProgress = 0;

      // If project dates not set, calculate from features
      if (!projectStart || !projectEnd) {
        if (features.length > 0) {
          const startDates = features
            .map((f) => (f.startDate ? dayjs(f.startDate).valueOf() : null))
            .filter((d) => d !== null) as number[];
          const endDates = features
            .map((f) => (f.endDate ? dayjs(f.endDate).valueOf() : null))
            .filter((d) => d !== null) as number[];

          if (startDates.length > 0 && !projectStart) {
            projectStart = dayjs(Math.min(...startDates)).toISOString();
          }
          if (endDates.length > 0 && !projectEnd) {
            projectEnd = dayjs(Math.max(...endDates)).toISOString();
          }
        }
      }

      // Calculate progress based on completed features
      if (features.length > 0) {
        const completedFeatures = features.filter(
          (f) => f.status === "close" || f.status === "completed",
        ).length;
        projectProgress = Math.round(
          (completedFeatures / features.length) * 100,
        );
      }

      // Update metrics
      if (project.status === "close") {
        completed++;
      } else if (project.status === "open") {
        inProgress++;
      }

      // Check if overdue
      if (
        projectEnd &&
        dayjs(projectEnd).isBefore(dayjs()) &&
        project.status !== "close"
      ) {
        overdue++;
      }

      return {
        id: `p-${project.id}`,
        realId: project.id,
        type: "project",
        name: project.name,
        name_en: project.name_en,
        description: project.description,
        status: project.status,
        approval: project.approval,
        approval_status: project.approval_status,
        categoryType: project.categoryType,
        start: projectStart,
        end: projectEnd,
        progress: projectProgress,
        estimateWorkhours: project.estimateWorkhours,
        group: project.group,
        projectStatus: project.projectStatus,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        children: features.map((f) => ({
          id: `s-${f.id}`,
          realId: f.id,
          type: "sub-project",
          name: f.name,
          name_en: f.name_en,
          start: f.startDate,
          end: f.endDate,
          status: f.status,
          assetCaptureType: f.assetCaptureType,
          estimateWorkhours: f.estimateWorkhours,
          backlogDescription: f.backlogDescription,
          projectId: project.id,
          projectStatus: f.projectStatus,
          projectAssignees: f.projectAssignees,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        })),
      };
    });

    return NextResponse.json(
      successResponse({
        data: {
          timeline: timelineData,
          metrics: {
            totalProjects,
            totalSubProjects,
            overdue,
            completed,
            inProgress,
          },
        },
        message_en: "Timeline data fetched successfully",
        message_th: "ดึงข้อมูล timeline สำเร็จ",
      }),
    );
  } catch (error: any) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Failed to fetch timeline data",
        message_th: "เกิดข้อผิดพลาดในการดึงข้อมูล timeline",
        error,
        status: 500,
      }),
      { status: 500 },
    );
  }
}

// ==========================================
// POST - Create Project or Feature
// ==========================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === "project") {
      const { data, error } = await validateRequest(req, CreateProjectSchema);
      if (error) return error;

      const {
        name,
        name_en,
        description,
        categoryType,
        status,
        approval,
        approval_status,
        start_date,
        end_date,
        estimateWorkhours,
        group_id,
        projectStatusId,
        by,
      } = data;

      const newProject = await PrismaTimesheet.project.create({
        data: {
          name,
          name_en,
          description,
          categoryType,
          status,
          approval,
          approval_status,
          start_date: start_date ? new Date(start_date) : null,
          end_date: end_date ? new Date(end_date) : null,
          estimateWorkhours: estimateWorkhours
            ? Number(estimateWorkhours)
            : null,
          group_id,
          projectStatusId,
          createdBy: Number(by),
          updatedBy: Number(by),
        },
        include: {
          group: true,
          projectStatus: true,
        },
      });

      return NextResponse.json(
        successResponse({
          data: newProject,
          message_en: "Project created successfully",
          message_th: "สร้างโครงการสำเร็จ",
        }),
      );
    }

    return NextResponse.json(
      errorResponse({
        message_en:
          "Invalid type. Only 'project' is supported. Use /api/v1/timesheet/project/sub-project/insert for sub-projects",
        message_th:
          "ประเภทไม่ถูกต้อง รองรับเฉพาะ 'project' สำหรับ sub-project ใช้ /api/v1/timesheet/project/sub-project/insert",
        status: 400,
      }),
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error creating:", error);
    return NextResponse.json(
      errorResponse({
        message_en: error.message || "Failed to create",
        message_th: "เกิดข้อผิดพลาดในการสร้าง",
        error,
        status: 500,
      }),
      { status: 500 },
    );
  }
}

// ==========================================
// PATCH - Update Project or Feature
// ==========================================
