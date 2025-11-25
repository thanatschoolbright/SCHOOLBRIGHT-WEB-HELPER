import React from "react";
import { Tag } from "antd";
import {
  CrownTwoTone,
  TrophyTwoTone,
  StarTwoTone,
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import { resolveGrade } from "../utils/timesheet.helpers";
import { motion } from "framer-motion";

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
  const rankUpper = rank?.toString().toUpperCase();
  const RANK_STYLE: Record<
    string,
    { color: string; icon: React.ReactNode; gradient?: string }
  > = {
    S: {
      color: "#fb923c",
      icon: <CrownTwoTone twoToneColor={["#f59e0b", "#fef08a"]} />,
      gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    },
    A: {
      color: "#facc15",
      icon: <TrophyTwoTone twoToneColor={["#facc15", "#fde68a"]} />,
      gradient: "linear-gradient(135deg, #fef9c3 0%, #fde047 100%)",
    },
    B: {
      color: "#38bdf8",
      icon: <StarTwoTone twoToneColor={["#38bdf8", "#bae6fd"]} />,
      gradient: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    },
    C: {
      color: "#34d399",
      icon: <CheckCircleTwoTone twoToneColor={["#34d399", "#bbf7d0"]} />,
      gradient: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
    },
    D: {
      color: "#fb923c",
      icon: <ExclamationCircleTwoTone twoToneColor={["#fb923c", "#fed7aa"]} />,
      gradient: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)",
    },
    E: {
      color: "#f87171",
      icon: <CloseCircleTwoTone twoToneColor={["#f87171", "#fecaca"]} />,
      gradient: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
    },
  };

  const grade = resolveGrade(completionRate);
  const rankStyle = rankUpper ? RANK_STYLE[rankUpper] : undefined;
  const label = rankUpper || grade.grade;
  const color = rankStyle?.color || grade.color;
  const icon = rankStyle?.icon || grade.icon;
  const background = rankStyle?.gradient;

  return (
    <motion.div
      className="inline-block"
      initial={{ scale: 0.95, opacity: 0.85 }}
      animate={{
        scale: rankUpper === "S" || rankUpper === "A" ? [1, 1.04, 1] : 1,
        opacity: 1,
      }}
      transition={{
        duration: rankUpper === "S" || rankUpper === "A" ? 1.4 : 0.3,
        ease: rankUpper === "S" || rankUpper === "A" ? "easeInOut" : "easeOut",
        repeat: rankUpper === "S" || rankUpper === "A" ? Infinity : 0,
        repeatDelay: 1.2,
      }}
    >
      <Tag
        icon={icon}
        color={color}
        className="min-w-[72px] inline-flex justify-center font-semibold px-3 py-1 rounded-lg"
        title={description || undefined}
        style={
          background
            ? {
                background,
                color: "#0f172a",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }
            : undefined
        }
      >
        {label}
      </Tag>
    </motion.div>
  );
};
