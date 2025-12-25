"use client";

import {
  Avatar,
  Card,
  Progress,
  Space,
  Tag,
  theme,
  Typography,
  Flex,
  Tooltip,
} from "antd";
import {
  CloseCircleFilled,
  CrownFilled,
  SmileFilled,
  ThunderboltFilled,
  TrophyFilled,
  WarningFilled,
} from "@ant-design/icons";
import React, { useMemo } from "react";

import { SummaryRecord } from "@/types/timesheet";

interface RankCardProps {
  record: SummaryRecord;
  isCompact: boolean;
  isCurrentUser?: boolean; // Optional: เผื่อใช้ highlight ตัวเอง
  rank?: string; // Optional: เผื่อแสดงเลขลำดับ 1, 2, 3
}

// --- Configuration ---
const rankConfig: Record<
  string,
  {
    color: string;
    bgGradient?: string;
    shadow?: string;
    icon: React.ReactNode;
  }
> = {
  S: {
    color: "#D97706", // Amber-600 (Goldish)
    bgGradient: "linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)",
    shadow: "0 4px 12px rgba(217, 119, 6, 0.15)",
    icon: <ThunderboltFilled style={{ fontSize: 16 }} />,
  },
  A: {
    color: "#16A34A", // Green-600
    bgGradient: "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)",
    shadow: "0 4px 12px rgba(22, 163, 74, 0.15)",
    icon: <CrownFilled style={{ fontSize: 16 }} />,
  },
  B: {
    color: "#2563EB", // Blue-600
    icon: <TrophyFilled />,
  },
  C: {
    color: "#EA580C", // Orange-600
    icon: <SmileFilled />,
  },
  D: {
    color: "#DC2626", // Red-600
    icon: <WarningFilled />,
  },
  E: {
    color: "#475569", // Slate-600
    icon: <CloseCircleFilled />,
  },
};

const formatName = (record: SummaryRecord) =>
  record.nickname || record.full_name || "-";

export const RankCard: React.FC<RankCardProps> = ({
  record,
  isCompact,
  isCurrentUser = false,
}) => {
  const { token } = theme.useToken();

  // Get Configuration based on Rank
  const config = rankConfig[record.rank] || rankConfig.E;

  // Calculations
  const progressPercent = record.expected_hours
    ? Math.min(100, (record.total_hours / record.expected_hours) * 100)
    : 0;

  // Dynamic Styles
  const cardStyle: React.CSSProperties = useMemo(
    () => ({
      borderRadius: 16,
      border: isCurrentUser
        ? `2px solid ${token.colorPrimary}`
        : `1px solid ${token.colorBorderSecondary}`,
      background: config.bgGradient || token.colorBgContainer,
      boxShadow: isCurrentUser
        ? `0 0 0 4px ${token.colorPrimaryBg}`
        : config.shadow || "0 2px 8px rgba(0,0,0,0.02)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden",
      cursor: "default",
    }),
    [config, isCurrentUser, token]
  );

  return (
    <Card
      size="small"
      style={cardStyle}
      styles={{
        body:{
          padding: isCompact ? "12px 16px" : "16px 20px" 
        }
      }}
      
      className="rank-card-hover" // Class for hover effect via global css or style tag
    >
      {/* CSS Overlay for Hover Effect (Optional if using Global CSS) */}
      <style jsx>{`
        .rank-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08) !important;
        }
      `}</style>

      {/* Decorative Side Bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: config.color,
        }}
      />

      <Flex align="center" gap={16}>
        {/* --- Avatar Section --- */}
        <div style={{ position: "relative" }}>
          <Avatar
            size={isCompact ? 40 : 48}
            style={{
              backgroundColor: isCurrentUser
                ? token.colorPrimaryBg
                : token.colorFillAlter,
              color: isCurrentUser ? token.colorPrimary : config.color,
              border: `2px solid ${
                isCurrentUser ? token.colorPrimary : "transparent"
              }`,
              fontSize: isCompact ? 16 : 18,
              fontWeight: 600,
            }}
          >
            {record.full_name?.charAt(0)?.toUpperCase() ?? "?"}
          </Avatar>

          {/* Rank Icon Badge */}
          <div
            style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              backgroundColor: token.colorBgContainer,
              borderRadius: "50%",
              padding: 2,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              color: config.color,
              display: "flex",
            }}
          >
            {config.icon}
          </div>
        </div>

        {/* --- Content Section --- */}
        <Flex vertical flex={1} style={{ minWidth: 0 }} gap={4}>
          {/* Row 1: Name and Percentage */}
          <Flex justify="space-between" align="center">
            <Flex align="center" gap={8} style={{ minWidth: 0 }}>
              <Typography.Text
                ellipsis
                strong
                style={{
                  fontSize: isCompact ? 14 : 16,
                  color: token.colorText,
                }}
              >
                {formatName(record)}
              </Typography.Text>

              {!isCompact && (
                <Tag
                  bordered={false}
                  color={config.color}
                  style={{
                    margin: 0,
                    borderRadius: 12,
                    fontWeight: 600,
                    backgroundColor: `${config.color}15`, // 15 = roughly 10% opacity hex
                    color: config.color,
                  }}
                >
                  {record.rank}
                </Tag>
              )}
            </Flex>

            <Typography.Text
              strong
              style={{
                fontSize: isCompact ? 16 : 20,
                color: config.color, // Use Rank Color for emphasis
                lineHeight: 1,
              }}
            >
              {record.completion_rate.toFixed(0)}
              <span style={{ fontSize: 12, marginLeft: 2 }}>%</span>
            </Typography.Text>
          </Flex>

          {/* Row 2: Description or Rank (Compact) */}
          <Flex justify="space-between" align="center">
            <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>
              {record.rank_description || "ยังไม่มีข้อมูลเพิ่มเติม"}
            </Typography.Text>

            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {record.total_hours.toFixed(1)} /{" "}
              {record.expected_hours.toFixed(1)} ชม.
            </Typography.Text>
          </Flex>

          {/* Row 3: Progress Bar */}
          <Progress
            percent={Number(progressPercent.toFixed(1))}
            strokeColor={config.color}
            trailColor={token.colorFillSecondary}
            showInfo={false}
            size="small"
            style={{ marginBottom: 0, lineHeight: 0 }}
            strokeLinecap="round"
          />
        </Flex>
      </Flex>
    </Card>
  );
};
