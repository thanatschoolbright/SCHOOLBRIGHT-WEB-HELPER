import { PrismaTimesheet } from "@/helpers/prisma-timesheet";

export interface CapturableUserEntry {
  entry_id: number;
  date: string;
  hours: number;
  description: string | null;
  admin_id: number | null;
  user_name: string;
  user_nickname: string | null;
  feature_id: number;
  feature_name: string;
  asset_capture_type: string;
}

export const CapturableDetailsService = {
  /**
   * ดึงรายละเอียดการลงเวลาของโครงการ ระบุผู้ใช้งานและฟีเจอร์
   * @param projectId ID ของโครงการ
   * @param startDate วันที่เริ่มต้น
   * @param endDate วันที่สิ้นสุด
   */
  async getEntriesByProject(
    projectId: number,
    startDate: string,
    endDate: string,
  ): Promise<CapturableUserEntry[]> {
    // ⚡️ Fix Timezone Offset: Use T00:00:00 to ensure local time parsing (ICT+7) which aligns with Summary API
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    // 1. ดึงข้อมูล TimesheetEntry พร้อม Feature
    const entries = await PrismaTimesheet.timesheetEntry.findMany({
      where: {
        projectId: projectId,
        is_deleted: false,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        feature: {
          select: {
            name: true,
            assetCaptureType: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    if (entries.length === 0) return [];

    // 2. ดึงข้อมูล User ทั้งหมดที่เกี่ยวข้อง (เนื่องจาก createdBy ใน timesheet_entry คือ admin_id)
    const adminIds = Array.from(
      new Set(
        entries
          .map((e) => e.createdBy)
          .filter((id): id is number => id !== null),
      ),
    );
    const users = await PrismaTimesheet.user.findMany({
      where: {
        admin_id: { in: adminIds },
      },
      select: {
        id: true,
        admin_id: true,
        firstname_th: true,
        lastname_th: true,
        nickname: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.admin_id, u]));

    // 3. Mapping ข้อมูลกลับไปในรูปแบบที่ต้องการ
    return entries.map((entry) => {
      const user = entry.createdBy ? userMap.get(entry.createdBy) : null;
      const firstName = user?.firstname_th ?? "";
      const lastName = user?.lastname_th ?? "";
      const fullName =
        firstName || lastName
          ? `${firstName} ${lastName}`.trim()
          : "ไม่ระบุชื่อ";

      return {
        entry_id: entry.id,
        date: entry.date.toISOString().split("T")[0],
        hours: Number(entry.hours),
        description: entry.description,
        admin_id: user?.admin_id ?? null,
        user_name: fullName,
        user_nickname: user?.nickname ?? null,
        feature_id: entry.featureId,
        feature_name: entry.feature.name,
        asset_capture_type: entry.feature.assetCaptureType,
      };
    });
  },
};
