import prisma from "@helpers/prisma";
import dayjs from "dayjs";
import ExcelJS from "exceljs";

/**
 * Service สำหรับจัดการการส่งออกข้อมูลสถานะอุปกรณ์เป็นไฟล์ Excel
 */
export class ExportDeviceStatusService {
  /**
   * ดึงข้อมูลสถานะอุปกรณ์ทั้งหมดและสร้างไฟล์ Excel
   */
  static async generateDeviceStatusExcel(): Promise<Buffer> {
    const now = new Date();
    const FIFTEEN_MIN_IN_MS = 15 * 60 * 1000;

    // 1. ดึงข้อมูลจากฐานข้อมูล
    const devices = await prisma.deviceDailyStatus.findMany({
      orderBy: [
        { SchoolID: "asc" },
        { AppName: "asc" },
        { AppVersion: "desc" },
      ],
    });

    // 2. สร้าง Workbook และ Worksheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Device Status Summary");

    // 3. ตกแต่งหัวตาราง (Summary Section)
    sheet.mergeCells("A1:G1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "รายงานสถานะอุปกรณ์ทั้งหมด (Device Status Summary)";
    titleCell.font = {
      name: "Kanit",
      size: 16,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" }, // Indigo 600
    };

    sheet.mergeCells("A2:G2");
    const subTitleCell = sheet.getCell("A2");
    subTitleCell.value = `ข้อมูล ณ วันที่ ${dayjs(now).format(
      "DD/MM/YYYY HH:mm:ss",
    )}`;
    subTitleCell.font = { name: "Kanit", size: 11, italic: true };
    subTitleCell.alignment = { vertical: "middle", horizontal: "center" };

    // 4. กำหนดโครงสร้างคอลัมน์
    sheet.getRow(4).values = [
      "ลำดับ",
      "โรงเรียน (School ID)",
      "แอปพลิเคชัน (App)",
      "เวอร์ชัน (Version)",
      "รหัสเครื่อง (Device ID)",
      "สถานะ (Status)",
      "ตรวจสอบล่าสุด (Last Online)",
    ];

    // ตกแต่ง Header Row
    const headerRow = sheet.getRow(4);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Kanit", bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E293B" }, // Slate 800
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // 5. ใส่ข้อมูลและจัดกลุ่ม
    let currentRow = 5;
    let sequence = 1;
    let lastSchoolId: number | null = null;
    let lastAppKey: string | null = null;

    for (const device of devices) {
      const onlineTime = device.OnlineTime ? new Date(device.OnlineTime) : null;
      const isOnline =
        device.Online === true ||
        (onlineTime
          ? now.getTime() - onlineTime.getTime() <= FIFTEEN_MIN_IN_MS
          : false);

      const appKey = `${device.AppName}-${device.AppVersion}`;

      // เพิ่มเว้นวรรคหรือหัวข้อถัดไปถ้าเปลี่ยนโรงเรียน
      if (lastSchoolId !== null && lastSchoolId !== device.SchoolID) {
        sheet.getRow(currentRow).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" }, // Slate 100
        };
        currentRow++;
      }

      const row = sheet.getRow(currentRow);
      row.values = [
        sequence++,
        device.SchoolID,
        device.AppName || "-",
        device.AppVersion || "-",
        device.DeviceID,
        isOnline ? "ONLINE" : "OFFLINE",
        onlineTime
          ? dayjs(onlineTime).format("DD/MM/YYYY HH:mm:ss")
          : "ไม่เคยออนไลน์",
      ];

      // จัด Styles ให้ข้อมูล
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Kanit", size: 10 };
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 5 ? "left" : "center",
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // ไฮไลต์สีตามสถานะ
        if (colNumber === 6) {
          if (isOnline) {
            cell.font = {
              name: "Kanit",
              size: 10,
              bold: true,
              color: { argb: "FF16A34A" },
            }; // Green 600
          } else {
            cell.font = {
              name: "Kanit",
              size: 10,
              bold: true,
              color: { argb: "FFDC2626" },
            }; // Red 600
          }
        }
      });

      lastSchoolId = device.SchoolID;
      lastAppKey = appKey;
      currentRow++;
    }

    // ปรับความกว้างคอลัมน์อัตโนมัติ (Manual set for beauty)
    sheet.getColumn(1).width = 8;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 25;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 30;
    sheet.getColumn(6).width = 15;
    sheet.getColumn(7).width = 25;

    // 6. ส่งคืน Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
