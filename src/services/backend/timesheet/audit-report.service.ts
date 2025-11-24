import { PrismaClient as TimesheetPrismaClient } from "@/../generated/prisma-timesheet";
import ExcelJS from "exceljs";
import dayjs from "dayjs";
import { logger } from "@/helpers/logger";

const prisma = new TimesheetPrismaClient();

export const TimesheetAuditReportService = {
  generateAuditReport: async (params: {
    start_date: string;
    end_date: string;
  }) => {
    const { start_date, end_date } = params;

    try {
      const start = dayjs(start_date).startOf("day");
      const end = dayjs(end_date).endOf("day");

      // Fetch all timesheet entries with related project and feature data
      const entries = await prisma.timesheetEntry.findMany({
        where: {
          date: {
            gte: new Date(start.toISOString()),
            lte: new Date(end.toISOString()),
          },
          is_deleted: false,
        },
        include: {
          project: true,
          feature: true,
        },
        orderBy: [{ date: "asc" }],
      });

      // Calculate total hours for percentage calculation
      const totalHours = entries.reduce(
        (sum, entry) => sum + Number(entry.hours || 0),
        0
      );

      // Group by feature (sub-project)
      const featureMap = new Map<
        number,
        {
          projectId: number;
          projectName: string;
          featureId: number;
          featureName: string;
          assetCaptureType: string;
          hours: number;
          entries: typeof entries;
        }
      >();

      entries.forEach((entry: any) => {
        const featureId = entry.featureId;
        const projectId = entry.projectId;
        const projectName = entry.project?.name || "ไม่ระบุ";
        const featureName = entry.feature?.name || "ไม่ระบุ";
        const assetCaptureType =
          entry.feature?.assetCaptureType || "CAPTUREABLE";
        const hours = Number(entry.hours || 0);

        if (!featureMap.has(featureId)) {
          featureMap.set(featureId, {
            projectId,
            projectName,
            featureId,
            featureName,
            assetCaptureType,
            hours: 0,
            entries: [],
          });
        }

        const featureData = featureMap.get(featureId)!;
        featureData.hours += hours;
        featureData.entries.push(entry);
      });

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SB Web Helper - Audit Report";
      workbook.created = new Date();

      // ===== Sheet 1: ภาพรวม (Overview) =====
      const overviewSheet = workbook.addWorksheet("ภาพรวม");

      // Set column widths
      overviewSheet.columns = [
        { header: "รหัสโครงการ / รหัสโครงการย่อย", key: "code", width: 35 },
        { header: "ประเภทของสินทรัพย์", key: "assetType", width: 25 },
        { header: "ผลรวมชั่วโมง", key: "totalHours", width: 18 },
        { header: "เปอร์เซ็นต์", key: "percentage", width: 15 },
      ];

      // Title row
      overviewSheet.mergeCells("A1:D1");
      const titleCell = overviewSheet.getCell("A1");
      titleCell.value = `ข้อมูลนี้อ้างอิงจาก ช่วงวันที่ ${dayjs(
        start_date
      ).format("DD/MM/YYYY")} ถึง ${dayjs(end_date).format(
        "DD/MM/YYYY"
      )} - ภาพรวม`;
      titleCell.font = {
        name: "Calibri",
        size: 16,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F4E78" },
      } as any;
      overviewSheet.getRow(1).height = 28;

      // Header row
      const headerRow = overviewSheet.addRow([
        "รหัสโครงการ / รหัสโครงการย่อย",
        "ประเภทของสินทรัพย์",
        "ผลรวมชั่วโมง",
        "เปอร์เซ็นต์",
      ]);
      headerRow.eachCell((cell) => {
        cell.font = {
          name: "Calibri",
          size: 12,
          bold: true,
          color: { argb: "FFFFFFFF" },
        } as any;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2E75B6" },
        } as any;
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      overviewSheet.getRow(2).height = 24;

      // Data rows
      const sortedFeatures = Array.from(featureMap.values()).sort(
        (a, b) => b.hours - a.hours
      );

      sortedFeatures.forEach((feature) => {
        const code = `${feature.projectId}-${feature.featureId}`;
        const assetTypeLabel =
          feature.assetCaptureType === "CAPTUREABLE"
            ? "CAPTUREABLE"
            : "UN_CAPTUREABLE";
        const percentage =
          totalHours > 0
            ? ((feature.hours / totalHours) * 100).toFixed(2) + "%"
            : "0.00%";

        const row = overviewSheet.addRow([
          code,
          assetTypeLabel,
          Number(feature.hours.toFixed(2)),
          percentage,
        ]);

        row.eachCell((cell, colNumber) => {
          cell.font = { name: "Calibri", size: 11 };
          if (colNumber === 3) {
            cell.numFmt = "#,##0.00";
            cell.alignment = { horizontal: "right", vertical: "middle" };
          } else if (colNumber === 4) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          }
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Total row
      overviewSheet.addRow([]);
      const totalRow = overviewSheet.addRow([
        "รวมทั้งหมด",
        "",
        Number(totalHours.toFixed(2)),
        "100.00%",
      ]);
      totalRow.eachCell((cell, colNumber) => {
        cell.font = { name: "Calibri", size: 12, bold: true } as any;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6F0FA" },
        } as any;
        if (colNumber === 3) {
          cell.numFmt = "#,##0.00";
          cell.alignment = { horizontal: "right", vertical: "middle" };
        } else if (colNumber === 4) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Freeze panes
      overviewSheet.views = [{ state: "frozen", ySplit: 2 }];

      // ===== Evidence Sheets: One per Feature =====
      sortedFeatures.forEach((feature) => {
        const sheetName = `${feature.projectId}-${feature.featureId}`.slice(
          0,
          31
        );
        const evidenceSheet = workbook.addWorksheet(sheetName);

        // Set column widths
        evidenceSheet.columns = [
          { header: "วันที่", key: "date", width: 15 },
          { header: "โครงการ", key: "project", width: 30 },
          { header: "โครงการย่อย (Feature)", key: "feature", width: 30 },
          { header: "ชั่วโมง", key: "hours", width: 12 },
          { header: "คำอธิบาย", key: "description", width: 50 },
          { header: "สถานะ", key: "status", width: 15 },
        ];

        // Title row with project/feature info
        evidenceSheet.mergeCells("A1:F1");
        const evidenceTitleCell = evidenceSheet.getCell("A1");
        evidenceTitleCell.value = `ข้อมูลนี้อ้างอิงจาก ช่วงวันที่ ${dayjs(
          start_date
        ).format("DD/MM/YYYY")} ถึง ${dayjs(end_date).format("DD/MM/YYYY")} - ${
          feature.projectName
        } / ${feature.featureName}`;
        evidenceTitleCell.font = {
          name: "Calibri",
          size: 14,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        evidenceTitleCell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        evidenceTitleCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F4E78" },
        } as any;
        evidenceSheet.getRow(1).height = 26;

        // Subtitle with code and asset type
        evidenceSheet.mergeCells("A2:F2");
        const subtitleCell = evidenceSheet.getCell("A2");
        const assetTypeLabel =
          feature.assetCaptureType === "CAPTUREABLE"
            ? "CAPTUREABLE"
            : "UN_CAPTUREABLE";
        subtitleCell.value = `รหัส: ${feature.projectId}-${
          feature.featureId
        } | ประเภทสินทรัพย์: ${assetTypeLabel} | รวม: ${feature.hours.toFixed(
          2
        )} ชั่วโมง`;
        subtitleCell.font = {
          name: "Calibri",
          size: 11,
          color: { argb: "FF333333" },
        };
        subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
        evidenceSheet.getRow(2).height = 20;

        // Header row
        const evidenceHeaderRow = evidenceSheet.addRow([
          "วันที่",
          "โครงการ",
          "โครงการย่อย (Feature)",
          "ชั่วโมง",
          "คำอธิบาย",
          "สถานะ",
        ]);
        evidenceHeaderRow.eachCell((cell) => {
          cell.font = {
            name: "Calibri",
            size: 12,
            bold: true,
            color: { argb: "FFFFFFFF" },
          } as any;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF2E75B6" },
          } as any;
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        evidenceSheet.getRow(3).height = 24;

        // Data rows - sorted by date
        const sortedEntries = feature.entries.sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        sortedEntries.forEach((entry: any) => {
          const row = evidenceSheet.addRow([
            dayjs(entry.date).format("DD/MM/YYYY"),
            entry.project?.name || "ไม่ระบุ",
            entry.feature?.name || "ไม่ระบุ",
            Number(entry.hours || 0),
            entry.description || "-",
            entry.status || "DRAFT",
          ]);

          row.eachCell((cell, colNumber) => {
            cell.font = { name: "Calibri", size: 11 };
            if (colNumber === 4) {
              cell.numFmt = "#,##0.00";
              cell.alignment = { horizontal: "right", vertical: "middle" };
            } else if (colNumber === 5) {
              cell.alignment = {
                horizontal: "left",
                vertical: "middle",
                wrapText: true,
              };
            } else {
              cell.alignment = { horizontal: "left", vertical: "middle" };
            }
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });

        // Total row for this feature
        evidenceSheet.addRow([]);
        const featureTotalRow = evidenceSheet.addRow([
          "",
          "",
          "รวม",
          Number(feature.hours.toFixed(2)),
          "",
          "",
        ]);
        featureTotalRow.eachCell((cell, colNumber) => {
          cell.font = { name: "Calibri", size: 12, bold: true } as any;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE6F0FA" },
          } as any;
          if (colNumber === 4) {
            cell.numFmt = "#,##0.00";
            cell.alignment = { horizontal: "right", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          }
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Freeze panes
        evidenceSheet.views = [{ state: "frozen", ySplit: 3 }];
      });

      // If no data
      if (workbook.worksheets.length === 0) {
        const ws = workbook.addWorksheet("ไม่มีข้อมูล");
        ws.addRow(["ไม่มีข้อมูลในช่วงวันที่ที่เลือก"]);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error: any) {
      logger.error("Error generating audit report:", error);
      throw new Error(`ไม่สามารถสร้างรายงานได้: ${error.message}`);
    }
  },
};
