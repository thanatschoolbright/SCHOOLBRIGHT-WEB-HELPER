a"use client";

import { Tag } from "antd";
import React from "react";

interface StatusBadgeProps {
  status: string | number | undefined | null;
  loading?: boolean;
}

interface StatusConfig {
  label: string;
  color: string;
  emoji: string;
}

/**
 * แมปสถานะ HTTP เป็นการแสดงผลที่เหมาะสม
 */
const STATUS_MAP: Record<string, StatusConfig> = {
  "200": { label: "OK", color: "success", emoji: "✅" },
  "201": { label: "Created", color: "success", emoji: "🆕" },
  "204": { label: "No Content", color: "success", emoji: "📭" },
  "400": { label: "Bad Request", color: "error", emoji: "❌" },
  "401": { label: "Unauthorized", color: "warning", emoji: "🔒" },
  "403": { label: "Forbidden", color: "error", emoji: "🚫" },
  "404": { label: "Not Found", color: "default", emoji: "🔍" },
  "500": { label: "Server Error", color: "error", emoji: "💥" },
  "502": { label: "Bad Gateway", color: "error", emoji: "🌐" },
  "503": { label: "Service Unavailable", color: "warning", emoji: "⏰" },
};

/**
 * Component แสดง Badge สถานะ HTTP Response
 * @param props - Properties ของ Badge
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  loading = false,
}) => {
  //** ตรวจสอบสถานะว่าเป็น null หรือ undefined */
  if (status === undefined || status === null) {
    return <Tag color="default">❓ Unknown</Tag>;
  }

  //** แสดง Loading state */
  if (loading) {
    return <Tag color="processing">⏳ Loading...</Tag>;
  }

  const statusString = status.toString();
  const statusConfig = STATUS_MAP[statusString];

  //** ใช้ค่า default หากไม่มีในแมป */
  if (!statusConfig) {
    return <Tag color="default">{statusString}</Tag>;
  }

  return (
    <Tag color={statusConfig.color}>
      {statusConfig.emoji} {statusConfig.label}
    </Tag>
  );
};
