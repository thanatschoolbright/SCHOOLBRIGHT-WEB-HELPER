import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import dayjs from "dayjs";
import { PMDashboardQueryInput } from "../_validation/dashboard-schema";

/**
 * ✨ ดึงข้อมูล Analytics สำหรับ Project Manager Dashboard (Project Health & Workload)
 * @param payload เงื่อนไขการกรองข้อมูล
 */
export async function getPMDashboardAnalytics(payload: PMDashboardQueryInput) {
  const startDate = payload.start_date
    ? dayjs(payload.start_date).startOf("day").toDate()
    : dayjs().startOf("month").toDate();
  const endDate = payload.end_date
    ? dayjs(payload.end_date).endOf("day").toDate()
    : dayjs().endOf("month").toDate();

  // 1. ดึงโครงการทั้งหมด (Projects) พร้อม Features และ TimesheetEntries
  const projects = await PrismaTimesheet.project.findMany({
    where: {
      is_deleted: false,
      ...(payload.group_id && { group_id: Number(payload.group_id) }),
    },
    include: {
      timesheets: {
        where: {
          is_deleted: false,
          date: { gte: startDate, lte: endDate },
        },
      },
      features: {
        where: { is_deleted: false },
        include: {
          timesheets: {
            where: {
              is_deleted: false,
              date: { gte: startDate, lte: endDate },
            },
          },
        },
      },
    },
  });

  // 2. ดึงข้อมูล Workload พนักงานจาก TimesheetEntry ในช่วงเวลาที่เลือก
  const timesheetEntries = await PrismaTimesheet.timesheetEntry.findMany({
    where: {
      is_deleted: false,
      date: { gte: startDate, lte: endDate },
    },
    // หมายเหตุ: ใน schema.prisma ของคุณ TimesheetEntry ไม่มี user relation ตรงๆ แต่มี createdBy (admin_id)
  });

  // รวบรวม admin_ids ของพนักงานที่มีการสร้างรายการ
  const uniqueAdminIds = Array.from(
    new Set(
      timesheetEntries.map((e) => e.createdBy).filter((id) => id !== null),
    ),
  ) as number[];

  const users = await PrismaTimesheet.user.findMany({
    where: {
      admin_id: { in: uniqueAdminIds },
      is_deleted: false,
    },
    include: { department: true },
  });

  // 3. ประมวลผลข้อมูล Summary
  const totalProjects = projects.length;
  let totalHours = 0;
  let totalFeatures = 0;

  const projectHealthData = projects.map((project) => {
    // รวมชั่วโมงจาก timesheets ของ project และ feature
    const projectHours = project.timesheets.reduce(
      (sum, e) => sum + (Number(e.hours) || 0),
      0,
    );
    const featureHours = project.features.reduce((fSum, f) => {
      totalFeatures++;
      return (
        fSum +
        f.timesheets.reduce((tSum, e) => tSum + (Number(e.hours) || 0), 0)
      );
    }, 0);

    const actualHours = projectHours + featureHours;
    totalHours += actualHours;
    const estimateHours = Number(project.estimateWorkhours) || 0;

    let percent = 0;
    if (estimateHours > 0) {
      percent = Number(((actualHours / estimateHours) * 100).toFixed(2));
    }

    let status = "Healthy";
    if (percent > 100) status = "Over Budget";
    else if (percent > 80) status = "Warning";
    else if (actualHours > 0) status = "In Progress";

    return {
      id: project.id,
      name: project.name,
      estimate: estimateHours,
      actual: actualHours,
      percent: percent,
      status: status,
    };
  });

  // 4. ประมวลผลข้อมูล Workload พนักงาน
  const workloadMap = new Map();
  timesheetEntries.forEach((entry) => {
    if (!entry.createdBy) return;
    const adminId = entry.createdBy;
    const hours = Number(entry.hours) || 0;

    if (!workloadMap.has(adminId)) {
      workloadMap.set(adminId, { totalHours: 0, taskCount: 0 });
    }
    const current = workloadMap.get(adminId);
    current.totalHours += hours;
    current.taskCount += 1;
  });

  const workloadData = users.map((user) => {
    const stats = workloadMap.get(user.admin_id) || {
      totalHours: 0,
      taskCount: 0,
    };
    // CAPACITY LOGIC: สมมติว่าใน 1 สัปดาห์ (หรือช่วงวันที่เลือก)
    // สำหรับ Prototype นี้จะคิด base 40 ชม. ต่อสัปดาห์
    const baseCapacity = 40;
    const loadPercent = Number(
      ((stats.totalHours / baseCapacity) * 100).toFixed(2),
    );

    return {
      name:
        `${user.firstname_th ?? ""} ${user.lastname_th ?? ""}`.trim() ||
        user.username,
      department: user.department?.name_th || "ไม่ระบุแผนก",
      tasks: stats.taskCount,
      total_hours: stats.totalHours,
      load: loadPercent > 200 ? 200 : loadPercent, // Cap ไว้ที่ 200 เพื่อการแสดงผล
      color:
        loadPercent > 90 ? "#f5222d" : loadPercent > 70 ? "#faad14" : "#52c41a",
    };
  });

  return {
    summary: {
      total_projects: totalProjects,
      total_hours: totalHours,
      total_features: totalFeatures,
      avg_completion:
        projectHealthData.length > 0
          ? Number(
              (
                projectHealthData.reduce((sum, p) => sum + p.percent, 0) /
                projectHealthData.length
              ).toFixed(2),
            )
          : 0,
    },
    project_health: projectHealthData,
    workload_analysis: workloadData,
  };
}
