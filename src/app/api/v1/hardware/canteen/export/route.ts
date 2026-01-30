import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import axios from "axios";
import dayjs from "dayjs";
import { API_URL } from "@/services/api-url";

const EXCEL_STYLES = {
  TITLE_FONT: {
    name: "Calibri",
    size: 16,
    bold: true,
    color: { argb: "FFFFFFFF" },
  },
  HEADER_FONT: {
    name: "Calibri",
    size: 12,
    bold: true,
    color: { argb: "FFFFFFFF" },
  },
  NORMAL_FONT: {
    name: "Calibri",
    size: 11,
  },
  TITLE_FILL: {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF1F4E78" },
  },
  HEADER_FILL: {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF2E75B6" },
  },
  BORDER: {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    bottom: { style: "thin" as const },
    right: { style: "thin" as const },
  },
} as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get("appId");
  const appName = searchParams.get("appName") || "Unknown App";

  if (!appId) {
    return NextResponse.json(
      { message_th: "ไม่พบรหัสแอปพลิเคชัน" },
      { status: 400 },
    );
  }

  try {
    const apiUrl = API_URL.DEV_HARDWARE_API_URL;
    const response = await axios.get(
      `${apiUrl}/api/v2/applications/version/${appId}`,
    );

    // The structure returned by the API (based on user's example)
    // { data: { status: "success", data: [...] } }
    const versions = response.data?.data || [];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Version History");

    // 1. Add Title
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `ประวัติการปล่อยเวอร์ชัน: ${appName}`;
    titleCell.font = EXCEL_STYLES.TITLE_FONT;
    titleCell.fill = EXCEL_STYLES.TITLE_FILL;
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.mergeCells("A1:G1");
    worksheet.getRow(1).height = 40;

    // 2. Add Export Date
    const exportDateCell = worksheet.getCell("A2");
    exportDateCell.value = `วันที่ส่งออก: ${dayjs().format("DD/MM/YYYY HH:mm:ss")} (พ.ศ. ${dayjs().year() + 543})`;
    exportDateCell.font = { italic: true, size: 10 };
    worksheet.mergeCells("A2:G2");

    // 3. Set Columns
    worksheet.columns = [
      { header: "ลำดับ", key: "index", width: 8 },
      { header: "เวอร์ชัน", key: "version_name", width: 15 },
      { header: "สภาพแวดล้อม", key: "env", width: 15 },
      { header: "วันที่อัปเดต", key: "updated_at", width: 25 },
      { header: "เวอร์ชันล่าสุด", key: "is_lastest_version", width: 15 },
      { header: "โรงเรียนที่ใช้งาน", key: "school_id", width: 30 },
      { header: "URL ดาวน์โหลด", key: "url", width: 80 },
    ];

    // เขียนหัวข้อลงในแถวที่ 4
    const headerRow = worksheet.getRow(4);
    worksheet.columns.forEach((column, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = column.header;
      cell.font = EXCEL_STYLES.HEADER_FONT;
      cell.fill = EXCEL_STYLES.HEADER_FILL;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = EXCEL_STYLES.BORDER;
    });
    headerRow.height = 25;

    // 4. Add Data Rows starting from Row 5
    versions.forEach((v: any, idx: number) => {
      const row = worksheet.addRow({
        index: idx + 1,
        version_name: v.version_name,
        env: v.env,
        updated_at: dayjs(v.updated_at).format("DD/MM/YYYY HH:mm:ss"),
        is_lastest_version: v.is_lastest_version ? "ใช่ (Latest)" : "-",
        school_id: Array.isArray(v.school_id)
          ? v.school_id.join(", ")
          : v.school_id || "-",
        url: v.url,
      });

      row.eachCell((cell) => {
        cell.font = EXCEL_STYLES.NORMAL_FONT;
        cell.border = EXCEL_STYLES.BORDER;
        cell.alignment = { vertical: "middle", wrapText: true };
      });

      // Special styling for is_latest
      if (v.is_lastest_version) {
        row.getCell("is_lastest_version").font = {
          bold: true,
          color: { argb: "FF008000" },
        };
      }

      // Hyperlink for URL
      if (v.url) {
        row.getCell("url").value = {
          text: v.url,
          hyperlink: v.url,
        };
        row.getCell("url").font = {
          color: { argb: "FF0000FF" },
          underline: true,
        };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Version_History_${appName.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD")}.xlsx`;
    const encodedFileName = encodeURIComponent(fileName);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFileName}`,
      },
    });
  } catch (error: any) {
    console.error("Export Version History Error:", error);
    return NextResponse.json(
      { message_th: "เกิดข้อผิดพลาดในการส่งออกข้อมูล", error: error.message },
      { status: 500 },
    );
  }
}
