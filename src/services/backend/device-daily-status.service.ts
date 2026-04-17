import { PrismaORM } from "@/helpers/prisma";
import {
  FindAllDeviceStatusOptions,
  RequestDeviceDailyStatusTypes,
} from "@/types/device-daily-status.types";

export const DeviceDailyStatusService = {
  // ค้นหา device status ตาม SchoolID
  async findBySchoolId(
    schoolId: string,
    opts: {
      limit?: string;
    } = { limit: "10" },
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

  // ค้นหา device status ตาม DeviceID
  async findByDeviceId(
    deviceId: string,
    opts: {
      limit?: string;
    } = { limit: "10" },
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

  // ค้นหา device status ตาม DeviceID หรือ SchoolID
  async findByDeviceIdOrSchoolId({
    deviceId,
    schoolId,
    limit = "25",
  }: RequestDeviceDailyStatusTypes) {
    if (!deviceId && !schoolId) return [];
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

    // คำนวณ pagination
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const take = Number(limit) > 0 ? Number(limit) : 10;
    const skip = (pageNum - 1) * take;

    // สร้าง where clause ตาม filter ที่ได้รับ
    const where: any = {};

    // หมายเหตุ: การกรอง Online จะทำที่ Memory หลังจากดึงข้อมูลมาแล้ว 
    // เพราะต้องคำนวณสถานะ Dynamic (Heartbeat 15 นาที) ซึ่ง Prisma กรองด้วย Logic นี้ตรงๆ ไม่ได้เหมาะสมที่สุด
    
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

    // ดึงข้อมูลทั้งหมดที่เข้าข่าย (ยกเว้น Online Filter) เพื่อมาคำนวณ Online แบบ Dynamic
    // หากมีการกรอง Online เราจะดึงข้อมูลมาทั้งหมดก่อน (หรือก้อนใหญ่ขึ้น) แล้วค่อย Filter + Paginate
    
    // ถ้าไม่มีการกรอง Online ให้ทำงานแบบปกติ (Paginate ที่ DB)
    if (isOnline === undefined || isOnline === "") {
      const [total, rawData] = await Promise.all([
        PrismaORM.deviceDailyStatus.count({ where }),
        PrismaORM.deviceDailyStatus.findMany({
          where,
          take,
          skip,
          orderBy: { Tstamp: "desc" },
        }),
      ]);

      const now = new Date();
      const FIFTEEN_MIN_IN_MS = 15 * 60 * 1000;

      const data = rawData.map((device) => {
        const onlineTime = device.OnlineTime ? new Date(device.OnlineTime) : null;
        const isOnlineDynamic =
          device.Online === true ||
          (onlineTime
            ? now.getTime() - onlineTime.getTime() <= FIFTEEN_MIN_IN_MS
            : false);

        return {
          ...device,
          Online: isOnlineDynamic,
        };
      });

      return {
        data,
        meta: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      };
    }

    // กรณีมีการกรอง Online (isOnline = true/false)
    // จำเป็นต้องดึงข้อมูลเพื่อมาคำนวณก่อน เพราะสถานะ Online ขึ้นอยู่กับเวลาปัจจุบัน (Heartbeat 15 min)
    const allMatchingDevices = await PrismaORM.deviceDailyStatus.findMany({
      where,
      orderBy: { Tstamp: "desc" },
    });

    const now = new Date();
    const FIFTEEN_MIN_IN_MS = 15 * 60 * 1000;
    const filterIsOnline = String(isOnline) === "true";

    const filteredData = allMatchingDevices
      .map((device) => {
        const onlineTime = device.OnlineTime ? new Date(device.OnlineTime) : null;
        const isOnlineDynamic =
          device.Online === true ||
          (onlineTime
            ? now.getTime() - onlineTime.getTime() <= FIFTEEN_MIN_IN_MS
            : false);

        return {
          ...device,
          Online: isOnlineDynamic,
        };
      })
      .filter((device) => device.Online === filterIsOnline);

    const totalCount = filteredData.length;
    const paginatedData = filteredData.slice(skip, skip + take);

    return {
      data: paginatedData,
      meta: {
        total: totalCount,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(totalCount / take),
      },
    };
  },
};
