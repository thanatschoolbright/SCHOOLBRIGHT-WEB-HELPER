"use client";

import React from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Card, Flex, Skeleton, Tooltip, Typography, theme } from "antd";

const { Text } = Typography;

export interface SummaryCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  tooltip?: string;
  isLoading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  color,
  tooltip,
  isLoading = false,
}) => {
  const { token } = theme.useToken();
  const themeColor = color ?? token.colorPrimary;

  // 1. Loading State
  if (isLoading) {
    return (
      <Card
        styles={{ body: { padding: 24 } }}
        style={{
          borderRadius: 20,
          border: `1px solid ${token.colorBorderSecondary}`,
          height: "100%",
          minHeight: 140,
        }}
        variant="borderless"
      >
        <Flex
          vertical
          justify="space-between"
          style={{ height: "100%", gap: 24 }}
        >
          {/* Top part: Icon placeholder + Title placeholder */}
          <Flex align="center" gap={12}>
            <Skeleton.Avatar
              active
              shape="square"
              size={32}
              style={{ borderRadius: 8 }}
            />
            <Skeleton active paragraph={false} title={{ width: 120 }} />
          </Flex>
          {/* Bottom part: Big Number placeholder + Subtitle placeholder */}
          <Flex vertical gap={8}>
            <Skeleton.Button active style={{ width: 180, height: 40 }} />
            {/* 🟢 เพิ่ม Skeleton เส้นเล็กๆ สำหรับ subtitle */}
            <Skeleton.Button active style={{ width: 100, height: 16 }} />
          </Flex>
        </Flex>
      </Card>
    );
  }

  // 2. Main Render State
  return (
    <>
      <Card
        className="metric-first-card"
        style={
          {
            "--theme-color": themeColor,
            "--theme-color-bg": `${themeColor}15`,
            "--theme-color-hover": `${themeColor}12`, // Increased opacity for hover highlight
            "--border-color": token.colorBorderSecondary,
            "--bg-color": token.colorBgContainer,
            "--value-text-shadow": "none",
          } as React.CSSProperties
        }
        styles={{
          body: {
            padding: "32px 28px", // Increased padding from 24px 24px 20px 24px
            height: "100%",
            minHeight: 160,
            display: "flex",
            flexDirection: "column",
          },
        }}
        variant="borderless"
      >
        <Flex
          vertical
          justify="space-between"
          style={{ height: "100%", flex: 1 }}
        >
          {/* --- Top Section: Context (Icon + Title) --- */}
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={12}>
              {icon && <div className="metric-icon">{icon}</div>}
              <Text
                type="secondary"
                style={{
                  fontSize: 16, // Increased from 15
                  fontWeight: 600, // More emphasized
                  letterSpacing: "0.2px",
                }}
              >
                {title}
              </Text>
            </Flex>
            {tooltip && (
              <Tooltip title={tooltip} placement="topRight" arrow>
                <div className="tooltip-trigger">
                  <InfoCircleOutlined />
                </div>
              </Tooltip>
            )}
          </Flex>

          {/* --- Bottom Section: The Big Number & Subtitle --- */}
          <Flex vertical style={{ marginTop: 28 }}>
            <Flex align="baseline" gap={8} wrap="wrap">
              <Text
                style={{
                  fontSize: 52, // Increased from 42
                  fontWeight: 900, // Much bolder for emphasis
                  letterSpacing: "-2px",
                  color: token.colorText,
                  lineHeight: 1,
                  display: "inline-block",
                  textShadow: "var(--value-text-shadow)", // Use CSS variable for text shadow
                }}
              >
                {value}
              </Text>
              {unit && (
                <Text
                  type="secondary"
                  style={{
                    fontSize: 18, // Increased from 16
                    fontWeight: 700,
                    position: "relative",
                    top: "-6px",
                  }}
                >
                  {unit}
                </Text>
              )}
            </Flex>

            {/* 🟢 แสดง Subtitle ด้านล่างของตัวเลขหลัก */}
            {subtitle && (
              <Text
                type="secondary"
                style={{
                  fontSize: 14, // Increased from 13
                  marginTop: 6,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  opacity: 0.85,
                }}
              >
                {subtitle}
              </Text>
            )}
          </Flex>
        </Flex>
      </Card>

      {/* --- Styles --- */}
      <style jsx>{`
        :global(.metric-first-card) {
          border-radius: 24px !important; // More rounded
          border: 1px solid var(--border-color) !important;
          background-color: var(--bg-color) !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          overflow: hidden;
          position: relative;
        }

        :global(.dark .metric-first-card) {
          --value-text-shadow: 0 0 20px var(--theme-color-bg);
        }

        :global(.metric-first-card:hover) {
          border-color: var(--theme-color) !important;
          background-color: var(--theme-color-hover) !important;
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.12) !important;
          transform: translateY(-4px);
        }

        :global(.dark .metric-first-card:hover) {
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.4) !important;
          background-color: var(
            --theme-color-bg
          ) !important; // Slightly deeper highlight in dark mode
        }

        :global(.metric-first-card::before) {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background-color: var(--theme-color);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        :global(.metric-first-card:hover::before) {
          opacity: 1;
        }

        .metric-icon {
          width: 40px; // Increased from 32
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: var(--theme-color);
          background-color: var(--theme-color-bg);
          box-shadow: 0 4px 8px -2px var(--theme-color-bg);
          transition: all 0.3s ease;
        }

        :global(.metric-first-card:hover) .metric-icon {
          transform: scale(1.1) rotate(-5deg);
        }

        .tooltip-trigger {
          color: ${token.colorTextQuaternary};
          font-size: 14px;
          cursor: help;
          padding: 6px;
          border-radius: 50%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tooltip-trigger:hover {
          color: var(--theme-color);
          background-color: var(--theme-color-bg);
        }
      `}</style>
    </>
  );
};

export default SummaryCard;
