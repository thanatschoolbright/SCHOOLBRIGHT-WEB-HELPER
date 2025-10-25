import { PrismaClient as TimesheetPrismaClient } from "@/../generated/prisma-timesheet";
import * as XLSX from "xlsx";

/**
 * Interface สำหรับข้อมูลสรุปโปรเจ็ค
 */
export interface ProjectSummaryData {
  project_id: number;
  project_name: string;
  project_description?: string;
  total_hours: number;
  // ข้อมูลโปรเจ็คหลัก (สำหรับ sub_project)
  parent_project_id?: number;
  parent_project_name?: string;
  user_summaries: {
    user_id: number;
    user_name: string;
    employee_code?: string;
    hours: number;
  }[];
}

/**
 * Interface สำหรับพารามิเตอร์การสร้างรายงาน
 */
export interface ProjectSummaryParams {
  start_date: string;
  end_date: string;
  export_type: "project" | "sub_project";
}

/**
 * Service สำหรับจัดการข้อมูลสรุป Timesheet แยกตามโปรเจ็ค
 */
export class TimesheetProjectSummaryService {
  private static timesheetPrisma = new TimesheetPrismaClient();

  /**
   * ดึงข้อมูลสรุปแยกตามโปรเจ็ค
   */
  static async getProjectSummary(params: ProjectSummaryParams): Promise<ProjectSummaryData[]> {
    const { start_date, end_date, export_type } = params;

    try {
      // Build where condition
      const whereCondition: any = {
        date: {
          gte: new Date(start_date),
          lte: new Date(end_date + "T23:59:59.999Z"),
        },
        is_deleted: false,
      };

      // ดึงข้อมูล timesheet entries พร้อม project และ feature data
      const entries = await this.timesheetPrisma.timesheetEntry.findMany({
        where: whereCondition,
        include: {
          project: true,
          feature: true,
        },
        orderBy: [
          { projectId: 'asc' },
          { featureId: 'asc' },
          { createdBy: 'asc' },
        ],
      });

      // จัดกลุ่มข้อมูลตามประเภทที่เลือก
      const groups = new Map<string, {
        id: number;
        name: string;
        description?: string;
        parent_project_id?: number;
        parent_project_name?: string;
        entries: any[];
      }>();

      entries.forEach((entry: any) => {
        let groupKey: string;
        let groupId: number;
        let groupName: string;
        let groupDescription: string | undefined;
        let parentProjectId: number | undefined;
        let parentProjectName: string | undefined;

        if (export_type === "project") {
          // จัดกลุ่มตาม Project
          groupKey = `project-${entry.projectId}`;
          groupId = entry.projectId;
          groupName = entry.project?.name || 'ไม่ระบุชื่อโปรเจ็ค';
          groupDescription = entry.project?.description;
          // ไม่ต้องมี parent เพราะเป็น project หลัก
        } else {
          // จัดกลุ่มตาม Sub Project (Feature)
          groupKey = `feature-${entry.featureId}`;
          groupId = entry.featureId;
          groupName = entry.feature?.name || 'ไม่ระบุชื่อ Feature';
          groupDescription = JSON.stringify(entry.feature?.backlogDescription);
          // เพิ่มข้อมูล parent project
          parentProjectId = entry.projectId;
          parentProjectName = entry.project?.name || 'ไม่ระบุชื่อโปรเจ็ค';
        }

        if (!groups.has(groupKey)) {
          groups.set(groupKey, {
            id: groupId,
            name: groupName,
            description: groupDescription,
            parent_project_id: parentProjectId,
            parent_project_name: parentProjectName,
            entries: [],
          });
        }
        groups.get(groupKey)!.entries.push(entry);
      });

      // สร้างข้อมูลสรุป
      const projectSummaries: ProjectSummaryData[] = [];

      for (const [groupKey, group] of groups) {
        // จัดกลุ่มตาม user
        const userGroups = new Map<number, {
          hours: number;
          user_id: number;
        }>();

        group.entries.forEach((entry: any) => {
          const userId = entry.createdBy || 0;
          const hours = parseFloat(entry.hours.toString());

          if (!userGroups.has(userId)) {
            userGroups.set(userId, {
              hours: 0,
              user_id: userId,
            });
          }

          userGroups.get(userId)!.hours += hours;
        });

        // ดึงข้อมูล user
        const userIds = Array.from(userGroups.keys()).filter(id => id > 0);
        const users = await this.getUserDetails(userIds);

        // สร้าง user summaries
        const userSummaries = Array.from(userGroups.values()).map(userGroup => {
          const user = users.get(userGroup.user_id);
          return {
            user_id: userGroup.user_id,
            user_name: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.name || user.email || 'ไม่ระบุ' : 'ไม่ระบุ',
            employee_code: user?.employee_code,
            hours: userGroup.hours,
          };
        });

        const totalHours = userSummaries.reduce((sum, user) => sum + user.hours, 0);

        projectSummaries.push({
          project_id: group.id,
          project_name: group.name,
          project_description: group.description,
          parent_project_id: group.parent_project_id,
          parent_project_name: group.parent_project_name,
          total_hours: totalHours,
          user_summaries: userSummaries.sort((a, b) => b.hours - a.hours), // เรียงตามชั่วโมงมากไปน้อย
        });
      }

      return projectSummaries.sort((a, b) => b.total_hours - a.total_hours); // เรียงตามชั่วโมงรวมมากไปน้อย

    } catch (error: any) {
      console.error("Error getting project summary:", error);
      throw new Error(`ไม่สามารถดึงข้อมูลสรุปโปรเจ็คได้: ${error.message}`);
    }
  }

