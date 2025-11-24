import { PrismaClient as TimesheetPrismaClient } from "@/../generated/prisma-timesheet";
import ExcelJS from "exceljs";
import dayjs from "dayjs";
import { logger } from "@/helpers/logger";

const prisma = new TimesheetPrismaClient();

export const TimesheetSubProjectWeeklyService = {
  generateWeeklySubProjectExcel: async (params: {
    start_date: string;
    end_date: string;
  }) => {
    const { start_date, end_date } = params;

    try {
      const start = dayjs(start_date).startOf("day");
      const end = dayjs(end_date).endOf("day");

      const entries = await prisma.timesheetEntry.findMany({
        where: {
          date: {
            gte: new Date(start.toISOString()),
            lte: new Date(end.toISOString()),
          },
          is_deleted: false,
        },
        include: { project: true, feature: true },
        orderBy: [{ date: "asc" }],
      });

      // Build map: month -> weekLabel -> projectName -> hours
      const monthMap = new Map<string, Map<string, Map<string, number>>>();

      entries.forEach((entry: any) => {
        const entryDate = dayjs(entry.date);
        const monthKey = entryDate.format("MM-YYYY");
        const weekNumber = Math.floor((entryDate.date() - 1) / 7) + 1;
        const weekLabel = `สัปดาห์ที่ ${weekNumber}`;
        const projectName = entry.project?.name || "ไม่ระบุ";
        const hours = Number(entry.hours || 0);

        if (!monthMap.has(monthKey)) monthMap.set(monthKey, new Map());
        const weekMap = monthMap.get(monthKey)!;
        if (!weekMap.has(weekLabel)) weekMap.set(weekLabel, new Map());
        const projectMap = weekMap.get(weekLabel)!;

        projectMap.set(projectName, (projectMap.get(projectName) || 0) + hours);
      });

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SB Web Helper";
      workbook.created = new Date();

      // Styles
      const titleFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F4E78" },
      };
      const headerFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDCE6F1" },
      };
      const accentFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE6F0FA" },
      };

      // Prepare a flattened ordered list of weeks across months for the overview sheet
      const weeksList: Array<{
        label: string;
        weekNumber: number;
        monthNumber: number;
        year: string;
        projectEntries: Array<[string, number]>;
        totalHours: number;
      }> = [];

      const sortedMonthKeys = Array.from(monthMap.keys()).sort((a, b) => {
        const [am, ay] = a.split("-").map(Number);
        const [bm, by] = b.split("-").map(Number);
        if (ay !== by) return ay - by;
        return am - bm;
      });

      for (const monthKey of sortedMonthKeys) {
        const weekMap = monthMap.get(monthKey)!;
        const [mm, yyyy] = monthKey.split("-");
        const monthNumber = mm ? Number(mm) : 0;
        const weeks = Array.from(weekMap.keys()).map((wk) => {
          const match = (wk || "").match(/(\d+)/);
          const weekNumber = match ? Number(match[1]) : 1;
          return { wk, weekNumber };
        });
        weeks.sort((a, b) => a.weekNumber - b.weekNumber);
        for (const w of weeks) {
          const projectMap = weekMap.get(w.wk)!;
          const projectEntries = Array.from(projectMap.entries()).sort(
            (a, b) => b[1] - a[1]
          );
          const totalHours = projectEntries.reduce((s, p) => s + p[1], 0);
          weeksList.push({
            label: `สัปดาห์ที่ ${w.weekNumber} เดือน ${monthNumber} ปี ${yyyy}`,
            weekNumber: w.weekNumber,
            monthNumber,
            year: yyyy,
            projectEntries,
            totalHours,
          });
        }
      }

      // Create overview sheet as the first worksheet
      if (weeksList.length > 0) {
        const overviewName = "ภาพรวมสัปดาห์".slice(0, 31);
        const wsOverview = workbook.addWorksheet(overviewName);
        // utility to convert col number to Excel letter
        const colLetter = (n: number) => {
          let s = "";
          while (n > 0) {
            const m = (n - 1) % 26;
            s = String.fromCharCode(65 + m) + s;
            n = Math.floor((n - 1) / 26);
          }
          return s;
        };

        // Build columns: for each week we reserve 3 columns: idx, project, hours
        wsOverview.properties.defaultRowHeight = 20;
        const overviewCols: any[] = [];
        for (const _ of weeksList) {
          overviewCols.push({ width: 8 });
          overviewCols.push({ width: 64 });
          overviewCols.push({ width: 18 });
        }
        wsOverview.columns = overviewCols;

        // First row: merged week labels
        weeksList.forEach((w, i) => {
          const start = i * 3 + 1;
          const end = start + 2;
          const range = `${colLetter(start)}1:${colLetter(end)}1`;
          wsOverview.mergeCells(range);
          const cell = wsOverview.getCell(colLetter(start) + "1");
          cell.value = w.label;
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
          cell.alignment = { vertical: "middle", horizontal: "center" };
          wsOverview.getRow(1).height = 24;
        });

        // Second row: sub-headers repeated
        const subHeaders: string[] = [];
        for (let i = 0; i < weeksList.length; i++) {
          subHeaders.push("ลำดับ");
          subHeaders.push("รายละเอียด");
          subHeaders.push("จำนวนชั่วโมง");
        }
        const headerRow = wsOverview.addRow(subHeaders);
        headerRow.eachCell((cell) => {
          cell.font = { name: "Calibri", size: 11, bold: true } as any;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDCE6F1" },
          } as any;
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Data rows: find max project rows across weeks
        const maxRows = Math.max(
          ...weeksList.map((w) => w.projectEntries.length)
        );
        for (let r = 0; r < maxRows; r++) {
          const rowVals: any[] = [];
          for (const w of weeksList) {
            const pe = w.projectEntries[r];
            if (pe) {
              rowVals.push(r + 1);
              rowVals.push(pe[0]);
              rowVals.push(Number(pe[1].toFixed(2)));
            } else {
              rowVals.push("");
              rowVals.push("");
              rowVals.push("");
            }
          }
          const row = wsOverview.addRow(rowVals);
          row.eachCell((cell, colNumber) => {
            cell.font = { name: "Calibri", size: 11 } as any;
            // hours columns are every 3rd column (colIndex % 3 === 0)
            if (colNumber % 3 === 0) {
              cell.numFmt = "#,##0.00";
              cell.alignment = {
                horizontal: "right",
                vertical: "middle",
              } as any;
            } else if ((colNumber - 1) % 3 === 1) {
              cell.alignment = {
                horizontal: "left",
                vertical: "middle",
                wrapText: true,
              } as any;
            } else {
              cell.alignment = {
                horizontal: "center",
                vertical: "middle",
              } as any;
            }
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        }

        // Totals row
        wsOverview.addRow([]);
        const totals: any[] = [];
        for (const w of weeksList) {
          totals.push("");
          totals.push("รวม");
          totals.push(Number(w.totalHours.toFixed(2)));
        }
        const totalRow = wsOverview.addRow(totals);
        totalRow.eachCell((cell, colNumber) => {
          cell.font = { name: "Calibri", size: 12, bold: true } as any;
          if (colNumber % 3 === 0) cell.numFmt = "#,##0.00";
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE6F0FA" },
          } as any;
          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber % 3 === 2 ? "left" : "center",
          } as any;
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Freeze header rows
        wsOverview.views = [{ state: "frozen", ySplit: 2 }];
      }

      for (const [monthKey, weekMap] of Array.from(monthMap.entries())) {
        for (const [weekLabel, projectMap] of Array.from(weekMap.entries())) {
          const [mm, yyyy] = monthKey.split("-");
          const match = (weekLabel || "").match(/(\d+)/);
          const weekNumber = match ? Number(match[1]) : 1;
          const monthNumber = mm ? Number(mm) : 0;
          const sheetName =
            `สัปดาห์ที่ ${weekNumber} เดือน ${monthNumber} ปี ${yyyy}`.slice(
              0,
              31
            );
          const ws = workbook.addWorksheet(sheetName);

          // Set column widths (wider for enterprise feel) and default styles
          ws.properties.defaultRowHeight = 20;
          ws.columns = [
            { header: "ลำดับ", key: "idx", width: 10 },
            { header: "ชื่อโปรเจ็ค", key: "project", width: 64 },
            { header: "จำนวนชั่วโมง", key: "hours", width: 20 },
            { header: "เปอร์เซ็นต์", key: "percent", width: 16 },
          ];
          // Make project column wrap text and align
          ws.getColumn("project").alignment = {
            wrapText: true,
            vertical: "middle",
            horizontal: "left",
          } as any;

          // Title
          ws.mergeCells("A1:D1");
          const titleCell = ws.getCell("A1");
          titleCell.value = `สัปดาห์ที่ ${weekNumber} เดือน ${monthNumber} ปี ${yyyy}`;
          titleCell.font = {
            name: "Calibri",
            size: 16,
            bold: true,
            color: { argb: "FFFFFFFF" },
          };
          titleCell.alignment = { vertical: "middle", horizontal: "center" };
          titleCell.fill = titleFill as any;
          ws.getRow(1).height = 26;

          // Subtitle / range
          ws.mergeCells("A2:D2");
          const subCell = ws.getCell("A2");
          subCell.value = `ช่วงวันที่: ${start_date} - ${end_date}`;
          subCell.font = {
            name: "Calibri",
            size: 11,
            color: { argb: "FF333333" },
          };
          subCell.alignment = { vertical: "middle", horizontal: "center" };
          ws.getRow(2).height = 18;

          // Header row
          const headerRow = ws.addRow([
            "ลำดับ",
            "ชื่อโปรเจ็ค",
            "จำนวนชั่วโมง",
            "เปอร์เซ็นต์",
          ]);
          // Darker header for enterprise look
          const darkHeaderFill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF2E75B6" },
          };
          headerRow.eachCell((cell) => {
            cell.font = {
              name: "Calibri",
              size: 12,
              bold: true,
              color: { argb: "FFFFFFFF" },
            } as any;
            cell.fill = darkHeaderFill as any;
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
          ws.getRow(headerRow.number).height = 24;
          // Freeze panes so header stays visible
          ws.views = [{ state: "frozen", ySplit: headerRow.number }];

          // Data rows
          const projectEntries = Array.from(projectMap.entries()).sort(
            (a, b) => b[1] - a[1]
          );
          const totalHours = projectEntries.reduce((s, p) => s + p[1], 0);

          let idx = 1;
          for (const [projectName, hours] of projectEntries) {
            const percent =
              totalHours > 0
                ? `${((hours / totalHours) * 100).toFixed(2)}%`
                : "0.00%";
            const row = ws.addRow([
              idx,
              projectName,
              Number(hours.toFixed(2)),
              percent,
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
            idx += 1;
          }

          // Add total row with accent and spacing
          ws.addRow([]);
          const totalRow = ws.addRow([
            "รวม",
            "",
            Number(totalHours.toFixed(2)),
            "100.00%",
          ]);
          totalRow.eachCell((cell, colNumber) => {
            cell.font = { name: "Calibri", size: 12, bold: true } as any;
            cell.fill = accentFill as any;
            if (colNumber === 3) {
              cell.numFmt = "#,##0.00";
            }
            cell.alignment = {
              vertical: "middle",
              horizontal: colNumber === 2 ? "left" : "center",
            } as any;
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });

          // Auto filter
          ws.autoFilter = {
            from: { row: headerRow.number, column: 1 },
            to: { row: headerRow.number, column: 4 },
          };
        }
      }

      // If no sheets created
      if (workbook.worksheets.length === 0) {
        const ws = workbook.addWorksheet("ไม่มีข้อมูล");
        ws.addRow(["ไม่มีข้อมูลในช่วงวันที่ที่เลือก"]);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error: any) {
      logger.error("Error generating weekly sub-project excel:", error);
      throw new Error(`ไม่สามารถสร้างรายงานได้: ${error.message}`);
    }
  },
};
