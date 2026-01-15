import dayjs, { Dayjs } from "dayjs";
import {
  BreakdownRow,
  GradeConfig,
  SummaryRecord,
} from "../types/timesheet.types";
import React from "react";

export const POSITION_COLORS: Record<string, string> = {
  developer: "geekblue",
  tester: "purple",
  designer: "magenta",
  manager: "gold",
  default: "blue",
};

export const buildDefaultRange = (): [Dayjs, Dayjs] => {
  const startOfMonth = dayjs().startOf("month");
  const yesterday = dayjs().subtract(1, "day");
  return [startOfMonth, yesterday];
};

export const buildFullName = ({ full_name }: SummaryRecord): string =>
  full_name || "-";

export const formatNickname = (nickname?: string | null): string =>
  nickname ? `(${nickname})` : "";

export const formatBreakdown = (rows: BreakdownRow[]): string[] =>
  rows.length
    ? rows.map((item) => `${item.weekday_th} ${item.date} • ${item.hours} ชม.`)
    : ["ไม่มีข้อมูลในช่วงวันที่เลือก"];

export const resolveGrade = (completionRate: number): GradeConfig => {
  const {
    CrownFilled,
    StarFilled,
    SmileFilled,
    MehFilled,
    FrownFilled,
    FireFilled,
  } = require("@ant-design/icons");

  const GRADE_RULES: GradeConfig[] = [
    {
      grade: "A",
      min: 100,
      color: "#facc15",
      label: "Excellent",
      icon: React.createElement(CrownFilled),
    },
    {
      grade: "B",
      min: 90,
      color: "#38bdf8",
      label: "Great",
      icon: React.createElement(StarFilled),
    },
    {
      grade: "C",
      min: 75,
      color: "#34d399",
      label: "Good",
      icon: React.createElement(SmileFilled),
    },
    {
      grade: "D",
      min: 60,
      color: "#fb923c",
      label: "Needs Focus",
      icon: React.createElement(MehFilled),
    },
    {
      grade: "E",
      min: 40,
      color: "#f97316",
      label: "Risk",
      icon: React.createElement(FrownFilled),
    },
    {
      grade: "F",
      min: 0,
      color: "#f87171",
      label: "Critical",
      icon: React.createElement(FireFilled),
    },
  ];

  return (
    GRADE_RULES.find((rule) => completionRate >= rule.min) ??
    GRADE_RULES.at(-1)!
  );
};

export const getPositionColor = (position: string): string => {
  return POSITION_COLORS[position.toLowerCase()] ?? POSITION_COLORS.default;
};

export const calculateSummaryMetrics = (
  records: SummaryRecord[],
  totalExpected: number
) => {
  const totalMembers = records.length;
  const totalHours = records.reduce(
    (sum, current) => sum + current.total_hours,
    0
  );
  const avgCompletion = totalMembers
    ? Number(
        (
          records.reduce((sum, current) => sum + current.completion_rate, 0) /
          totalMembers
        ).toFixed(2)
      )
    : 0;

  return {
    totalMembers,
    totalHours,
    totalExpected,
    avgCompletion,
  };
};

export const filterRecords = (
  records: SummaryRecord[],
  keyword: string
): SummaryRecord[] => {
  const term = keyword.trim().toLowerCase();
  if (!term) return records;
  return records.filter((record) =>
    [record.full_name, record.nickname, record.position, record.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  );
};
