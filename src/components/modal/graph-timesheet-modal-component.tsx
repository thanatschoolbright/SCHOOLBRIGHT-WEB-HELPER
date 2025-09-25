/* eslint-disable */
"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Modal } from "antd";
import { getUserById } from "@helpers/local_storage/user.storage";
import dayjs from "dayjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
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
    const userName = user
      ? `${user.firstname} ${user.lastname}`
      : String(item.created_by);
    const hours = Number(item.hours) || 0;
    acc[userName] = (acc[userName] || 0) + hours;
    return acc;
  }, {} as Record<string, number>);
}

function getBackgroundColors(hoursArray: number[]) {
  return hoursArray.map((hours) => {
    if (hours > 8) return "rgba(255, 99, 132, 0.7)";
    if (hours < 8) return "rgba(255, 206, 86, 0.7)";
    return "rgba(75, 192, 192, 0.7)";
  });
}

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
  const filteredData = filterDataByMode(data, mode);
  const hoursByUser = aggregateHoursByUser(filteredData);
  const userNames = Object.keys(hoursByUser);
  const hours = Object.values(hoursByUser);

  const modeLabel = modeLabelMap[mode] ?? modeLabelMap.week;

  const chartData = {
    labels: userNames,
    datasets: [
      {
        label: `ชั่วโมงของแต่ละคน (${modeLabel})` as string,
        data: hours,
        backgroundColor: getBackgroundColors(hours as number[]),
        borderRadius: 5,
        borderSkipped: false,
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
        text: `Timesheet: ชั่วโมงต่อผู้ใช้ (${modeLabel})`,
        font: {
          size: 20,
          family: "Anuphan",
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "User ID",
        },
      },
      y: {
        title: {
          display: true,
          text: "ชั่วโมง (Hours)",
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90%"
      title="ผลลัพธ์แบบกราฟ"
    >
      <Bar data={chartData} options={options} />
    </Modal>
  );
}
