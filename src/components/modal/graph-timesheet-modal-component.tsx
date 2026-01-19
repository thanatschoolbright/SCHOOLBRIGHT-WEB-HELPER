/* eslint-disable */
"use client";

import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Plugin,
  Title,
  Tooltip,
} from "chart.js";
import { Modal, Card, Typography, Empty, Badge, Space } from "antd";
import { getUserById } from "@helpers/local_storage/user.storage";
import dayjs from "dayjs";
import { BarChartOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Text, Title: AntTitle } = Typography;

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
      ? "rgba(255,255,255,0.4)"
      : "rgba(24, 144, 255, 0.5)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(chartArea.left, targetPixel);
    ctx.lineTo(chartArea.right, targetPixel);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label background
    const labelText = "เป้าหมาย 8 ชม.";
    ctx.font = "600 11px 'Inter', sans-serif";
    const textWidth = ctx.measureText(labelText).width;

    ctx.fillStyle = isDarkMode
      ? "rgba(30, 41, 59, 0.8)"
      : "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(
      chartArea.right - textWidth - 12,
      targetPixel - 12,
      textWidth + 8,
      16
    );

    ctx.fillStyle = isDarkMode ? "#94a3b8" : "#1890ff";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, chartArea.right - 8, targetPixel - 4);
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

interface ChartContext {
  chart: any;
  dataIndex: number;
}

interface GraphTimesheetModalProps {
  open: boolean;
  onClose: () => void;
  data: any[];
  mode?: TimesheetMode;
}

const barPalette = [
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
];

const modeLabelMap: Record<TimesheetMode, string> = {
  today: "วันนี้",
  week: "สัปดาห์นี้",
  month: "เดือนนี้",
  year: "ปีนี้",
};

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

function getSafeColor(dataIndex: number): string {
  const colorIndex = dataIndex % barPalette.length;
  return barPalette[colorIndex];
}

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
          label: "ชั่วโมงทำงาน",
          data: hours,
          backgroundColor: (ctx: ChartContext) => {
            const color = getSafeColor(ctx.dataIndex);
            return color;
          },
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 32,
          maxBarThickness: 40,
        },
      ],
    }),
    [hours, userNames]
  );

  const maxHours = useMemo(
    () => Math.max(0, ...hours.map((value) => Number(value ?? 0))),
    [hours]
  );

  const options: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 20, right: 20, bottom: 0, left: 10 } },
      animation: {
        duration: 750,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
        tooltip: {
          backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
          titleColor: isDarkMode ? "#f8fafc" : "#0f172a",
          bodyColor: isDarkMode ? "#cbd5e1" : "#475569",
          borderColor: isDarkMode ? "#334155" : "#e2e8f0",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: { family: "Inter, sans-serif", size: 13, weight: "600" },
          bodyFont: { family: "Inter, sans-serif", size: 12 },
          displayColors: true,
          boxPadding: 4,
          callbacks: {
            label: (context: { raw: any; label: any }) => {
              const value = Number(context.raw ?? 0);
              return ` ${value.toFixed(2)} ชั่วโมง`;
            },
          },
          shadowBlur: 10,
          shadowColor: "rgba(0,0,0,0.1)",
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: isDarkMode ? "#94a3b8" : "#64748b",
            font: { family: "Inter, sans-serif", size: 11 },
          },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          suggestedMax: Math.max(TARGET_HOURS * 1.2, maxHours + 2),
          grid: {
            color: isDarkMode ? "#334155" : "#f1f5f9",
            borderDash: [4, 4],
          },
          ticks: {
            color: isDarkMode ? "#94a3b8" : "#64748b",
            font: { family: "Inter, sans-serif", size: 11 },
            stepSize: 2,
          },
          border: { display: false },
        },
      },
    }),
    [maxHours, isDarkMode]
  );

  const chartHeight = Math.max(400, userNames.length * 40);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      title={
        <Space>
          <div className="p-2 bg-blue-50 rounded-lg">
            <BarChartOutlined className="text-blue-500 text-lg" />
          </div>
          <div className="flex flex-col">
            <Text strong className="text-lg">
              ประสิทธิภาพการทำงาน
            </Text>
            <Text type="secondary" className="text-xs font-normal">
              เปรียบเทียบชั่วโมงทำงานรายบุคคล ({modeLabel})
            </Text>
          </div>
        </Space>
      }
      styles={{
        content: { borderRadius: 16, padding: 0, overflow: "hidden" },
        header: {
          padding: "20px 24px",
          borderBottom: "1px solid #f0f0f0",
          marginBottom: 0,
        },
        body: { padding: 0 },
      }}
    >
      <div className="bg-gray-50/50 p-6">
        {userNames.length > 0 ? (
          <Card className="shadow-sm rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <Space size="large">
                <div className="flex items-center gap-2">
                  <Badge color="#3b82f6" />
                  <Text type="secondary" className="text-xs">
                    เวลาทำงานจริง
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-400 border-dashed border-t border-blue-400"></div>
                  <Text type="secondary" className="text-xs">
                    เป้าหมาย (8 ชม.)
                  </Text>
                </div>
              </Space>
              <div className="bg-gray-100 px-3 py-1 rounded-full">
                <ClockCircleOutlined className="text-gray-400 mr-2" />
                <Text className="text-xs font-medium text-gray-600">
                  รวม {hours.reduce((a, b) => a + b, 0).toFixed(1)} ชม.
                </Text>
              </div>
            </div>

            <div style={{ height: 450, width: "100%" }}>
              <Bar data={chartData} options={options} />
            </div>
          </Card>
        ) : (
          <div className="h-[400px] flex items-center justify-center">
            <Empty description="ไม่พบข้อมูลในช่วงเวลานี้" />
          </div>
        )}
      </div>
    </Modal>
  );
}
