import { logger } from "@/helpers/logger";
import { PrismaTimesheet as prisma } from "@/helpers/prisma-timesheet";
import { formatFullProjectCode } from "@/helpers/project/convert-code.helper";
import dayjs from "dayjs";
import ExcelJS from "exceljs";

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
  TOTAL_FILL: {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FFE6F0FA" },
  },
  BORDER: {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    bottom: { style: "thin" as const },
    right: { style: "thin" as const },
  },
  ROW_HEIGHT: 24, // Fixed height for data rows
} as const;

interface FeatureData {
  projectId: number;
  projectName: string;
  featureId: number;
  featureName: string;
  assetCaptureType: string;
  hours: number;
  entries: any[];
}

const getAssetTypeLabel = (assetType: string): string => {
  return assetType === "CAPTUREABLE"
    ? "สามารถแคปทรัพย์สินได้"
    : "ไม่สามารถแคปทรัพย์สินได้";
};

const calculatePercentage = (hours: number, totalHours: number): string => {
  return totalHours > 0
    ? ((hours / totalHours) * 100).toFixed(2) + "%"
    : "0.00%";
};

const sanitizeSheetName = (name: string): string => {
  return name.replace(/[:\/?*\[\]\\]/g, "_");
};

const formatDateRange = (startDate: string, endDate: string): string => {
  return `${dayjs(startDate).format("DD/MM/YYYY")} ถึง ${dayjs(endDate).format(
    "DD/MM/YYYY",
  )}`;
};

const getUserName = (
  userId: number | null,
  usersMap: Map<number, any>,
): string => {
  if (userId === null) return "ไม่ระบุ";
  const user = usersMap.get(userId);
  return user
    ? `${user.firstname_th} ${user.lastname_th}`.trim() || `User ID: ${userId}`
    : `User ID: ${userId}`;
};

const applyCellStyle = (
  cell: ExcelJS.Cell,
  alignment: Partial<ExcelJS.Alignment>,
  numFmt?: string,
) => {
  cell.font = EXCEL_STYLES.NORMAL_FONT;
  cell.alignment = { vertical: "middle", ...alignment };
  cell.border = EXCEL_STYLES.BORDER;
  if (numFmt) cell.numFmt = numFmt;
};

