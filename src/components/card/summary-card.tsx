"use client";

import React from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Card, Flex, Skeleton, Tooltip, Typography, theme } from "antd";

const { Text } = Typography;

export interface SummaryCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: React.ReactNode; // 🟢 เพิ่ม Prop subtitle (รับเป็น Node เพื่อให้ใส่ Tag/Icon ได้)
  icon?: React.ReactNode;
  color?: string;
  tooltip?: string;
  isLoading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  unit,
  subtitle, // 🟢 ดึง subtitle มาใช้งาน
  icon,
  color,
  tooltip,
  isLoading = false,
}) => {
  const { token } = theme.useToken();
  const themeColor = color || token.colorPrimary;

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
        bordered={false}
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
            "--theme-color-hover": `${themeColor}08`,
            "--border-color": token.colorBorderSecondary,
            "--bg-color": token.colorBgContainer,
          } as React.CSSProperties
        }
        styles={{
          body: {
            padding: "24px 24px 20px 24px",
            height: "100%",
            minHeight: 140,
            display: "flex",
            flexDirection: "column",
          },
        }}
        bordered={false}
      >
        <Flex
          vertical
          justify="space-between"
          style={{ height: "100%", flex: 1 }}
        >
          {/* --- Top Section: Context (Icon + Title) --- */}
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={10}>
              {icon && <div className="metric-icon">{icon}</div>}
              <Text
                type="secondary"
                style={{
                  fontSize: 15,
                  fontWeight: 500,
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
          <Flex vertical style={{ marginTop: 24 }}>
            <Flex align="baseline" gap={8}>
              <Text
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  color: token.colorText,
                  lineHeight: 1,
                }}
              >
                {value}
              </Text>
              {unit && (
                <Text
                  type="secondary"
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    position: "relative",
                    top: "-4px",
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
                  fontSize: 13,
                  marginTop: 4,
                  fontWeight: 400,
                  lineHeight: 1.4,
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
          border-radius: 20px !important;
          border: 1px solid var(--border-color) !important;
          background-color: var(--bg-color);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          overflow: hidden;
          position: relative;
        }

        :global(.metric-first-card:hover) {
          border-color: var(--theme-color) !important;
          background-color: var(--theme-color-hover) !important;
          box-shadow: 0 8px 24px -12px rgba(0, 0, 0, 0.1) !important;
          transform: translateY(-2px);
        }

        :global(.metric-first-card::before) {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background-color: var(--theme-color);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        :global(.metric-first-card:hover::before) {
          opacity: 1;
        }

        .metric-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: var(--theme-color);
          background-color: var(--theme-color-bg);
          box-shadow: 0 2px 4px -2px var(--theme-color-bg);
        }

        .tooltip-trigger {
          color: ${token.colorTextQuaternary};
          font-size: 14px;
          cursor: help;
          padding: 4px;
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
