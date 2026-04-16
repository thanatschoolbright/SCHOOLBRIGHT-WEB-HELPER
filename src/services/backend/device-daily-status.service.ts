import { PrismaORM } from "@/helpers/prisma";
import {
  RequestDeviceDailyStatusTypes,
  FindAllDeviceStatusOptions
} from "@/types/device-daily-status.types";

// ตรวจสอบว่า model DeviceDailyStatus มีอยู่ใน Prisma client หรือไม่
// (อาจหายไปหลัง migrate DB จาก SQL Server → PostgreSQL)
const hasDeviceDailyStatus = typeof (PrismaORM as any).deviceDailyStatus !== "undefined";

export const DeviceDailyStatusService = {
  // ค้นหา device status ตาม SchoolID
  async findBySchoolId(
    schoolId: string,
    opts: {
      limit?: string;
    } = { limit: "10" }
  ) {
    if (!hasDeviceDailyStatus) return [];
    const take = opts.limit ?? "10";
    return await (PrismaORM as any).deviceDailyStatus.findMany({
      where: {
        SchoolID: Number(schoolId),
      },
      take: Number(take),
      orderBy: {
        Tstamp: "desc",
      },
    });
  },

  // ค้นหา device status ตาม DeviceID
  async findByDeviceId(
    deviceId: string,
    opts: {
      limit?: string;
    } = { limit: "10" }
  ) {
    if (!hasDeviceDailyStatus) return [];
    const take = opts.limit ?? "10";
    return await (PrismaORM as any).deviceDailyStatus.findMany({
      where: {
        DeviceID: deviceId,
      },
      take: Number(take),
      orderBy: {
        Tstamp: "desc",
      },
    });
  },

  // ค้นหา device status ตาม DeviceID หรือ SchoolID
  async findByDeviceIdOrSchoolId({
    deviceId,
    schoolId,
    limit = "25",
  }: RequestDeviceDailyStatusTypes) {
    if (!hasDeviceDailyStatus) return [];
    if (!deviceId && !schoolId) return [];
    const take = Number(limit);
    const where: any = {};
    if (deviceId) where.DeviceID = deviceId;
    if (schoolId) where.SchoolID = Number(schoolId);
    return await (PrismaORM as any).deviceDailyStatus.findMany({
      where,
      take,
      distinct: ["DeviceID"],
      orderBy: { Tstamp: "desc" },
    });
  },

  // ค้นหาทั้งหมดพร้อมตัวกรองและ pagination
  async findAll(options: FindAllDeviceStatusOptions) {
    const {
      page = 1,
      limit = 10,
      isOnline,
      isLogin,
      startDate,
      endDate,
      keyword,
    } = options;

    // กรณีที่ table ไม่มีใน DB ปัจจุบัน — คืนค่า empty result แทนการ crash
    if (!hasDeviceDailyStatus) {
      return {
        data: [],
        meta: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          totalPages: 0,
        },
      };
    }

    // คำนวณ pagination
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const take = Number(limit) > 0 ? Number(limit) : 10;
    const skip = (pageNum - 1) * take;

    // สร้าง where clause ตาม filter ที่ได้รับ
    const where: any = {};

    if (isOnline !== undefined && isOnline !== "") {
      where.Online = String(isOnline) === "true";
    }

    if (isLogin !== undefined && isLogin !== "") {
      where.Login = String(isLogin) === "true";
    }

    if (startDate || endDate) {
      where.BusinessDate = {};
      if (startDate) where.BusinessDate.gte = new Date(startDate);
      if (endDate) where.BusinessDate.lte = new Date(endDate);
    }

    if (keyword) {
      const isNumber = !isNaN(Number(keyword));
      where.OR = [{ DeviceID: { contains: keyword } }];
      if (isNumber) where.OR.push({ SchoolID: Number(keyword) });
    }

    // ดึงข้อมูลและนับจำนวนแบบ parallel
    const [total, data] = await Promise.all([
      (PrismaORM as any).deviceDailyStatus.count({ where }),
      (PrismaORM as any).deviceDailyStatus.findMany({
        where,
        take,
        skip,
        orderBy: { Tstamp: "desc" },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  },
};
