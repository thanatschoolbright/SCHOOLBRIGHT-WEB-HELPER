/* eslint-disable */
"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Modal } from "antd";
import { getProjectById } from "@/helpers/local_storage/project.storage";

ChartJS.register(ArcElement, Title, Tooltip, Legend);

interface PieTimesheetModalProps {
  open: boolean;
  onClose: () => void;
  data: any[];
}

function filterDataForToday(data: any[]) {
  const todayStr = new Date().toDateString();
  return (data ?? []).filter(
    (item) => new Date(item.date).toDateString() === todayStr
  );
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

export function PieTimesheetModal({
  open,
  onClose,
  data,
}: PieTimesheetModalProps) {
  const todayData = filterDataForToday(data);
  const hoursByProject = aggregateHoursByProject(todayData);
  const projectNames = Object.keys(hoursByProject);
  const hours = Object.values(hoursByProject);

  const chartData = {
    labels: projectNames,
    datasets: [
      {
        label: "ชั่วโมงที่ใช้ในแต่ละโปรเจกต์ (วันนี้)" as string,
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
        text: "Timesheet: ชั่วโมงที่ใช้ในแต่ละโปรเจกต์ (วันนี้)",
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
