import ExcelJS from "exceljs";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";

dayjs.extend(buddhistEra);
dayjs.locale("th");

interface RequestConfig {
  url: string;
  method: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
}

export interface ServerStatusData {
  module: string;
  group: string;
  name_th: string;
  name_en: string;
  status: string;
  service: string;
  curl: string;
  request: RequestConfig;
  response: any;
}

/**
 * Service for exporting Server Monitoring Status to Excel with Enterprise styling.
 */
export const ServerStatusExportService = {
  /**
   * สร้างชื่อไฟล์แบบ Enterprise
   */
  generateFileName() {
    const now = dayjs();
    return `รายงานสถานะเซิร์ฟเวอร์_${now.format("DD_MM_BBBB_HHmm")}.xlsx`;
  },

  /**
   * สร้างชื่อรายงานสำหรับหัวข้อในไฟล์
   */
  getReportHeaderTitle() {
    const now = dayjs();
    return `รายงานสรุปสถานะความพร้อมใช้งานของระบบ (SchoolBright Mobile API)`;
  },

  /**
   * สร้างไฟล์ Excel
   */
  async generateExcel(data: ServerStatusData[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("System Health Report", {
      views: [{ showGridLines: false, state: "frozen", xSplit: 0, ySplit: 7 }],
    });

    const total = data.length;
    const online = data.filter((item) =>
      ["200", "404"].includes(item.status),
    ).length;
    const offline = total - online;

    // 1. Column Definitions
    worksheet.columns = [
      { key: "seq", width: 8 },
      { key: "group", width: 15 },
      { key: "name_th", width: 35 },
      { key: "service", width: 30 },
      { key: "status_text", width: 25 },
      { key: "last_check", width: 20 },
      { key: "endpoint", width: 60 },
    ];

    // 2. Title Section
    worksheet.mergeCells("A1:G1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = this.getReportHeaderTitle();
    titleCell.font = {
      name: "Cordia New",
      size: 22,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" }, // Blue High-end
    };
    worksheet.getRow(1).height = 40;

    worksheet.mergeCells("A2:G2");
    const subTitle = worksheet.getCell("A2");
    subTitle.value = `ออกรายงานเมื่อ: ${dayjs().format("DD/MM/BBBB HH:mm")} | ผู้ตรวจสอบ: ระบบ Monitoring อัตโนมัติ`;
    subTitle.font = { name: "Cordia New", size: 14, italic: true };
    subTitle.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(2).height = 25;

    // 3. Dashboard Summary
    worksheet.getCell("B4").value = "รายการทั้งหมด (Total)";
    worksheet.getCell("C4").value = total;
    worksheet.getCell("B5").value = "ปกติ (Online)";
    worksheet.getCell("C5").value = online;
    worksheet.getCell("B6").value = "ขัดข้อง (Critical)";
    worksheet.getCell("C6").value = offline;

    ["B4", "B5", "B6"].forEach((key) => {
      const cell = worksheet.getCell(key);
      cell.font = { name: "Cordia New", size: 14, bold: true };
      cell.alignment = { horizontal: "right" };
    });

    worksheet.getCell("C4").font = { name: "Cordia New", size: 14, bold: true };
    worksheet.getCell("C5").font = {
      name: "Cordia New",
      size: 14,
      bold: true,
      color: { argb: "FF28A745" },
    };
    worksheet.getCell("C6").font = {
      name: "Cordia New",
      size: 14,
      bold: true,
      color: { argb: "FFDC3545" },
    };

    // 4. Table Header
    const headerRow = worksheet.getRow(8);
    headerRow.values = [
      "ลำดับ",
      "กลุ่มระบบ",
      "ชื่อโมดูล (Module)",
      "โดเมน (Domain)",
      "สถานะการทำงาน",
      "เวลาตรวจสอบ",
      "รายละเอียด Endpoint",
    ];

    headerRow.eachCell((cell) => {
      cell.font = {
        name: "Cordia New",
        size: 14,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2F5597" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    headerRow.height = 30;

    // 5. Data Rows
    data.forEach((item, index) => {
      const isOnline = ["200", "404"].includes(item.status);
      const statusText = isOnline ? "ONLINE" : `ERROR (${item.status})`;
      const endpoint = `[${item.request.method}] ${item.request.url}`;

      const row = worksheet.addRow({
        seq: index + 1,
        group: item.group?.toUpperCase() || "OTHER",
        name_th: item.name_th,
        service: item.service,
        status_text: statusText,
        last_check: dayjs().format("HH:mm:ss"),
        endpoint: endpoint,
      });

      row.height = 25;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Cordia New", size: 13 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0E0E0" } },
          left: { style: "thin", color: { argb: "FFE0E0E0" } },
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          right: { style: "thin", color: { argb: "FFE0E0E0" } },
        };
        cell.alignment = { vertical: "middle" };

        if (
          colNumber === 1 ||
          colNumber === 2 ||
          colNumber === 5 ||
          colNumber === 6
        ) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }

        // Status Column Styling
        if (colNumber === 5) {
          cell.font = {
            name: "Cordia New",
            size: 13,
            bold: true,
            color: { argb: isOnline ? "FF28A745" : "FFDC3545" },
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isOnline ? "FFE8F5E9" : "FFFFEBEE" },
          };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },
};
