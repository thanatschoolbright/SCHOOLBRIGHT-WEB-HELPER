import { callWithLogging } from "@/helpers/call-with-logging";
import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";
import { API_URL } from "@/services/api-url";

// --- Cache สำหรับรายชื่อโรงเรียน (5 นาที) ---
const SCHOOL_CACHE_TTL = 5 * 60 * 1000;
let cachedSchools: SchoolItem[] | null = null;
let schoolCacheTime = 0;

export interface SchoolItem {
  school_id: number;
  school_name_th: string;
  school_name_en: string;
}

/**
 * ดึงรายชื่อโรงเรียนทั้งหมดจาก External API พร้อม Cache
 */
async function getSchoolListService(): Promise<SchoolItem[]> {
  const now = Date.now();
  if (cachedSchools && now - schoolCacheTime < SCHOOL_CACHE_TTL) {
    return cachedSchools;
  }

  const apiUrl = API_URL.PROD_ADMIN_JABJAI_API_URL;
  const endpoint = "/api/school/list";

  const response = await callWithLogging({ method: "GET", url: `${apiUrl}${endpoint}` });
  const rawList: any[] = response.data?.data ?? [];

  cachedSchools = rawList.map((item: any) => ({
    school_id: item.school_id ?? item.SchoolID ?? 0,
    school_name_th: item.SchoolName ?? item.company_name ?? "",
    school_name_en: item.SchoolNameEN ?? "",
  }));
  schoolCacheTime = now;

  return cachedSchools;
}

/**
 * ✨ ดึงข้อมูลกลุ่ม LINE ทั้งหมดจาก Jabjai Master DB พร้อมระบบแบ่งหน้าและ Mapping ข้อมูลโรงเรียน
 * @param params { limit: number; skip: number; school_id?: number }
 */
export async function getSchoolGroupService(params: {
  limit: number;
  skip: number;
  school_id?: number;
}) {
  const { limit, skip, school_id } = params;

  const where = {
    ...(school_id ? { SchoolId: school_id } : {}),
  };

  const [[rawItems, total], schoolList] = await Promise.all([
    Promise.all([
      PrismaJabjaiMaster.tLineGroup.findMany({
        where,
        take: limit,
        skip: skip,
        orderBy: { CreateDate: "desc" },
      }),
      PrismaJabjaiMaster.tLineGroup.count({ where }),
    ]),
    getSchoolListService().catch(() => [] as SchoolItem[]),
  ]);

  // สร้าง Map school_id → ข้อมูลโรงเรียน เพื่อ lookup O(1)
  const schoolMap = new Map<number, SchoolItem>(
    schoolList.map((s) => [s.school_id, s]),
  );

  const items = rawItems.map((row) => {
    const school = row.SchoolId ? schoolMap.get(row.SchoolId) : undefined;
    return {
      ...row,
      school_name_th: school?.school_name_th ?? null,
      school_name_en: school?.school_name_en ?? null,
    };
  });

  return { items, total };
}

/**
 * ✨ สร้างกลุ่ม LINE ใหม่
 * @param data ข้อมูลที่ต้องการบันทึก
 */
export async function createSchoolGroupService(data: {
  school_id: number;
  group_id: string;
  line_notification_access_token: string;
  group_type: string;
}) {
  return await PrismaJabjaiMaster.tLineGroup.create({
    data: {
      SchoolId: data.school_id,
      GroupId: data.group_id,
      LineNotificationAccessToken: data.line_notification_access_token,
      GroupType: data.group_type,
      CreateDate: new Date(),
    },
  });
}

/**
 * ✨ แก้ไขข้อมูลกลุ่ม LINE
 * @param data ข้อมูลที่ต้องการแก้ไข
 */
export async function updateSchoolGroupService(data: {
  line_group_id: number;
  school_id?: number;
  group_id?: string;
  line_notification_access_token?: string;
  group_type?: string;
}) {
  const { line_group_id, ...updateData } = data;
  
  return await PrismaJabjaiMaster.tLineGroup.update({
    where: { LineGroupId: line_group_id },
    data: {
      ...(updateData.school_id ? { SchoolId: updateData.school_id } : {}),
      ...(updateData.group_id ? { GroupId: updateData.group_id } : {}),
      ...(updateData.line_notification_access_token ? { LineNotificationAccessToken: updateData.line_notification_access_token } : {}),
      ...(updateData.group_type ? { GroupType: updateData.group_type } : {}),
    },
  });
}

/**
 * ✨ ลบกลุ่ม LINE
 * @param line_group_id ID ของกลุ่มที่ต้องการลบ
 */
export async function deleteSchoolGroupService(line_group_id: number) {
  return await PrismaJabjaiMaster.tLineGroup.delete({
    where: { LineGroupId: line_group_id },
  });
}
