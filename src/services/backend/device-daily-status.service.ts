import { PrismaORM } from "@/helpers/prisma";
import { Prisma } from "@prisma/client"; // Import Prisma types สำหรับ WhereInput
import { 
  RequestDeviceDailyStatusTypes, 
  FindAllDeviceStatusOptions 
} from "@/types/device-daily-status.types";

export const DeviceDailyStatusService = {
  // ... (Code เดิมของคุณ: findBySchoolId, findByDeviceId, findByDeviceIdOrSchoolId) ...

  async findBySchoolId(
    schoolId: string,
    opts: {
      limit?: string;
    } = { limit: "10" }
  ) {
    const take = opts.limit ?? "10";
    return await PrismaORM.deviceDailyStatus.findMany({
      where: {
        SchoolID: Number(schoolId),
      },
      take: Number(take),
      orderBy: {
        Tstamp: "desc",
      },
    });
  },

  async findByDeviceId(
    deviceId: string,
    opts: {
      limit?: string;
    } = { limit: "10" }
  ) {
    const take = opts.limit ?? "10";
    return await PrismaORM.deviceDailyStatus.findMany({
      where: {
        DeviceID: deviceId,
      },
      take: Number(take),
      orderBy: {
        Tstamp: "desc",
      },
    });
  },

  async findByDeviceIdOrSchoolId({
    deviceId,
    schoolId,
    limit = "25",
  }: RequestDeviceDailyStatusTypes) {
    if (!deviceId && !schoolId) {
      return [];
    }
    const take = Number(limit);
    const where: any = {};
    if (deviceId) where.DeviceID = deviceId;
    if (schoolId) where.SchoolID = Number(schoolId);
    return await PrismaORM.deviceDailyStatus.findMany({
      where,
      take,
      distinct: ["DeviceID"],
      orderBy: { Tstamp: "desc" },
    });
  },

  // * ------------------------------------------------------------------
  // * Service ใหม่: ค้นหาทั้งหมดพร้อมตัวกรอง (Filter All)
  // * ------------------------------------------------------------------
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

    // 1. Pagination Logic
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const take = Number(limit) > 0 ? Number(limit) : 10;
    const skip = (pageNum - 1) * take;

    // 2. Build Where Clause
    const where:any = {};

    // กรอง Online / Offline
    if (isOnline !== undefined && isOnline !== "") {
      where.Online = String(isOnline) === "true";
    }

    // กรอง Login / Logout
    if (isLogin !== undefined && isLogin !== "") {
      where.Login = String(isLogin) === "true";
    }

    // กรองช่วงวันที่ (เน้นกรองจาก BusinessDate เพื่อดูยอดรายวัน หรือ Tstamp แล้วแต่ Business logic)
    // ในที่นี้ใช้ BusinessDate ตามบริบท "ค้าขายล่าสุด"
    if (startDate || endDate) {
      where.BusinessDate = {};
      if (startDate) {
        where.BusinessDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.BusinessDate.lte = new Date(endDate);
      }
    }

    // กรองด้วย Keyword (Search) -> ค้นหาใน DeviceID หรือ SchoolID
    if (keyword) {
      const isNumber = !isNaN(Number(keyword));
      where.OR = [
        { DeviceID: { contains: keyword } }, // ค้นหาบางส่วนของ DeviceID (ระวังเรื่อง Case sensitive ของ DB)
      ];

      // ถ้า keyword เป็นตัวเลข ให้ค้นหา SchoolID ด้วย
      if (isNumber) {
        where.OR.push({ SchoolID: Number(keyword) });
      }
    }

    // 3. Execute Query (Run Parallel for Performance)
    const [total, data] = await Promise.all([
      PrismaORM.deviceDailyStatus.count({ where }), // นับจำนวนทั้งหมดตาม filter
      PrismaORM.deviceDailyStatus.findMany({
        where,
        take,
        skip,
        orderBy: {
          Tstamp: "desc", // เรียงตามเวลาล่าสุดเสมอ
        },
      }),
    ]);

    // 4. Return Result with Pagination Meta
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