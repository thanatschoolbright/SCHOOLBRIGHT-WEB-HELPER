import { PrismaTimesheet } from "@/helpers/prisma-timesheet";
import { API_URL } from "@/services/api-url";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import ExcelJS from "exceljs";

dayjs.extend(buddhistEra);
dayjs.locale("th");

/**
 * Interface สำหรับข้อมูลผู้ใช้งานที่ดึงจาก API
 */
interface TimesheetUser {
  admin_id: number | string;
  firstname_th?: string;
  lastname_th?: string;
  firstname_en?: string;
  lastname_en?: string;
  employee_code?: string;
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
  async fetchUsers(): Promise<
    Map<string, { fullName: string; employeeCode: string }>
  > {
    try {
      const baseUrl =
        API_URL?.SB_HELPER_URL ?? process.env.NEXT_PUBLIC_SB_HELPER_URL;
      if (!baseUrl) return new Map();

      // การเรียกข้อมูล User จาก API ภายในระบบ
      const response = await axios.get<any>(`${baseUrl}/api/v1/admin/user/`);
      const users = response?.data?.data?.items;

      const userMap = new Map<
        string,
        { fullName: string; employeeCode: string }
      >();
      if (Array.isArray(users)) {
        users.forEach((u: TimesheetUser) => {
          // ใช้ชื่อ-นามสกุลไทยเป็นหลัก ถ้าไม่มีให้ใช้อังกฤษ
          const thName = [u.firstname_th, u.lastname_th]
            .filter(Boolean)
            .join(" ")
            .trim();
          const enName = [u.firstname_en, u.lastname_en]
            .filter(Boolean)
            .join(" ")
            .trim();

          const fullName = thName || enName;

          userMap.set(String(u.admin_id), {
            fullName: fullName || String(u.admin_id),
            employeeCode: u.employee_code || "-",
          });
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

    // --- ส่วนที่ 1: หัวข้อรายงานรูปแบบใหม่ (Header Section) ---
    // ปรับเปลี่ยนหัวข้อตามคำสั่ง: A1-B3
    worksheet.getCell("A1").value = "ชื่อเอกสาร";
    worksheet.getCell("B1").value =
      "เอกสารการขอการทำงานล่วงเวลา แผนก IT Application";
    worksheet.getCell("A1").font = { bold: true, name: "Cordia New", size: 14 };
    worksheet.getCell("B1").font = {
      bold: true,
      name: "Cordia New",
      size: 16,
      color: { argb: "FFED7D31" },
    };

    const fromDateDisplay = params.from
      ? dayjs(params.from).format("DD/MM/BBBB")
      : "-";
    const toDateDisplay = params.to
      ? dayjs(params.to).format("DD/MM/BBBB")
      : "-";

    worksheet.getCell("A2").value = "เริ่มต้นวันที่";
    worksheet.getCell("B2").value = fromDateDisplay;
    worksheet.getCell("A3").value = "สิ้นสุดวันที่";
    worksheet.getCell("B3").value = toDateDisplay;

    [worksheet.getCell("A2"), worksheet.getCell("A3")].forEach((cell) => {
      cell.font = { bold: true, name: "Cordia New", size: 14 };
    });

    // --- ส่วนที่ 2: กำหนดโครงสร้างตารางข้อมูลดิบ (Raw Data Table) ---
    // เริ่มต้นที่ Row 5 เพื่อให้เว้นระยะจาก Header
    const tableHeaderRowIndex = 5;
    worksheet.getRow(tableHeaderRowIndex).values = [
      "ลำดับ",
      "รหัสคำขอ",
      "รหัสพนักงาน",
      "ชื่อผู้ขอ",
      "วันที่ขอ",
      "สถานะ",
      "วันที่ทำงาน",
      "ช่วงเวลา",
      "จำนวนชั่วโมง",
      "รายละเอียดงาน",
    ];

    worksheet.columns = [
      { key: "no", width: 8 },
      { key: "id", width: 15 },
      { key: "employee_code", width: 15 },
      { key: "requester", width: 30 },
      { key: "request_date", width: 15 },
      { key: "status", width: 15 },
      { key: "ot_date", width: 20 },
      { key: "time_range", width: 20 },
      { key: "duration", width: 15 },
      { key: "description", width: 50 },
    ];

    // ตกแต่ง Header ของตาราง
    const tableHeaderRow = worksheet.getRow(tableHeaderRowIndex);
    tableHeaderRow.height = 25;
    tableHeaderRow.eachCell((cell) => {
      cell.font = { name: "Cordia New", size: 14, bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFED7D31" },
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 14 };
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
        paid: "จ่ายสำเร็จ",
      };
      return statusMap[status.toLowerCase()] || status;
    };

    // --- ส่วนที่ 3: ใส่ข้อมูลลงใน Excel และคำนวณสรุปผล ---
    let rowCursor = tableHeaderRowIndex + 1;
    const summaryMap = new Map<
      string,
      {
        fullName: string;
        employeeCode: string;
        totalDuration: number;
        taskCount: number;
      }
    >();

    items.forEach((item: any, index: number) => {
      const requestId = `OT-${String(item.id).padStart(4, "0")}`;
      const statusTh = translateStatus(item.status);
      const requestDateTh = dayjs(item.requestDate).format("DD/MM/BBBB");

      const userData = userMap.get(String(item.requesterId));
      const fullName = userData?.fullName || item.requesterId;
      const employeeCode = userData?.employeeCode || "-";

      // เตรียมข้อมูลสำหรับการสรุปยอดรายบุคคล
      if (!summaryMap.has(String(item.requesterId))) {
        summaryMap.set(String(item.requesterId), {
          fullName,
          employeeCode,
          totalDuration: 0,
          taskCount: 0,
        });
      }

      if (item.descriptions && item.descriptions.length > 0) {
        item.descriptions.forEach((desc: any) => {
          const duration = Number(desc.duration || 0);

          // อัปเดตยอดสรุป
          const summary = summaryMap.get(String(item.requesterId))!;
          summary.totalDuration += duration;
          summary.taskCount += 1;

          const row = worksheet.addRow({
            no: index + 1,
            id: requestId,
            employee_code: employeeCode,
            requester: fullName,
            request_date: requestDateTh,
            status: statusTh,
            ot_date: dayjs(desc.date || item.requestDate).format("DD/MM/BBBB"),
            time_range:
              desc.startDate && desc.endDate
                ? `${dayjs(desc.startDate).format("HH:mm")} - ${dayjs(desc.endDate).format("HH:mm")}`
                : "-",
            duration: duration,
            description: desc.description,
          });
          formatDataRow(row);
          rowCursor++;
        });
      }
    });

    // --- ส่วนที่ 4: ตารางสรุปผลลัพธ์รวมรายบุคคล (Summary Table) ---
    // เว้นระยะจากตารางหลัก
    rowCursor += 2;
    worksheet.mergeCells(`A${rowCursor}:D${rowCursor}`);
    const summaryTitleCell = worksheet.getCell(`A${rowCursor}`);
    summaryTitleCell.value =
      "ตารางสรุปผลรวมค่าล่วงเวลารายบุคคล (Payroll Summary)";
    summaryTitleCell.font = { bold: true, size: 14, name: "Cordia New" };
    summaryTitleCell.alignment = { horizontal: "left" };
    rowCursor++;

    const summaryHeaderRow = worksheet.getRow(rowCursor);
    summaryHeaderRow.values = [
      "ลำดับ",
      "รหัสพนักงาน",
      "ชื่อ-นามสกุล",
      "จำนวนงานที่ขอ",
      "รวมชั่วโมงทั้งหมด",
    ];
    summaryHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    rowCursor++;

    let summaryNo = 1;
    summaryMap.forEach((summary) => {
      const row = worksheet.addRow([
        summaryNo++,
        summary.employeeCode,
        summary.fullName,
        summary.taskCount,
        summary.totalDuration,
      ]);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle" };
      });
      row.getCell(5).font = { bold: true, color: { argb: "FFC55A11" } };
      row.getCell(5).alignment = { horizontal: "center" };
      rowCursor++;
    });

    // จัดระเบียบการจัดวางข้อความ
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 3) {
        row.getCell("no").alignment = { horizontal: "center" };
        row.getCell("id").alignment = { horizontal: "center" };
        row.getCell("employee_code").alignment = { horizontal: "center" };
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
