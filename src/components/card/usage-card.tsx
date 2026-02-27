"use client";

import { ArrowUpOutlined } from "@ant-design/icons";
import { Avatar, Card, Space, theme, Typography } from "antd";
import React from "react";

interface UsageCardProps {
  title: string;
  highlight: string;
  hours: number;
  accent: string;
  loading?: boolean;
}

/**
 * Component แสดงการ์ดสรุปการใช้งานสูงสุดประจำสัปดาห์
 * @param props - Props ของ Component
 */
export const UsageCard: React.FC<UsageCardProps> = ({
  title,
  highlight,
  hours,
  accent,
  loading = false,
}) => {
  const { token } = theme.useToken();

  return (
    <Card
      loading={loading}
      variant="outlined"
      style={{
        minWidth: 240,
        borderRadius: 12,
        borderColor: token.colorBorderSecondary,
        background: token.colorBgContainer,
        boxShadow: "none",
        borderLeft: `4px solid ${accent}`,
      }}
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: 16,
        },
      }}
    >
      <Space
        align="start"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Typography.Text
          style={{
            fontSize: 12,
            letterSpacing: 0.5,
            fontWeight: 600,
            color: token.colorTextSecondary,
            textTransform: "uppercase",
          }}
        >
          {title}
        </Typography.Text>
        <Avatar
          size={36}
          style={{
            background: token.colorFillTertiary,
            color: token.colorTextSecondary,
            fontWeight: 700,
          }}
        >
          {highlight?.charAt(0)?.toUpperCase() || "INF"}
        </Avatar>
      </Space>

      <Typography.Title
        level={4}
        style={{
          margin: 0,
          fontWeight: 700,
          color: token.colorText,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={highlight}
      >
        {highlight || "-"}
      </Typography.Title>

      <Space size={6} align="center">
        <ArrowUpOutlined style={{ color: accent }} />
        <Typography.Text style={{ color: token.colorText, fontWeight: 600 }}>
          {hours.toFixed(2)} ชม.
        </Typography.Text>
        <Typography.Text style={{ color: token.colorTextSecondary }}>
          ในสัปดาห์นี้
        </Typography.Text>
      </Space>
    </Card>
  );
};
