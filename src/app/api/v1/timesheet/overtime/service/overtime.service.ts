import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import ExcelJS from "exceljs";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";
import axios from "axios";
import { API_URL } from "@/services/api-url";

dayjs.extend(buddhistEra);
dayjs.locale("th");

/**
 * Interface สำหรับข้อมูลผู้ใช้งานที่ดึงจาก API
 */
interface TimesheetUser {
  admin_id: number | string;
  firstname?: string;
  lastname?: string;
}

/**
 * Service for handling Overtime related data and operations with enterprise-level styling.
 */
export const OvertimeService = {
  /**
   * สร้างชื่อไฟล์แบบ Enterprise
   */
  generateEnterpriseFileName(fromDate?: string) {
    const date = fromDate ? dayjs(fromDate) : dayjs();
    const month = date.locale("th").format("MMMM");
    const year = date.locale("th").format("BBBB");
    return `รายงานการทำงานล่วงเวลา ประจำเดือน ${month} ปี ${year}.xlsx`;
  },

  /**
   * ดึงข้อมูลผู้ใช้ทั้งหมดจาก API
   */
  async fetchUsers(): Promise<Map<string, string>> {
    try {
      const baseUrl =
        API_URL?.SB_HELPER_URL ?? process.env.NEXT_PUBLIC_SB_HELPER_URL;
      if (!baseUrl) return new Map();

      const response = await axios.get<{ data: { data: TimesheetUser[] } }>(
        `${baseUrl}/api/v1/admin/user/`,
      );
      const users = response?.data?.data?.data;

      const userMap = new Map<string, string>();
      if (Array.isArray(users)) {
        users.forEach((u) => {
          const fullName = [u.firstname, u.lastname]
            .filter(Boolean)
            .join(" ")
            .trim();
          userMap.set(String(u.admin_id), fullName || String(u.admin_id));
        });
      }
      return userMap;
    } catch (error) {
      console.error("Error fetching users for OT export:", error);
      return new Map();
    }
  },

  /**
   * สร้างไฟล์ Excel สำหรับส่งออกรายการ OT แบบ Enterprise
   * @param params - { from, to, status, requester_id }
   */
  async generateExportExcel(params: {
    from?: string;
    to?: string;
    status?: string;
    requester_id?: string;
  }) {
    const where: any = { isDeleted: false };

    if (params.requester_id) {
      where.requesterId = params.requester_id;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.from || params.to) {
      where.requestDate = {};
      if (params.from) where.requestDate.gte = new Date(params.from);
      if (params.to) where.requestDate.lte = new Date(params.to);
    }

    // ดึงข้อมูล OT และข้อมูลผู้ใช้งานพร้อมกัน
    const [items, userMap] = await Promise.all([
      (PrismaTimesheet as any).overtime.findMany({
        where,
        orderBy: { requestDate: "asc" },
        include: { descriptions: true },
      }),
      this.fetchUsers(),
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("รายการ OT");

    // --- ส่วนที่ 1: หัวข้อรายงาน (Enterprise Header) ---
    const reportMonth = params.from
      ? dayjs(params.from).locale("th").format("MMMM")
      : dayjs().locale("th").format("MMMM");
    const reportYear = params.from
      ? dayjs(params.from).locale("th").format("BBBB")
      : dayjs().locale("th").format("BBBB");

    worksheet.mergeCells("A1:I1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `รายการขอล่วงเวลาฝ่ายแผนก IT ประจำเดือน ${reportMonth} ปี ${reportYear}`;
    titleCell.font = {
      name: "Cordia New",
      size: 18,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFED7D31" }, // Orange High-end
    };
    worksheet.getRow(1).height = 35;

    // --- ส่วนที่ 2: กำหนดโครงสร้างตาราง ---
    worksheet.getRow(3).values = [
      "ลำดับ",
      "รหัสคำขอ",
      "ชื่อผู้ขอ",
      "วันที่ขอ",
      "สถานะ",
      "วันที่เริ่มทำงานล่วงเวลา",
      "ช่วงเวลา",
      "จำนวนชั่วโมง",
      "รายละเอียดงาน",
    ];

    worksheet.columns = [
      { key: "no", width: 8 },
      { key: "id", width: 15 },
      { key: "requester", width: 25 },
      { key: "request_date", width: 15 },
      { key: "status", width: 15 },
      { key: "ot_date", width: 20 },
      { key: "time_range", width: 20 },
      { key: "duration", width: 15 },
      { key: "description", width: 45 },
    ];

    // ตกแต่ง Header ของตาราง
    const tableHeaderRow = worksheet.getRow(3);
    tableHeaderRow.height = 25;
    tableHeaderRow.eachCell((cell) => {
      cell.font = { name: "Cordia New", size: 14, bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F2F2" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // ฟังก์ชันแปลสถานะ
    const translateStatus = (status: string) => {
      const statusMap: any = {
        pending: "รออนุมัติ",
        approved: "อนุมัติ",
        rejected: "ปฏิเสธ",
        cancelled: "ยกเลิก",
      };
      return statusMap[status.toLowerCase()] || status;
    };

    // --- ส่วนที่ 3: ใส่ข้อมูลลงใน Excel ---
    let rowCursor = 4;
    items.forEach((item: any, index: number) => {
      const requestId = `OT-${String(item.id).padStart(4, "0")}`;
      const statusTh = translateStatus(item.status);
      const requestDateTh = dayjs(item.requestDate).format("DD/MM/BBBB");

      // ดึงชื่อเต็มจาก Map
      const fullName =
        userMap.get(String(item.requesterId)) || item.requesterId;

      if (item.descriptions && item.descriptions.length > 0) {
        item.descriptions.forEach((desc: any) => {
          const row = worksheet.addRow({
            no: index + 1,
            id: requestId,
            requester: fullName,
            request_date: requestDateTh,
            status: statusTh,
            ot_date: dayjs(desc.date).format("DD/MM/BBBB"),
            time_range: `${dayjs(desc.startDate).format("HH:mm")} - ${dayjs(desc.endDate).format("HH:mm")}`,
            duration: Math.round(Number(desc.duration)), // ปรับเป็น Integer
            description: desc.description,
          });
          formatDataRow(row);
          rowCursor++;
        });
      } else {
        const row = worksheet.addRow({
          no: index + 1,
          id: requestId,
          requester: fullName,
          request_date: requestDateTh,
          status: statusTh,
          ot_date: "-",
          time_range: "-",
          duration: 0,
          description: "-",
        });
        formatDataRow(row);
        rowCursor++;
      }
    });

    // จัดระเบียบการจัดวางข้อความ
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 3) {
        row.getCell("no").alignment = { horizontal: "center" };
        row.getCell("id").alignment = { horizontal: "center" };
        row.getCell("request_date").alignment = { horizontal: "center" };
        row.getCell("status").alignment = { horizontal: "center" };
        row.getCell("ot_date").alignment = { horizontal: "center" };
        row.getCell("time_range").alignment = { horizontal: "center" };
        row.getCell("duration").alignment = { horizontal: "center" };
      }
    });

    // คืนค่าเป็น Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },
};

/**
 * Helper ฟังก์ชันสำหรับตกแต่ง Row ข้อมูล
 */
function formatDataRow(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { name: "Cordia New", size: 13 };
    cell.border = {
      top: { style: "thin", color: { argb: "FFAAAAAA" } },
      left: { style: "thin", color: { argb: "FFAAAAAA" } },
      bottom: { style: "thin", color: { argb: "FFAAAAAA" } },
      right: { style: "thin", color: { argb: "FFAAAAAA" } },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });

  // ใส่สีพื้นหลังสลับแถว
  const rowNumber = Number(row.number);
  if (rowNumber % 2 === 0) {
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF9F9F9" },
      };
    });
  }

  // ตกแต่งสีตามสถานะ
  const statusCell = row.getCell("status");
  const statusVal = statusCell.value;
  if (statusVal === "อนุมัติ") {
    statusCell.font = { bold: true, color: { argb: "FF28A745" } };
  } else if (statusVal === "รออนุมัติ") {
    statusCell.font = { bold: true, color: { argb: "FFFFC107" } };
  } else if (statusVal === "ปฏิเสธ") {
    statusCell.font = { bold: true, color: { argb: "FFDC3545" } };
  }
}
