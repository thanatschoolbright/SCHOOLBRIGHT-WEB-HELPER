import ExcelJS from "exceljs";

interface RequestConfig {
  url: string;
  method: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
}

export interface ServerStatusData {
  module: string;
  name_th: string;
  name_en: string;
  status: string;
  service: string;
  curl: string;
  request: RequestConfig;
  response: any;
}

const formatDateToThaiStyle = (date: Date): string => {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ExportServerStatusService = {
  async generateReport(data: ServerStatusData[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("System Health Report", {
      views: [
        { showGridLines: false, state: "frozen", xSplit: 0, ySplit: 7 }, // Lock Header Row
      ],
    });

    // 1. คำนวณสถิติเบื้องต้น (Summary Stats)
    const total = data.length;
    const online = data.filter((item) => item.status === "200").length;
    const offline = total - online;
    const healthPercent = total === 0 ? 0 : (online / total) * 100;

    // 2. กำหนดคอลัมน์ (Columns Definition)
    worksheet.columns = [
      { key: "seq", width: 8 },
      { key: "name_th", width: 35 },
      { key: "service", width: 30 },
      { key: "status_text", width: 25 }, // แสดงผลแบบข้อความ
      { key: "last_check", width: 20 },
      { key: "endpoint", width: 50 },
      { key: "technical_log", width: 60 }, // ย้ายข้อมูลเทคนิคไปท้ายสุด
    ];

    // --- SECTION: TITLE ---
    worksheet.mergeCells("A1:G1");
    const titleRow = worksheet.getCell("A1");
    titleRow.value =
      "รายงานสรุปสถานะความพร้อมใช้งานของระบบ (System Health Check Report)";
    titleRow.font = {
      name: "Angsana New",
      size: 22,
      bold: true,
      color: { argb: "1F4E78" },
    };
    titleRow.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A2:G2");
    const subTitle = worksheet.getCell("A2");
    subTitle.value = `ออกรายงานเมื่อ: ${formatDateToThaiStyle(
      new Date()
    )} | ผู้จัดทำ: SchoolBright System Monitor`;
    subTitle.font = { name: "Angsana New", size: 16, italic: true };
    subTitle.alignment = { vertical: "middle", horizontal: "center" };

    // --- SECTION: DASHBOARD SUMMARY (Enterprise Look) ---
    // สร้างตารางสรุปเล็กๆ ด้านบน
    worksheet.mergeCells("B4:C4");
    worksheet.getCell("B4").value = "รายการตรวจสอบทั้งหมด (Total)";
    worksheet.getCell("D4").value = total;

    worksheet.mergeCells("B5:C5");
    worksheet.getCell("B5").value = "ระบบทำงานปกติ (Normal)";
    worksheet.getCell("D5").value = online;

    worksheet.mergeCells("B6:C6");
    worksheet.getCell("B6").value = "ระบบขัดข้อง (Critical)";
    worksheet.getCell("D6").value = offline;

    // จัด Style ให้ Dashboard
    ["B4", "B5", "B6"].forEach((cellKey) => {
      const cell = worksheet.getCell(cellKey);
      cell.font = { name: "Angsana New", size: 16, bold: true };
      cell.alignment = { horizontal: "right" };
    });

    // Style ตัวเลข
    const totalCell = worksheet.getCell("D4");
    totalCell.font = { name: "Angsana New", size: 16, bold: true };

    const onlineCell = worksheet.getCell("D5");
    onlineCell.font = {
      name: "Angsana New",
      size: 16,
      bold: true,
      color: { argb: "009900" },
    }; // Green

    const offlineCell = worksheet.getCell("D6");
    offlineCell.font = {
      name: "Angsana New",
      size: 16,
      bold: true,
      color: { argb: "FF0000" },
    }; // Red

    // --- SECTION: TABLE HEADER ---
    const headerRowIndex = 8;
    const headerValues = [
      "ลำดับ",
      "ชื่อระบบ / โมดูล (System Name)",
      "โดเมนที่ให้บริการ (Domain)",
      "สถานะการทำงาน (Status)",
      "เวลาตรวจสอบ",
      "จุดเชื่อมต่อ (Endpoint)",
      "ข้อมูลทางเทคนิค (For IT Support)",
    ];

    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.values = headerValues;

    headerRow.eachCell((cell) => {
      cell.font = {
        name: "Angsana New",
        size: 16,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "2F5597" }, // สีน้ำเงินเข้ม Professional
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    headerRow.height = 32;

    // เปิด Auto Filter ให้ User ใช้งานง่าย
    worksheet.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex, column: 7 },
    };

    // --- SECTION: DATA ROWS ---
    data.forEach((item, index) => {
      const isOnline = item.status === "200";

      // แปลงข้อมูลเป็นภาษาคน
      const statusText = isOnline
        ? "ใช้งานได้ปกติ (Normal)"
        : `พบปัญหา (Error: ${item.status})`;
      const methodUrl = `[${item.request.method}] ${item.request.url}`;

      const row = worksheet.addRow({
        seq: index + 1,
        name_th: item.name_th, // ใช้ชื่อไทยเป็นหลัก
        service: item.service,
        status_text: statusText,
        last_check: formatDateToThaiStyle(new Date()), // สมมติว่าเป็นเวลาปัจจุบัน
        endpoint: methodUrl,
        technical_log: item.curl, // ซ่อน cURL ไว้ท้ายสุด
      });

      row.height = 28;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Angsana New", size: 14 };
        cell.border = {
          top: { style: "thin", color: { argb: "D9D9D9" } }, // เส้นบางสีเทา
          left: { style: "thin", color: { argb: "D9D9D9" } },
          bottom: { style: "thin", color: { argb: "D9D9D9" } },
          right: { style: "thin", color: { argb: "D9D9D9" } },
        };
        cell.alignment = { vertical: "middle", wrapText: false };

        // จัด Alignment
        if (colNumber === 1 || colNumber === 5) {
          // Seq, Time
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else {
          cell.alignment = {
            vertical: "middle",
            horizontal: "left",
            indent: 1,
          };
        }

        // Highlight Status Column (Enterprise Traffic Light)
        if (colNumber === 4) {
          // Column Status
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.font = {
            name: "Angsana New",
            size: 14,
            bold: true,
            color: { argb: isOnline ? "006100" : "9C0006" },
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isOnline ? "C6EFCE" : "FFC7CE" }, // เขียวอ่อน / แดงอ่อน
          };
        }

        // Technical Log (Column 7) - ทำตัวอักษรเล็กและสีจางลง
        if (colNumber === 7) {
          cell.font = { name: "Consolas", size: 10, color: { argb: "808080" } };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },
};
