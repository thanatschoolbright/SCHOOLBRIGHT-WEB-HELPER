import { PrismaJabjaiMaster } from "@/helpers/prisma/prisma-jabjai-master-single-db";

/**
 * ✨ ดึงข้อมูลกลุ่ม LINE ทั้งหมดจาก Jabjai Master DB พร้อมระบบแบ่งหน้า
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

  const [items, total] = await Promise.all([
    PrismaJabjaiMaster.tLineGroup.findMany({
      where,
      take: limit,
      skip: skip,
      orderBy: {
        CreateDate: "desc",
      },
    }),
    PrismaJabjaiMaster.tLineGroup.count({ where }),
  ]);

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
