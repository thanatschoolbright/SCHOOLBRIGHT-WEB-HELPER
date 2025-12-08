/* eslint-disable */
"use client";

import { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import {
  ArcElement,
  Chart as ChartJS,
  ChartType,
  Legend,
  Plugin,
  Title,
  Tooltip,
} from "chart.js";
import { Modal, Card, Typography, Empty, Space, Row, Col, Badge } from "antd";
import { getProjectById } from "@/helpers/local_storage/project.storage";
import dayjs from "dayjs";
import { PieChartOutlined, ProjectOutlined } from "@ant-design/icons";
import type { TimesheetMode } from "./graph-timesheet-modal-component";

const { Text } = Typography;

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
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const data = (chart.data?.datasets?.[0]?.data ?? []) as number[];
    const total = data.reduce((sum, value) => sum + Number(value || 0), 0);
    if (!total) return;

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    const opts: any = chart?.options?.plugins?.centerTextDarkMode;
    const isDarkMode = opts?.isDarkMode ?? false;

    ctx.save();
    ctx.font = "700 24px 'Inter', sans-serif";
    ctx.fillStyle = isDarkMode ? "#f8fafc" : "#1e293b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${total.toFixed(1)}`, centerX, centerY - 10);

    ctx.font = "500 12px 'Inter', sans-serif";
    ctx.fillStyle = isDarkMode ? "#94a3b8" : "#64748b";
    ctx.fillText("ชั่วโมงรวม", centerX, centerY + 15);

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
  "#3b82f6", // Blue 500
  "#8b5cf6", // Violet 500
  "#ec4899", // Pink 500
  "#f59e0b", // Amber 500
  "#10b981", // Emerald 500
  "#06b6d4", // Cyan 500
  "#6366f1", // Indigo 500
  "#ef4444", // Red 500
  "#84cc16", // Lime 500
  "#14b8a6", // Teal 500
];

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
  const isDarkMode =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const filteredData = filterDataByMode(data, mode);
  const hoursByProject = aggregateHoursByProject(filteredData);
  const projectNames = Object.keys(hoursByProject);
  const hours = Object.values(hoursByProject);
  const totalHours = hours.reduce((a, b) => a + b, 0);

  const modeLabel = modeLabelMap[mode] ?? modeLabelMap.week;

  const chartData = useMemo(
    () => ({
      labels: projectNames,
      datasets: [
        {
          label: "ชั่วโมง",
          data: hours,
          backgroundColor: backgroundColors.slice(0, projectNames.length),
          borderColor: isDarkMode ? "#1e293b" : "#ffffff",
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    }),
    [hours, projectNames, isDarkMode]
  );

  const options: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 20 },
      cutout: "75%",
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: false, // Hide default legend to build custom one
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
              const rawValue = Number(context.raw ?? 0);
              const percent = totalHours
                ? ((rawValue / totalHours) * 100).toFixed(1)
                : "0";
              return ` ${rawValue.toFixed(2)} ชม. (${percent}%)`;
            },
          },
          shadowBlur: 10,
          shadowColor: "rgba(0,0,0,0.1)",
        },
        centerTextDarkMode: { isDarkMode },
      },
    }),
    [totalHours, isDarkMode]
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      title={
        <Space>
          <div className="p-2 bg-purple-50 rounded-lg">
            <PieChartOutlined className="text-purple-500 text-lg" />
          </div>
          <div className="flex flex-col">
            <Text strong className="text-lg">
              สัดส่วนโครงการ
            </Text>
            <Text type="secondary" className="text-xs font-normal">
              แบ่งตามเวลาที่ใช้จริง ({modeLabel})
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
        {projectNames.length > 0 ? (
          <Row gutter={24}>
            {/* Chart Section */}
            <Col span={14}>
              <Card
                
                className="shadow-sm rounded-xl h-full flex items-center justify-center"
              >
                <div
                  style={{ height: 320, width: "100%", position: "relative" }}
                >
                  <Pie data={chartData} options={options} />
                </div>
              </Card>
            </Col>

            {/* Legend Section */}
            <Col span={10}>
              <Card
                
                className="shadow-sm rounded-xl h-full overflow-y-auto"
                style={{ maxHeight: 368 }}
              >
                <div className="space-y-4">
                  <Text
                    strong
                    className="text-gray-500 text-xs uppercase tracking-wider"
                  >
                    รายละเอียดโครงการ
                  </Text>
                  {projectNames.map((name, index) => {
                    const value = hours[index];
                    const percent = ((value / totalHours) * 100).toFixed(1);
                    const color =
                      backgroundColors[index % backgroundColors.length];

                    return (
                      <div
                        key={name}
                        className="flex items-center justify-between group p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-default"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <Text
                            ellipsis
                            className="text-sm font-medium text-gray-700 group-hover:text-gray-900"
                          >
                            {name}
                          </Text>
                        </div>
                        <div className="text-right flex-shrink-0 pl-2">
                          <Text strong className="block text-sm">
                            {value.toFixed(1)} ชม.
                          </Text>
                          <Text type="secondary" className="text-xs">
                            {percent}%
                          </Text>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Col>
          </Row>
        ) : (
          <div className="h-[400px] flex items-center justify-center">
            <Empty description="ไม่พบข้อมูลในช่วงเวลานี้" />
          </div>
        )}
      </div>
    </Modal>
  );
}
