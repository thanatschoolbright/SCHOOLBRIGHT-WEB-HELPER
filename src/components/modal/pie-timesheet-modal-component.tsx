/* eslint-disable */
"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Modal } from "antd";
import { getProjectById } from "@/helpers/local_storage/project.storage";
import dayjs from "dayjs";
import type { TimesheetMode } from "./graph-timesheet-modal-component";

ChartJS.register(ArcElement, Title, Tooltip, Legend);

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
  "rgba(255, 99, 132, 0.7)",
  "rgba(54, 162, 235, 0.7)",
  "rgba(255, 206, 86, 0.7)",
  "rgba(75, 192, 192, 0.7)",
  "rgba(153, 102, 255, 0.7)",
  "rgba(255, 159, 64, 0.7)",
  "rgba(199, 199, 199, 0.7)",
  "rgba(83, 102, 255, 0.7)",
  "rgba(255, 99, 71, 0.7)",
  "rgba(60, 179, 113, 0.7)",
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
  const filteredData = filterDataByMode(data, mode);
  const hoursByProject = aggregateHoursByProject(filteredData);
  const projectNames = Object.keys(hoursByProject);
  const hours = Object.values(hoursByProject);

  const modeLabel = modeLabelMap[mode] ?? modeLabelMap.week;

  const chartData = {
    labels: projectNames,
    datasets: [
      {
        label: `ชั่วโมงที่ใช้ในแต่ละโปรเจกต์ (${modeLabel})` as string,
        data: hours,
        backgroundColor: backgroundColors.slice(0, projectNames.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Timesheet: ชั่วโมงที่ใช้ในแต่ละโปรเจกต์ (${modeLabel})`,
      },
    },
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="50%"
      title="ผลลัพธ์แบบกราฟ"
    >
      <Pie data={chartData} options={options} />
    </Modal>
  );
}
