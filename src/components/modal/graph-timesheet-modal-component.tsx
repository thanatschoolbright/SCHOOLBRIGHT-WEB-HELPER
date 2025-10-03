/* eslint-disable */
"use client";

import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Plugin,
  ChartOptions,
} from "chart.js";
import { Modal } from "antd";
import { getUserById } from "@helpers/local_storage/user.storage";
import dayjs from "dayjs";

const TARGET_HOURS = 8;

const targetLinePlugin: Plugin<"bar"> = {
  id: "sb-target-line",
  afterDraw(chart) {
    const yScale = chart.scales?.y;
    const chartArea = chart.chartArea;
    if (!yScale || !chartArea) return;

    const targetPixel = yScale.getPixelForValue(TARGET_HOURS);
    if (targetPixel < chartArea.top || targetPixel > chartArea.bottom) {
      return;
    }

    const { ctx } = chart;
    const isDarkMode =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");
    ctx.save();
    ctx.strokeStyle = isDarkMode
      ? "rgba(255,255,255,0.5)"
      : "rgba(255,134,69,0.65)";
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(chartArea.left, targetPixel);
    ctx.lineTo(chartArea.right, targetPixel);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = isDarkMode
      ? "rgba(255,255,255,0.85)"
      : "rgba(31,41,55,0.75)";
    ctx.font = "600 12px 'Anuphan', sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("เป้าหมาย 8 ชม.", chartArea.right - 8, targetPixel - 4);
    ctx.restore();
  },
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  targetLinePlugin
);

export type TimesheetMode = "today" | "week" | "month" | "year";

interface GraphTimesheetModalProps {
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

function aggregateHoursByUser(data: any[]) {
  return data.reduce((acc, item) => {
    const user = getUserById(item.created_by);
    const userName = user?.firstname
      ? String(user.firstname)
      : String(item.created_by);
    const hours = Number(item.hours) || 0;
    acc[userName] = (acc[userName] || 0) + hours;
    return acc;
  }, {} as Record<string, number>);
}

const barPalette = [
  "#ff8645",
  "#ffc078",
  "#64d8cb",
  "#70a1ff",
  "#b087ff",
  "#ff9bbd",
  "#9dca83",
  "#f7b267",
  "#5fbcc2",
  "#ffb5a1",
];

const modeLabelMap: Record<TimesheetMode, string> = {
  today: "วันนี้",
  week: "สัปดาห์นี้",
  month: "เดือนนี้",
  year: "ปีนี้",
};

export function GraphTimesheetModal({
  open,
  onClose,
  data,
  mode = "week",
}: GraphTimesheetModalProps) {
  const isDarkMode =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const filteredData = filterDataByMode(data, mode);
  const hoursByUser = aggregateHoursByUser(filteredData);
  const sortedEntries = useMemo(() => {
    const pairs = Object.entries(hoursByUser).map(([name, value]) => ({
      name,
      hours: Number(value ?? 0),
    }));
    return pairs.sort((a, b) => b.hours - a.hours);
  }, [hoursByUser]);

  const userNames = useMemo(
    () => sortedEntries.map((entry) => entry.name),
    [sortedEntries]
  );
  const hours = useMemo(
    () => sortedEntries.map((entry) => entry.hours),
    [sortedEntries]
  );

  const modeLabel = modeLabelMap[mode] ?? modeLabelMap.week;

  const chartData = useMemo(
    () => ({
      labels: userNames,
      datasets: [
        {
          label: `ชั่วโมงของแต่ละคน (${modeLabel})`,
          data: hours,
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const color = barPalette[ctx.dataIndex % barPalette.length];
            const { chartArea } = chart;
            if (!chartArea) return color;
            const gradient = chart.ctx.createLinearGradient(
              chartArea.left,
              chartArea.bottom,
              chartArea.left,
              chartArea.top
            );
            gradient.addColorStop(0, `${color}33`);
            gradient.addColorStop(0.3, `${color}66`);
            gradient.addColorStop(1, color);
            return gradient;
          },
          borderColor: (ctx: any) =>
            barPalette[ctx.dataIndex % barPalette.length],
          borderWidth: 1.5,
          borderRadius: 12,
          borderSkipped: false,
          maxBarThickness: 54,
        },
      ],
    }),
    [hours, modeLabel, userNames]
  );

  const maxHours = useMemo(
    () => Math.max(0, ...hours.map((value) => Number(value ?? 0))),
    [hours]
  );

  const options: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 16 },
      animation: {
        duration: 900,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `Timesheet · ชั่วโมงต่อผู้ใช้ (${modeLabel})`,
          font: {
            family: "Anuphan, sans-serif",
            size: 18,
            weight: "600",
          },
          padding: { bottom: 18 },
          color: isDarkMode ? "#f8fafc" : "#0f172a",
        },
        tooltip: {
          backgroundColor: isDarkMode
            ? "rgba(255,255,255,0.9)"
            : "rgba(15, 23, 42, 0.85)",
          padding: 12,
          cornerRadius: 12,
          titleFont: {
            family: "Anuphan, sans-serif",
            weight: "600",
            size: 14,
          },
          bodyFont: {
            family: "Anuphan, sans-serif",
            size: 13,
          },
          callbacks: {
            label: (context: { raw: any; label: any }) => {
              const value = Number(context.raw ?? 0);
              return ` ${context.label}: ${value.toFixed(2)} ชม.`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: isDarkMode ? "#e2e8f0" : "#475569",
            maxRotation: 60,
            minRotation: 30,
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          suggestedMax: Math.max(TARGET_HOURS * 1.1, maxHours + 2),
          ticks: {
            color: isDarkMode ? "#e2e8f0" : "#475569",
            stepSize: 2,
          },
          grid: {
            color: isDarkMode
              ? "rgba(226,232,240,0.15)"
              : "rgba(148, 163, 184, 0.18)",
          },
          title: {
            display: true,
            text: "ชั่วโมง (Hours)",
            color: isDarkMode ? "#f1f5f9" : "#334155",
            font: {
              family: "Anuphan, sans-serif",
              weight: "600",
            },
          },
        },
      },
    }),
    [maxHours, modeLabel, isDarkMode]
  );

  const chartHeight = useMemo(() => {
    const base = 420;
    const extra = Math.max(0, userNames.length - 8) * 32;
    return Math.min(820, base + extra);
  }, [userNames.length]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      title="ผลลัพธ์แบบกราฟ"
    >
      <div
        style={{
          width: "100%",
          maxWidth: 820,
          margin: "0 auto",
          height: chartHeight,
        }}
      >
        <Bar data={chartData} options={options} />
      </div>
    </Modal>
  );
}
