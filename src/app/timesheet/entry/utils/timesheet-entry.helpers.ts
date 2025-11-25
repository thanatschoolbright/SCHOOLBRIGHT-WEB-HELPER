import dayjs from "dayjs";
import React from "react";
import { TimesheetEntry, StatusConfig } from "../types/timesheet-entry.types";

export const DATE_FORMAT = "DD/MM/YYYY";
export const DAILY_TARGET_HOURS = 8;

export const stringToColor = (string: string): string => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

export const getStatusConfig = (status: string): StatusConfig => {
  const {
    CheckCircleOutlined,
    SyncOutlined,
    EyeOutlined,
    CloseCircleOutlined,
    FileTextOutlined,
  } = require("@ant-design/icons");

  switch (status) {
    case "DONE":
      return {
        color: "success",
        icon: React.createElement(CheckCircleOutlined),
        text: "เสร็จสิ้น",
      };
    case "IN_PROGRESS":
      return {
        color: "processing",
        icon: React.createElement(SyncOutlined, { spin: true }),
        text: "กำลังทำ",
      };
    case "REVIEW":
      return {
        color: "geekblue",
        icon: React.createElement(EyeOutlined),
        text: "รอตรวจสอบ",
      };
    case "CANCELLED":
      return {
        color: "error",
        icon: React.createElement(CloseCircleOutlined),
        text: "ยกเลิก",
      };
    default:
      return {
        color: "default",
        icon: React.createElement(FileTextOutlined),
        text: "ร่าง",
      };
  }
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "อรุณสวัสดิ์";
  if (hour < 18) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
};

export const calculateDailySummary = (entries: TimesheetEntry[]) => {
  const dailyMap = new Map<
    string,
    { totalHours: number; entries: TimesheetEntry[] }
  >();

  entries.forEach((entry) => {
    const dateKey = dayjs(entry.date).format("YYYY-MM-DD");
    const existing = dailyMap.get(dateKey);

    if (existing) {
      existing.totalHours += entry.hours;
      existing.entries.push(entry);
    } else {
      dailyMap.set(dateKey, {
        totalHours: entry.hours,
        entries: [entry],
      });
    }
  });

  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    totalHours: data.totalHours,
    entries: data.entries,
  }));
};

export const calculateWeeklySummary = (dailySummaries: any[]) => {
  const weeklyMap = new Map<string, any>();

  dailySummaries.forEach((daily) => {
    const weekStart = dayjs(daily.date).startOf("week").format("YYYY-MM-DD");
    const weekEnd = dayjs(daily.date).endOf("week").format("YYYY-MM-DD");
    const weekKey = `${weekStart}_${weekEnd}`;

    const existing = weeklyMap.get(weekKey);
    if (existing) {
      existing.totalHours += daily.totalHours;
      existing.dailySummaries.push(daily);
    } else {
      weeklyMap.set(weekKey, {
        weekStart,
        weekEnd,
        totalHours: daily.totalHours,
        dailySummaries: [daily],
      });
    }
  });

  return Array.from(weeklyMap.values());
};

export const calculateTopUsage = (entries: TimesheetEntry[]) => {
  const projectMap = new Map<string, number>();
  const featureMap = new Map<string, number>();

  entries.forEach((entry) => {
    const projectHours = projectMap.get(entry.project_name) || 0;
    projectMap.set(entry.project_name, projectHours + entry.hours);

    if (entry.feature_name) {
      const featureHours = featureMap.get(entry.feature_name) || 0;
      featureMap.set(entry.feature_name, featureHours + entry.hours);
    }
  });

  const topProject = Array.from(projectMap.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const topFeature = Array.from(featureMap.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return {
    topProjectUsage: topProject
      ? { name: topProject[0], hours: topProject[1] }
      : null,
    topFeatureUsage: topFeature
      ? { name: topFeature[0], hours: topFeature[1] }
      : null,
  };
};
