"use client";

import { Tag, theme, Tooltip } from "antd";
import React from "react";

/**
 * 🎨 Component แสดง Badge/Chip ที่มีสีและโทนสอดคล้องกับ Ant Design
 * รองรับทั้ง Light/Dark mode และใช้สีจาก API ได้โดยตรง
 */
export type ColoredBadgeProps = {
  text?: string;
  color?: string;
  icon?: React.ReactNode;
  tooltip?: boolean;
};

export default function ColoredBadge({
  text,
  color,
  icon,
  tooltip = true,
}: ColoredBadgeProps) {
  const { token } = theme.useToken();

  if (!text) return null;

  const background = "transparent";
  const borderColor = color || token.colorBorder;
  const textColor = color || token.colorText;

  const content = (
    <Tag
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background,
        borderColor,
        color: textColor,
        borderRadius: 12,
        fontWeight: 500,
        paddingInline: 10,
        marginBottom: 4,
        transition: "all 0.25s ease",
      }}
    >
      {icon && <span style={{ fontSize: 10 }}>{icon}</span>}
      {text}
    </Tag>
  );

  return tooltip ? <Tooltip title={text}>{content}</Tooltip> : content;
}
