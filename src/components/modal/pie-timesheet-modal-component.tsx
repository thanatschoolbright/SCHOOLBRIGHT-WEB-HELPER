/* eslint-disable */
"use client";

import { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Plugin,
  ChartType,
} from "chart.js";
import { Modal } from "antd";
import { getProjectById } from "@/helpers/local_storage/project.storage";
import dayjs from "dayjs";
import type { TimesheetMode } from "./graph-timesheet-modal-component";

declare module "chart.js" {
  interface PluginOptionsByType<TType extends ChartType> {
    centerTextDarkMode?: {
      isDarkMode: boolean;
    };
  }
}

const centerTextPlugin: Plugin<"pie"> = {
  id: "sb-center-text",
  afterDraw(chart) {
    const dataset = chart.getDatasetMeta(0);
    const arc = dataset?.data?.[0];
    if (!arc) return;

    const data = (chart.data?.datasets?.[0]?.data ?? []) as number[];
    const total = data.reduce((sum, value) => sum + Number(value || 0), 0);
    if (!total) return;

    const { ctx } = chart;
    const centerX = arc.x;
    const centerY = arc.y;

    const opts: any = chart?.options?.plugins?.centerTextDarkMode;
    const isDarkMode = opts?.isDarkMode ?? false;

    ctx.save();
    ctx.font = "600 18px 'Anuphan', sans-serif";
    ctx.fillStyle = isDarkMode ? "#f8fafc" : "#1f2937";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${total.toFixed(2)} ชม.`, centerX, centerY);

    if (chart.data?.labels?.length) {
      ctx.font = "400 13px 'Anuphan', sans-serif";
      ctx.fillStyle = isDarkMode ? "#cbd5e1" : "#64748b";
      ctx.fillText("รวมเวลาทั้งหมด", centerX, centerY + 24);
    }

    ctx.restore();
  },
};

ChartJS.register(ArcElement, Title, Tooltip, Legend, centerTextPlugin);

interface PieTimesheetModalProps {
  open: boolean;
  onClose: () => void;
  data: any[];
  mode?: TimesheetMode;
}

function filterDataByMode(data: any[], mode: TimesheetMode) {
  const now = dayjs();

  return (data ?? []).filter((item) => {
    const itemDate = item?.date ? dayjs(item.date) : null;
    if (!itemDate || !itemDate.isValid()) {
      return false;
    }

    switch (mode) {
      case "today":
        return itemDate.isSame(now, "day");
      case "month":
        return itemDate.isSame(now, "month");
      case "year":
        return itemDate.isSame(now, "year");
      case "week":
      default:
        return itemDate.isSame(now, "week");
    }
  });
}

function aggregateHoursByProject(data: any[]) {
  const projectHours: Record<string, number> = {};

  data.forEach((item) => {
    const project = getProjectById(item.project_id);
    const projectName = project ? project.name : String(item.project_id);
    const hours = Number(item.hours) || 0;

    projectHours[projectName] = (projectHours[projectName] || 0) + hours;
  });

  return projectHours;
}

const backgroundColors = [
  "#ff8058",
  "#f4b266",
  "#9dca83",
  "#5fbcc2",
  "#6c8cff",
  "#b087ff",
  "#ff9bbd",
  "#ffc078",
  "#64d8cb",
  "#ffb5a1",
].map((hex) => `${hex}dd`);

const modeLabelMap: Record<TimesheetMode, string> = {
  today: "วันนี้",
  week: "สัปดาห์นี้",
  month: "เดือนนี้",
  year: "ปีนี้",
};

export function PieTimesheetModal({
  open,
  onClose,
  data,
  mode = "week",
}: PieTimesheetModalProps) {
  const isDarkMode = useMemo(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  }, []);

  const filteredData = filterDataByMode(data, mode);
  const hoursByProject = aggregateHoursByProject(filteredData);
  const projectNames = Object.keys(hoursByProject);
  const hours = Object.values(hoursByProject);
  const segmentCount = projectNames.length;

  const modeLabel = modeLabelMap[mode] ?? modeLabelMap.week;

  const chartData = useMemo(
    () => ({
      labels: projectNames,
      datasets: [
        {
          label: `ชั่วโมงที่ใช้ในแต่ละโปรเจกต์ (${modeLabel})`,
          data: hours,
          backgroundColor: backgroundColors.slice(0, projectNames.length),
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 16,
          borderRadius: 10,
        },
      ],
    }),
    [hours, modeLabel, projectNames]
  );

  const options: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 16 },
      cutout: "55%",
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 18,
            font: {
              family: "Anuphan, sans-serif",
            },
            color: isDarkMode ? "#e2e8f0" : "#334155",
          },
        },
        title: {
          display: true,
          text: `Timesheet · ภาพรวมการใช้เวลา (${modeLabel})`,
          padding: {
            bottom: 20,
          },
          font: {
            family: "Anuphan, sans-serif",
            size: 18,
            weight: "600",
          },
          color: isDarkMode ? "#f8fafc" : "#0f172a",
        },
        tooltip: {
          callbacks: {
            label: (context: { raw: any; label: any }) => {
              const rawValue = Number(context.raw ?? 0);
              const total = hours.reduce((sum, value) => sum + value, 0);
              const percent = total
                ? ((rawValue / total) * 100).toFixed(1)
                : "0";
              return ` ${context.label}: ${rawValue.toFixed(
                2
              )} ชม. (${percent}%)`;
            },
          },
          backgroundColor: isDarkMode
            ? "rgba(255,255,255,0.9)"
            : "rgba(15, 23, 42, 0.85)",
          titleFont: {
            family: "Anuphan, sans-serif",
            weight: "600",
            size: 14,
          },
          bodyFont: {
            family: "Anuphan, sans-serif",
            size: 13,
          },
          padding: 12,
          cornerRadius: 12,
        },
        centerTextDarkMode: { isDarkMode },
      },
    }),
    [hours, modeLabel, isDarkMode]
  );

  const chartHeight = useMemo(() => {
    const base = 400;
    const extra = Math.max(0, segmentCount - 8) * 24;
    return Math.min(720, base + extra);
  }, [segmentCount]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={540}
      title="ผลลัพธ์แบบกราฟ"
    >
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          margin: "0 auto",
          height: chartHeight,
        }}
      >
        <Pie data={chartData} options={options} />
      </div>
    </Modal>
  );
}