const fetchTimesheetEntries = async (startDate: string, endDate: string) => {
  // ⚡️ Align with Capturable Reporting logic (T00:00:00)
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59.999`);

  return await prisma.timesheetEntry.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
      is_deleted: false,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          is_deleted: true,
        },
      },
      feature: {
        select: {
          id: true,
          name: true,
          assetCaptureType: true,
          is_deleted: true,
        },
      },
    },
    orderBy: [{ date: "asc" }],
  });
};

const groupEntriesByFeature = (entries: any[]): Map<number, FeatureData> => {
  const featureMap = new Map<number, FeatureData>();

  entries.forEach((entry) => {
    const featureId = entry.featureId;

    if (!featureMap.has(featureId)) {
      const projectName = entry.project?.name || "ไม่ระบุ";
      const projectIsDeleted = entry.project?.is_deleted || false;
      const featureName = entry.feature?.name || "ไม่ระบุ";
      const featureIsDeleted = entry.feature?.is_deleted || false;

      featureMap.set(featureId, {
        projectId: entry.projectId,
        projectName: projectIsDeleted
          ? `${projectName} (DELETED)`
          : projectName,
        featureId,
        featureName: featureIsDeleted
          ? `${featureName} (DELETED)`
          : featureName,
        assetCaptureType: entry.feature?.assetCaptureType || "UNCAPTUREABLE",
        hours: 0,
        entries: [],
      });
    }

    const featureData = featureMap.get(featureId)!;
    featureData.hours += Number(entry.hours || 0);
    featureData.entries.push(entry);
  });

  return featureMap;
};

const fetchUsers = async (entries: any[]): Promise<Map<number, any>> => {
  const adminIds = Array.from(
    new Set(
      entries.map((e) => e.createdBy).filter((id): id is number => id !== null),
    ),
  );

  if (adminIds.length === 0) return new Map();

  const users = await prisma.user.findMany({
    where: {
      admin_id: { in: adminIds },
    },
    select: {
      admin_id: true,
      employee_code: true,
      firstname_th: true,
      lastname_th: true,
      nickname: true,
    },
  });

  const usersMap = new Map<number, any>();
  users.forEach((user) => {
    if (user.admin_id) {
      usersMap.set(user.admin_id, user);
    }
  });

  return usersMap;
};

const createOverviewSheet = (
  workbook: ExcelJS.Workbook,
  features: FeatureData[],
  totalHours: number,
  dateRange: string,
) => {
  const sheet = workbook.addWorksheet("ภาพรวม");
  sheet.properties.defaultRowHeight = EXCEL_STYLES.ROW_HEIGHT;

  sheet.columns = [
    { header: "รหัสโครงการ / รหัสโครงการย่อย", key: "code", width: 35 },
    { header: "ชื่อโครงการ (รหัสโครงการ)", key: "projectName", width: 40 },
    {
      header: "ชื่อโครงการย่อย (รหัสโครงการย่อย)",
      key: "featureName",
      width: 40,
    },
    { header: "ประเภทของสินทรัพย์", key: "assetType", width: 25 },
    { header: "ผลรวมชั่วโมง", key: "totalHours", width: 18 },
    { header: "เปอร์เซ็นต์", key: "percentage", width: 15 },
  ];

  sheet.mergeCells("A1:F1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `ข้อมูลนี้อ้างอิงจาก ช่วงวันที่ ${dateRange} - ภาพรวม`;
  titleCell.font = EXCEL_STYLES.TITLE_FONT;
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  titleCell.fill = EXCEL_STYLES.TITLE_FILL;
  sheet.getRow(1).height = 28;

  const headerRow = sheet.addRow([
    "รหัสโครงการ / รหัสโครงการย่อย",
    "ชื่อโครงการ (รหัสโครงการ)",
    "ชื่อโครงการย่อย (รหัสโครงการย่อย)",
    "ประเภทของสินทรัพย์",
    "ผลรวมชั่วโมง",
    "เปอร์เซ็นต์",
  ]);

  headerRow.eachCell((cell) => {
    cell.font = EXCEL_STYLES.HEADER_FONT;
    cell.fill = EXCEL_STYLES.HEADER_FILL;
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = EXCEL_STYLES.BORDER;
  });
  sheet.getRow(2).height = 24;

  features.forEach((feature) => {
    const rawCode = formatFullProjectCode(feature.projectId, feature.featureId);
    const sanitizedCode = sanitizeSheetName(rawCode);
    const projectNameWithId = `${feature.projectName} (${formatFullProjectCode(
      feature.projectId,
    )})`;
    const featureNameWithId = `${feature.featureName} (${rawCode})`;
    const assetTypeLabel = getAssetTypeLabel(feature.assetCaptureType);
    const percentage = calculatePercentage(feature.hours, totalHours);

    const row = sheet.addRow([
      rawCode,
      projectNameWithId,
      featureNameWithId,
      assetTypeLabel,
      Number(feature.hours.toFixed(2)),
      percentage,
    ]);
    row.height = EXCEL_STYLES.ROW_HEIGHT;

    row.eachCell((cell, colNumber) => {
      if (colNumber === 1) {
        // Add Hyperlink to its specific sheet for better UX
        cell.value = {
          text: rawCode,
          hyperlink: `'${sanitizedCode}'!A1`,
          tooltip: `คลิกเพื่อดูรายละเอียด ${rawCode}`,
        };
        cell.font = {
          ...EXCEL_STYLES.NORMAL_FONT,
          color: { argb: "FF0563C1" },
          underline: true,
        };
        applyCellStyle(cell, { horizontal: "center" });
      } else if (colNumber === 5) {
        applyCellStyle(cell, { horizontal: "right" }, "#,##0.00");
      } else if (colNumber === 6) {
        applyCellStyle(cell, { horizontal: "center" });
      } else {
        applyCellStyle(cell, { horizontal: "left" });
      }
    });
  });

  sheet.addRow([]);
  const totalRow = sheet.addRow([
    "รวมทั้งหมด",
    "",
    "",
    "",
    Number(totalHours.toFixed(2)),
    "100.00%",
  ]);

  totalRow.eachCell((cell, colNumber) => {
    cell.font = { ...EXCEL_STYLES.NORMAL_FONT, size: 12, bold: true };
    cell.fill = EXCEL_STYLES.TOTAL_FILL;
    cell.border = EXCEL_STYLES.BORDER;

    if (colNumber === 5) {
      cell.numFmt = "#,##0.00";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 6) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "left", vertical: "middle" };
    }
  });

  sheet.views = [{ state: "frozen", ySplit: 2 }];
};

const createEvidenceSheet = (
  workbook: ExcelJS.Workbook,
  feature: FeatureData,
  usersMap: Map<number, any>,
  dateRange: string,
) => {
  const formattedCode = formatFullProjectCode(
    feature.projectId,
    feature.featureId,
  );

  // Sheet name is just the project/sub-project code for brevity as requested
  // Note: Excel worksheet names cannot contain characters like "/"
  const sheetName = sanitizeSheetName(formattedCode);
  const sheet = workbook.addWorksheet(sheetName);
  sheet.properties.defaultRowHeight = EXCEL_STYLES.ROW_HEIGHT;

  sheet.columns = [
    { key: "date", width: 18 },
    { key: "employeeId", width: 18 },
    { key: "creator", width: 30 },
    { key: "description", width: 55 },
    { key: "hours", width: 18 },
  ];

  // Title Section Row 1: Project Name
  sheet.getRow(1).height = 24;
  sheet.getCell("A1").value = "ชื่อโครงการ";
  sheet.getCell("B1").value = feature.projectName;
  sheet.mergeCells("B1:E1");
  sheet.getCell("A1").font = { ...EXCEL_STYLES.NORMAL_FONT, bold: true };
  sheet.getCell("B1").font = EXCEL_STYLES.NORMAL_FONT;
  sheet.getCell("A1").fill = EXCEL_STYLES.TOTAL_FILL;
  sheet.getCell("A1").border = EXCEL_STYLES.BORDER;
  sheet.getCell("B1").border = EXCEL_STYLES.BORDER;

  // Title Section Row 2: Sub-project Name
  sheet.getRow(2).height = 24;
  sheet.getCell("A2").value = "ชื่อโครงการย่อย";
  sheet.getCell("B2").value = feature.featureName;
  sheet.mergeCells("B2:E2");
  sheet.getCell("A2").font = { ...EXCEL_STYLES.NORMAL_FONT, bold: true };
  sheet.getCell("B2").font = EXCEL_STYLES.NORMAL_FONT;
  sheet.getCell("A2").fill = EXCEL_STYLES.TOTAL_FILL;
  sheet.getCell("A2").border = EXCEL_STYLES.BORDER;
  sheet.getCell("B2").border = EXCEL_STYLES.BORDER;

  // Title Section Row 3: Date Range
  sheet.getRow(3).height = 24;
  sheet.getCell("A3").value = "ช่วงวันที่";
  sheet.getCell("B3").value = dateRange;
  sheet.mergeCells("B3:E3");
  sheet.getCell("A3").font = { ...EXCEL_STYLES.NORMAL_FONT, bold: true };
  sheet.getCell("B3").font = EXCEL_STYLES.NORMAL_FONT;
  sheet.getCell("A3").fill = EXCEL_STYLES.TOTAL_FILL;
  sheet.getCell("A3").border = EXCEL_STYLES.BORDER;
  sheet.getCell("B3").border = EXCEL_STYLES.BORDER;

  // Additional Info Row 4
  const assetTypeLabel = getAssetTypeLabel(feature.assetCaptureType);
  sheet.getRow(4).height = 22;
  sheet.mergeCells("A4:E4");
  const subtitleCell = sheet.getCell("A4");
  subtitleCell.value = `รหัส: ${formattedCode} | ประเภทสินทรัพย์: ${assetTypeLabel} | รวม: ${feature.hours.toFixed(2)} ชั่วโมง`;
  subtitleCell.font = { ...EXCEL_STYLES.NORMAL_FONT, italic: true };
  subtitleCell.alignment = { vertical: "middle", horizontal: "left" };

  const headerRow = sheet.addRow([
    "วันที่ลงเวลา",
    "รหัสพนักงาน",
    "ชื่อผู้จัดทำ",
    "คำอธิบาย",
    "จำนวนชั่วโมง",
  ]);

  headerRow.eachCell((cell) => {
    cell.font = EXCEL_STYLES.HEADER_FONT;
    cell.fill = EXCEL_STYLES.HEADER_FILL;
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = EXCEL_STYLES.BORDER;
  });
  sheet.getRow(5).height = 26;

  const sortedEntries = feature.entries.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  sortedEntries.forEach((entry) => {
    const user = entry.createdBy ? usersMap.get(entry.createdBy) : null;
    const creatorName = getUserName(entry.createdBy, usersMap);
    const employeeId =
      user?.employee_code || (entry.createdBy ? String(entry.createdBy) : "-");

    const row = sheet.addRow([
      dayjs(entry.date).format("DD/MM/YYYY"),
      employeeId,
      creatorName,
      entry.description || "-",
      Number(entry.hours || 0),
    ]);
    row.height = EXCEL_STYLES.ROW_HEIGHT;

    row.eachCell((cell, colNumber) => {
      if (colNumber === 5) {
        applyCellStyle(cell, { horizontal: "right" }, "#,##0.00");
      } else if (colNumber === 4) {
        applyCellStyle(cell, { horizontal: "left", wrapText: true });
      } else {
        applyCellStyle(cell, { horizontal: "left" });
      }
    });
  });

  sheet.addRow([]);
  const totalRow = sheet.addRow([
    "",
    "",
    "",
    "รวมจำนวนชั่วโมงทั้งหมด",
    Number(feature.hours.toFixed(2)),
  ]);
  totalRow.height = EXCEL_STYLES.ROW_HEIGHT;

  totalRow.eachCell((cell, colNumber) => {
    if (colNumber < 4) return;

    cell.font = { ...EXCEL_STYLES.NORMAL_FONT, size: 12, bold: true };
    cell.fill = EXCEL_STYLES.TOTAL_FILL;
    cell.border = EXCEL_STYLES.BORDER;

    if (colNumber === 5) {
      cell.numFmt = "#,##0.00";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  sheet.views = [{ state: "frozen", ySplit: 5 }];
};

export const TimesheetAuditReportService = {
  generateAuditReport: async (params: {
    start_date: string;
    end_date: string;
  }) => {
    const { start_date, end_date } = params;

    try {
      const entries = await fetchTimesheetEntries(start_date, end_date);
      const totalHours = entries.reduce(
        (sum, entry) => sum + Number(entry.hours || 0),
        0,
      );

      const featureMap = groupEntriesByFeature(entries);
      const sortedFeatures = Array.from(featureMap.values()).sort(
        (a, b) => b.hours - a.hours,
      );

      const usersMap = await fetchUsers(entries);
      const dateRange = formatDateRange(start_date, end_date);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SB Web Helper - Audit Report";
      workbook.created = new Date();

      createOverviewSheet(workbook, sortedFeatures, totalHours, dateRange);

      sortedFeatures.forEach((feature) => {
        createEvidenceSheet(workbook, feature, usersMap, dateRange);
      });

      if (workbook.worksheets.length === 0) {
        const emptySheet = workbook.addWorksheet("ไม่มีข้อมูล");
        emptySheet.addRow(["ไม่มีข้อมูลในช่วงวันที่ที่เลือก"]);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error: any) {
      logger.error("Error generating audit report:", error);
      throw new Error(`ไม่สามารถสร้างรายงานได้: ${error.message}`);
    }
  },
};
