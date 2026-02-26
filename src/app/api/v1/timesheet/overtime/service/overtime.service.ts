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

    // ตั้งค่าเริ่มต้นความสูงของแถวให้ดูโปร่งและสวยงาม
    worksheet.properties.defaultRowHeight = 25;

    // --- ส่วนที่ 1: หัวข้อรายงานรูปแบบใหม่ (Header Section) ---
    // ปรับแต่ง Header ให้ดูเป็นเอกสารทางการมากขึ้น (A1:B3)
    const headerCells = ["A1", "B1", "A2", "B2", "A3", "B3"];
    headerCells.forEach((ref) => {
      const cell = worksheet.getCell(ref);
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    });

    worksheet.getCell("A1").value = "ชื่อเอกสาร";
    worksheet.getCell("B1").value =
      "เอกสารการทำงานล่วงเวลา (OT) - แผนก IT Application";
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F2F2" },
    };

    const fromDateDisplay = params.from
      ? dayjs(params.from).format("DD/MM/BBBB")
      : "-";
    const toDateDisplay = params.to
      ? dayjs(params.to).format("DD/MM/BBBB")
      : "-";

    worksheet.getCell("A2").value = "เริ่มต้นงวดวันที่";
    worksheet.getCell("B2").value = fromDateDisplay;
    worksheet.getCell("A3").value = "สิ้นสุดงวดวันที่";
    worksheet.getCell("B3").value = toDateDisplay;

    // ตกแต่ง Font ส่วนหัว
    ["A1", "A2", "A3"].forEach((ref) => {
      const cell = worksheet.getCell(ref);
      cell.font = { bold: true, name: "Cordia New", size: 14 };
    });

    ["B1", "B2", "B3"].forEach((ref) => {
      const cell = worksheet.getCell(ref);
      cell.font = { name: "Cordia New", size: 14, color: { argb: "FF333333" } };
    });
    worksheet.getCell("B1").font = {
      bold: true,
      name: "Cordia New",
      size: 15,
      color: { argb: "FFC0504D" },
    };

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
      "จำนวนชั่วโมงที่ทำงานจริง",
      "รายละเอียดงาน",
      "หลักฐานเข้าทำงาน",
      "หลักฐานออกทำงาน",
      "หลักฐานงานจริง #1",
      "หลักฐานงานจริง #2",
      "ลายเซ็น",
    ];

    worksheet.columns = [
      { key: "no", width: 6 },
      { key: "id", width: 14 },
      { key: "employee_code", width: 14 },
      { key: "requester", width: 25 },
      { key: "request_date", width: 14 },
      { key: "status", width: 12 },
      { key: "ot_date", width: 14 },
      { key: "time_range", width: 18 },
      { key: "duration", width: 12 },
      { key: "description", width: 45 },
      { key: "proof_in", width: 18 },
      { key: "proof_out", width: 18 },
      { key: "proof_job_1", width: 18 },
      { key: "proof_job_2", width: 18 },
      { key: "proof_sig", width: 18 },
    ];

    // ตกแต่ง Header ของตาราง
    const tableHeaderRow = worksheet.getRow(tableHeaderRowIndex);
    tableHeaderRow.height = 32; // สูงขึ้นเพื่อความสวยงาม
    tableHeaderRow.eachCell((cell) => {
      cell.font = {
        name: "Cordia New",
        size: 14,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F81BD" }, // เปลี่ยนเป็นสีน้ำเงินเข้ม สุภาพกว่า
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "medium", color: { argb: "FF366092" } },
        left: { style: "thin", color: { argb: "FF366092" } },
        bottom: { style: "medium", color: { argb: "FF366092" } },
        right: { style: "thin", color: { argb: "FF366092" } },
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
    let displayItemIndex = 1; // ตัวนับลำดับที่แสดงใน Excel
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

          const proof = desc.proof || {};
          const row = worksheet.addRow({
            no: displayItemIndex++,
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
            proof_in: proof.image_1
              ? {
                  text: "คลิกเพื่อดูรูปภาพ",
                  hyperlink: proof.image_1,
                  tooltip: "หลักฐานเข้าทำงาน",
                }
              : "-",
            proof_out: proof.image_2
              ? {
                  text: "คลิกเพื่อดูรูปภาพ",
                  hyperlink: proof.image_2,
                  tooltip: "หลักฐานออกทำงาน",
                }
              : "-",
            proof_job_1: proof.image_3
              ? {
                  text: "คลิกเพื่อดูรูปภาพ",
                  hyperlink: proof.image_3,
                  tooltip: "หลักฐานงานจริง #1",
                }
              : "-",
            proof_job_2: proof.image_4
              ? {
                  text: "คลิกเพื่อดูรูปภาพ",
                  hyperlink: proof.image_4,
                  tooltip: "หลักฐานงานจริง #2",
                }
              : "-",
            proof_sig: proof.signature_1
              ? {
                  text: "คลิกเพื่อดูรูปภาพ",
                  hyperlink: proof.signature_1,
                  tooltip: "ลายเซ็น",
                }
              : "-",
          });
          formatDataRow(row);
          rowCursor++;
        });
      }
    });

    // --- ส่วนที่ 4: ตารางสรุปผลลัพธ์รวมรายบุคคล (Summary Table สำหรับ HR) ---
    // ชิดขอบและเว้นระยะเพื่อให้ดูแยกส่วนชัดเจน
    rowCursor += 3;
    worksheet.mergeCells(`A${rowCursor}:E${rowCursor}`);
    const summaryTitleCell = worksheet.getCell(`A${rowCursor}`);
    summaryTitleCell.value =
      "ข้อมูลสรุปสำหรับฝ่ายบุคคล (HR Payroll Summary Table)";
    summaryTitleCell.font = {
      bold: true,
      size: 16,
      name: "Cordia New",
      color: { argb: "FF366092" },
    };
    summaryTitleCell.alignment = { horizontal: "left", vertical: "middle" };
    worksheet.getRow(rowCursor).height = 35;
    rowCursor++;

    const summaryHeaderRow = worksheet.getRow(rowCursor);
    summaryHeaderRow.height = 30;
    summaryHeaderRow.values = [
      "ลำดับ",
      "รหัสพนักงาน",
      "ชื่อ-นามสกุล",
      "จำนวนครั้งที่เบิก",
      "รวมชั่วโมง OT ทั้งสิ้น",
    ];

    summaryHeaderRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        size: 13,
        name: "Cordia New",
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F4E78" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "medium" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" },
      };
    });
    rowCursor++;

    let summaryNo = 1;
    let grandTotalHours = 0;
    let grandTotalTasks = 0;

    summaryMap.forEach((summary) => {
      grandTotalHours += summary.totalDuration;
      grandTotalTasks += summary.taskCount;

      const row = worksheet.addRow([
        summaryNo++,
        summary.employeeCode,
        summary.fullName,
        summary.taskCount,
        summary.totalDuration,
      ]);

      row.height = 28;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Cordia New", size: 13 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFCCCCCC" } },
          left: { style: "thin", color: { argb: "FFCCCCCC" } },
          bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
          right: { style: "thin", color: { argb: "FFCCCCCC" } },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber <= 2 || colNumber === 4 ? "center" : "left",
        };

        // ใส่สีพื้นหลังเล็กน้อยให้กับตัวเลขสรุป
        if (colNumber === 5) {
          cell.font = {
            bold: true,
            color: { argb: "FFC0504D" },
            name: "Cordia New",
            size: 14,
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFDF2E9" },
          };
        }
      });
      rowCursor++;
    });

    // --- ส่วนที่ 5: แถวสรุปยอดรวมสุทธิ (Grand Total Row) ---
    const grandTotalRow = worksheet.addRow([
      "ยอดรวมสุทธิ (Grand Total)",
      "",
      "",
      grandTotalTasks,
      grandTotalHours,
    ]);
    grandTotalRow.height = 35;

    // Merge Cells สำหรับ Label "ยอดรวมสุทธิ" (A-C)
    worksheet.mergeCells(`A${rowCursor}:C${rowCursor}`);

    grandTotalRow.eachCell((cell, colNumber) => {
      cell.font = {
        bold: true,
        name: "Cordia New",
        size: 14,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC0504D" }, // สีแดงเข้มแสดงถึงยอดรวมเพื่อให้ HR เห็นชัดเจน
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber === 1 ? "right" : "center",
      };
      cell.border = {
        top: { style: "medium", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "double", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
    rowCursor++;

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
  row.height = 28; // ปรับความสูงให้สมดุลและอ่านง่าย (Balanced Height)
  row.eachCell((cell) => {
    cell.font = { name: "Cordia New", size: 13, color: { argb: "FF333333" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });

  // ใส่สีพื้นหลังสลับแถว (Zebra Effect)
  const rowNumber = Number(row.number);
  if (rowNumber % 2 === 0) {
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF7F9FC" }, // สีฟ้าอ่อนจางๆ สบายตา
      };
    });
  }

  // ตกแต่ง Link รูปภาพให้เป็นสีน้ำเงินและขีดเส้นใต้
  const proofCols = [
    "proof_in",
    "proof_out",
    "proof_job_1",
    "proof_job_2",
    "proof_sig",
  ];
  proofCols.forEach((colKey) => {
    const cell = row.getCell(colKey);
    if (
      cell.value &&
      typeof cell.value === "object" &&
      (cell.value as any).hyperlink
    ) {
      cell.font = {
        name: "Cordia New",
        size: 13,
        color: { argb: "FF0563C1" },
        underline: true,
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    } else {
      cell.alignment = { vertical: "middle", horizontal: "center" };
    }
  });

  // ตกแต่งสีสถานะตามความเหมาะสมทางอารมณ์และสายตา
  const statusCell = row.getCell("status");
  const statusVal = statusCell.value;
  if (statusVal === "อนุมัติ" || statusVal === "จ่ายสำเร็จ") {
    statusCell.font = {
      bold: true,
      color: { argb: "FF2E7D32" },
      name: "Cordia New",
      size: 13,
    };
    statusCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8F5E9" },
    };
  } else if (statusVal === "รออนุมัติ") {
    statusCell.font = {
      bold: true,
      color: { argb: "FFF9A825" },
      name: "Cordia New",
      size: 13,
    };
    statusCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF9C4" },
    };
  } else if (statusVal === "ปฏิเสธ" || statusVal === "ยกเลิก") {
    statusCell.font = {
      bold: true,
      color: { argb: "FFC62828" },
      name: "Cordia New",
      size: 13,
    };
    statusCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFEBEE" },
    };
  }
}