  /**
   * ดึงข้อมูลผู้ใช้จาก main database
   */
  private static async getUserDetails(userIds: number[]): Promise<Map<number, any>> {
    if (userIds.length === 0) return new Map();

    try {
      // เรียกใช้ API เพื่อดึงข้อมูล user
      const response = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/v1/admin/user/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 1000,
          page: 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const users = new Map<number, any>();
        
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((user: any) => {
            if (userIds.includes(user.admin_id || user.id)) {
              users.set(user.admin_id || user.id, user);
            }
          });
        }
        
        return users;
      } else {
        console.warn("Failed to fetch user details, using mock data");
      }
    } catch (error) {
      console.error("Error getting user details:", error);
    }

    // Fallback: ใช้ข้อมูลจำลอง
    const users = new Map<number, any>();
    userIds.forEach(id => {
      users.set(id, {
        id,
        firstname: `User`,
        lastname: `${id}`,
        name: `User ${id}`,
        email: `user${id}@example.com`,
        employee_code: `EMP${id.toString().padStart(3, '0')}`,
      });
    });

    return users;
  }

  /**
   * สร้างไฟล์ Excel สำหรับรายงานสรุปโปรเจ็ค
   */
  static async generateProjectSummaryExcel(params: ProjectSummaryParams): Promise<Buffer> {
    try {
      const projectSummaries = await this.getProjectSummary(params);

      // สร้าง workbook
      const workbook = XLSX.utils.book_new();

      // สร้างแผ่นงานสรุปรวม  
      const currentDate = new Date().toLocaleDateString('th-TH');
      const reportTypeLabel = params.export_type === "project" ? "โปรเจ็ค" : "Sub Project (Feature)";
      
      let headerRow: string[];
      if (params.export_type === "sub_project") {
        // สำหรับ sub project เพิ่ม column โปรเจ็คหลัก
        headerRow = [
          "โปรเจ็คหลัก", 
          "รหัสโปรเจ็คหลัก", 
          reportTypeLabel, 
          `รหัส${reportTypeLabel}`, 
          "จำนวนชั่วโมงรวม", 
          "จำนวนผู้ใช้", 
          "เปอร์เซ็นต์ของรวม"
        ];
      } else {
        // สำหรับ project ใช้ header เดิม
        headerRow = [
          reportTypeLabel, 
          `รหัส${reportTypeLabel}`, 
          "จำนวนชั่วโมงรวม", 
          "จำนวนผู้ใช้", 
          "เปอร์เซ็นต์ของรวม"
        ];
      }

      const summaryData = [
        [`รายงานสรุป Timesheet แยกตาม${reportTypeLabel}`],
        [`ช่วงวันที่: ${params.start_date} ถึง ${params.end_date}`],
        [`วันที่สร้างรายงาน: ${currentDate}`],
        [], // บรรทัดว่าง
        headerRow,
      ];

      // คำนวณชั่วโมงรวมก่อน
      const totalHours = projectSummaries.reduce((sum: number, p: ProjectSummaryData) => sum + p.total_hours, 0);

      projectSummaries.forEach((project: ProjectSummaryData) => {
        const percentage = totalHours > 0 
          ? ((project.total_hours / totalHours) * 100).toFixed(2)
          : "0.00";

        let dataRow: (string | number)[];
        if (params.export_type === "sub_project") {
          // สำหรับ sub project เพิ่มข้อมูลโปรเจ็คหลัก
          dataRow = [
            project.parent_project_name || 'ไม่ระบุ',
            project.parent_project_id?.toString() || 'ไม่ระบุ',
            project.project_name,
            project.project_id.toString(),
            project.total_hours.toFixed(2),
            project.user_summaries.length.toString(),
            `${percentage}%`,
          ];
        } else {
          // สำหรับ project ใช้ data เดิม
          dataRow = [
            project.project_name,
            project.project_id.toString(),
            project.total_hours.toFixed(2),
            project.user_summaries.length.toString(),
            `${percentage}%`,
          ];
        }
          
        summaryData.push(dataRow as string[]);
      });

      // เพิ่มบรรทัดรวม
      const totalUsers = new Set(
        projectSummaries.flatMap((p: ProjectSummaryData) => p.user_summaries.map((u: any) => u.user_id))
      ).size;

      // เพิ่มบรรทัดรวม
      let totalRow: string[];
      if (params.export_type === "sub_project") {
        totalRow = ["รวมทั้งหมด", "", "", "", totalHours.toFixed(2), totalUsers.toString(), "100.00%"];
      } else {
        totalRow = ["รวมทั้งหมด", "", totalHours.toFixed(2), totalUsers.toString(), "100.00%"];
      }

      summaryData.push(
        [], // บรรทัดว่าง
        totalRow
      );

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "สรุปรวม");

      // สร้างแผ่นงานรายละเอียดแต่ละ Project/Sub Project  
      projectSummaries.forEach((project, index) => {
        const detailData = [
          [`${reportTypeLabel}: ${project.project_name} (รหัส: ${project.project_id})`],
          [`รายละเอียด: ${project.project_description || 'ไม่มีรายละเอียด'}`],
          [`จำนวนชั่วโมงรวม: ${project.total_hours.toFixed(2)} ชั่วโมง`],
          [], // บรรทัดว่าง
          ["ผู้ใช้", "รหัสพนักงาน", "จำนวนชั่วโมง", "เปอร์เซ็นต์"],
        ];

        project.user_summaries.forEach((user: any) => {
          const percentage = project.total_hours > 0 
            ? ((user.hours / project.total_hours) * 100).toFixed(2)
            : "0.00";

          detailData.push([
            user.user_name,
            user.employee_code || 'ไม่ระบุ',
            user.hours.toFixed(2),
            `${percentage}%`,
          ]);
        });

        const sheetName = `${reportTypeLabel} ${index + 1}`;
        const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
        XLSX.utils.book_append_sheet(workbook, detailSheet, sheetName);
      });

      // สร้าง buffer
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      return buffer;

    } catch (error: any) {
      console.error("Error generating Excel:", error);
      throw new Error(`ไม่สามารถสร้างไฟล์ Excel ได้: ${error.message}`);
    }
  }
}