import React from "react";
import { Tag } from "antd";
import { resolveGrade } from "../utils/timesheet.helpers";

type StatusBadgeProps = {
  completionRate: number;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ completionRate }) => {
  const grade = resolveGrade(completionRate);

  return (
    <Tag
      icon={grade.icon}
      color={grade.color}
      className="min-w-[72px] inline-flex justify-center font-semibold px-3 py-1 rounded-lg"
    >
      {grade.grade}
    </Tag>
  );
};
