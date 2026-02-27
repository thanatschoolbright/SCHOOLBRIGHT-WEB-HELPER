"use client";

import React from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Card, Flex, Skeleton, Tooltip, Typography, theme } from "antd";

const { Text } = Typography;

export interface SummaryCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
  tooltip?: string;
  isLoading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  unit,
  icon,
  color,
  tooltip,
  isLoading = false,
}) => {
  const { token } = theme.useToken();
  const themeColor = color || token.colorPrimary;

  if (isLoading) {
    return (
      <Card
        styles={{ body: { padding: 24 } }}
        style={{
          borderRadius: 20, // โค้งมนขึ้นอีกนิดให้ดู Modern
          border: `1px solid ${token.colorBorderSecondary}`,
          height: "100%",
          minHeight: 140, // ล็อคความสูงขั้นต่ำไว้
        }}
        bordered={false}
      >
        <Flex
          vertical
          justify="space-between"
          style={{ height: "100%", gap: 24 }}
        >
          <Flex align="center" gap={12}>
            <Skeleton.Avatar
              active
              shape="square"
              size={32}
              style={{ borderRadius: 8 }}
            />
            <Skeleton active paragraph={false} title={{ width: 120 }} />
          </Flex>
          <Skeleton
            active
            paragraph={false}
            title={{ width: "80%", height: 40 }}
          />
        </Flex>
      </Card>
    );
  }

  return (
    <>
      <Card
        className="metric-first-card"
        style={
          {
            "--theme-color": themeColor,
            "--theme-color-bg": `${themeColor}15`, // สีพื้นหลัง Icon 15%
            "--theme-color-hover": `${themeColor}08`, // สีพื้นหลัง Card ตอน Hover 8%
            "--border-color": token.colorBorderSecondary,
            "--bg-color": token.colorBgContainer,
          } as React.CSSProperties
        }
        styles={{
          body: {
            padding: "24px 24px 20px 24px", // ปรับ Padding ด้านล่างให้แคบลงนิดนึงเพื่อรับกับตัวเลขใหญ่
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

          {/* --- Bottom Section: The Big Number --- */}
          <Flex align="baseline" gap={8} style={{ marginTop: 24 }}>
            <Text
              style={{
                fontSize: 42, // ขยายใหญ่ตะโกน!
                fontWeight: 800, // หนาพิเศษ
                letterSpacing: "-1px", // บีบช่องไฟนิดนึงให้ดูแน่นและ Modern
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
        </Flex>
      </Card>

      <style jsx>{`
        :global(.metric-first-card) {
          border-radius: 20px !important; /* มนขึ้น */
          border: 1px solid var(--border-color) !important;
          background-color: var(--bg-color);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          overflow: hidden;
          position: relative;
        }

        /* Hover Effect: เปลี่ยนสีกรอบและถมพื้นหลังจางๆ ด้วยสี Theme */
        :global(.metric-first-card:hover) {
          border-color: var(--theme-color) !important;
          background-color: var(--theme-color-hover) !important;
          box-shadow: 0 8px 24px -12px rgba(0, 0, 0, 0.1) !important;
          transform: translateY(-2px);
        }

        /* เพิ่มเส้น Accent Line บางๆ ด้านบนสุดของการ์ด 
          ช่วยเน้นสายตาว่าการ์ดนี้มีความสำคัญระดับไหน 
        */
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
          opacity: 1; /* แสดงเส้นสีตอน Hover */
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
