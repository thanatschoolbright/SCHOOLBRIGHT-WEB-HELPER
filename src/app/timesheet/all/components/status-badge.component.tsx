import React from "react";
import { Tag, theme } from "antd";
import {
  CrownFilled,
  TrophyFilled,
  StarFilled,
  CheckCircleFilled,
  ExclamationCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons";
import { resolveGrade } from "../utils/timesheet.helpers";

type StatusBadgeProps = {
  completionRate?: number;
  rank?: string | null;
  description?: string | null;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  completionRate = 0,
  rank,
  description,
}) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgBase !== "#ffffff";
  const rankUpper = rank?.toString().toUpperCase();

  const RANK_STYLE: Record<
    string,
    {
      color: string;
      textColor: string;
      icon: React.ReactNode;
      gradient: string;
      border: string;
    }
  > = {
    S: {
      color: "#f59e0b",
      textColor: "#92400e",
      icon: <CrownFilled />,
      gradient: isDark ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.1)",
      border: "rgba(245, 158, 11, 0.4)",
    },
    A: {
      color: "#facc15",
      textColor: "#854d0e",
      icon: <TrophyFilled />,
      gradient: isDark ? "rgba(250, 204, 21, 0.2)" : "rgba(250, 204, 21, 0.1)",
      border: "rgba(250, 204, 21, 0.4)",
    },
    B: {
      color: "#38bdf8",
      textColor: "#075985",
      icon: <StarFilled />,
      gradient: isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(56, 189, 248, 0.1)",
      border: "rgba(56, 189, 248, 0.4)",
    },
    C: {
      color: "#34d399",
      textColor: "#065f46",
      icon: <CheckCircleFilled />,
      gradient: isDark ? "rgba(52, 211, 153, 0.2)" : "rgba(52, 211, 153, 0.1)",
      border: "rgba(52, 211, 153, 0.4)",
    },
    D: {
      color: "#fb923c",
      textColor: "#9a3412",
      icon: <ExclamationCircleFilled />,
      gradient: isDark ? "rgba(251, 146, 60, 0.2)" : "rgba(251, 146, 60, 0.1)",
      border: "rgba(251, 146, 60, 0.4)",
    },
    E: {
      color: "#f87171",
      textColor: "#991b1b",
      icon: <CloseCircleFilled />,
      gradient: isDark
        ? "rgba(248, 113, 113, 0.2)"
        : "rgba(248, 113, 113, 0.1)",
      border: "rgba(248, 113, 113, 0.4)",
    },
  };

  const grade = resolveGrade(completionRate);
  const rankStyle = rankUpper
    ? RANK_STYLE[rankUpper]
    : RANK_STYLE[grade.grade] || RANK_STYLE["E"];

  const label = rankUpper || grade.grade;
  const color = rankStyle.color;
  const icon = rankStyle.icon;
  const background = rankStyle.gradient;
  const textColor = isDark ? color : rankStyle.textColor;

  return (
    <Tag
      icon={React.cloneElement(icon as React.ReactElement, {
        style: { color },
      })}
      className="min-w-[64px] inline-flex items-center justify-center font-bold px-3 py-1 rounded-lg border transition-all"
      title={description || undefined}
      style={{
        background,
        color: textColor,
        borderColor: rankStyle.border,
        margin: 0,
        boxShadow: "none",
        fontSize: 13,
      }}
    >
      {label}
    </Tag>
  );
};
