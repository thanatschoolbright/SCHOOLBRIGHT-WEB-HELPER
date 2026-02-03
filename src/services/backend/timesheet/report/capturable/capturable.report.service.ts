import ExcelJS from "exceljs";
import { ProjectStatResult } from "./capturable.service";

const formatDateToThaiStyle = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB");
};

export const ExcelService = {
  async generateCapturableReport(
    data: ProjectStatResult[],
    startDate: string,
    endDate: string,
  ) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Capturable Report", {
      views: [{ showGridLines: false }],
    });

    worksheet.columns = [
      { key: "project_code", width: 20 },
      { key: "project_name", width: 50 },
      { key: "capturable_hours", width: 18 },
      { key: "capturable_percent", width: 15 },
      { key: "uncapturable_hours", width: 18 },
      { key: "uncapturable_percent", width: 15 },
      { key: "hours", width: 15 },
      { key: "hours_percent", width: 15 },
    ];

    worksheet.mergeCells("A1:H1");
    const titleRow = worksheet.getCell("A1");
    titleRow.value = "รายงานการทำงานของพนักงาน รูปแบบบันทึกทรัพย์สิน";
    titleRow.font = { name: "Angsana New", size: 20, bold: true };
    titleRow.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A2:H2");
    const subTitle1 = worksheet.getCell("A2");
    subTitle1.value = `ตั้งแต่วันที่ ${formatDateToThaiStyle(startDate)}`;
    subTitle1.font = { name: "Angsana New", size: 16 };
    subTitle1.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A3:H3");
    const subTitle2 = worksheet.getCell("A3");
    subTitle2.value = `จนถึงวันที่ ${formatDateToThaiStyle(endDate)}`;
    subTitle2.font = { name: "Angsana New", size: 16 };
    subTitle2.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.addRow([]);

    const headerRowIndex = 5;
    const headerValues = [
      "Project Code",
      "Project Name",
      "Capturable (Hrs)",
      "Capturable (%)",
      "Uncapturable (Hrs)",
      "Uncapturable (%)",
      "Total Hours",
      "Impact (%)",
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
        fgColor: { argb: "1F4E78" },
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

    data.forEach((item) => {
      const row = worksheet.addRow({
        project_code: item.project_code,
        project_name: item.project_name,
        capturable_hours: item.capturable_hours,
        capturable_percent: item.capturable_percent / 100,
        uncapturable_hours: item.uncapturable_hours,
        uncapturable_percent: item.uncapturable_percent / 100,
        hours: item.hours,
        hours_percent: item.hours_percent / 100,
      });

      row.height = 25;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Angsana New", size: 14 };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle" };

        switch (colNumber) {
          case 1:
            cell.alignment = { vertical: "middle", horizontal: "center" };
            break;
          case 2:
            cell.alignment = {
              vertical: "middle",
              horizontal: "left",
              indent: 1,
            };
            break;
          case 4:
          case 6:
          case 8:
            cell.numFmt = "0.00%";
            cell.alignment = { vertical: "middle", horizontal: "center" };
            break;
          case 3:
          case 5:
          case 7:
            cell.numFmt = "#,##0.00";
            cell.alignment = { vertical: "middle", horizontal: "right" };
            break;
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },
};
