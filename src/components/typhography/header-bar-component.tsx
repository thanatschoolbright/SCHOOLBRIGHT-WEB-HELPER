"use client";
import React from "react";
import { Avatar, Row, Col, Typography, theme, Tooltip, Space } from "antd";

// Define Colors
export type HeaderBarColor =
  | "purple"
  | "orange"
  | "blue"
  | "green"
  | "red"
  | "pink"
  | "none"
  | "teal";

export type HeaderBarProps = {
  icon: React.ReactNode;
  title: string;
  subTitle?: string;
  color?: HeaderBarColor;
  extra?: React.ReactNode; // เพิ่มช่องสำหรับปุ่ม Action ด้านขวา (เผื่ออนาคต)
};

// Modern Gradients (Adjusted for better contrast)
const GRADIENTS: Record<HeaderBarColor, string> = {
  purple: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  orange: "linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)", // ปรับให้สดขึ้น
  blue: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
  green: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  red: "linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)",
  pink: "linear-gradient(135deg, #ec008c 0%, #fc6767 100%)",
  teal: "linear-gradient(135deg, #1D976C 0%, #93F9B9 100%)",
  none: "transparent",
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  icon,
  title,
  subTitle,
  color = "purple",
  extra,
}) => {
  const { token } = theme.useToken();
  const isNone = color === "none";

  // Dynamic Styles based on Theme Token
  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 16,
    borderRadius: token.borderRadiusLG, // ใช้ Token เพื่อความโค้งที่เท่ากันทั้ง App
    padding: "20px 24px",
    background: isNone ? token.colorBgContainer : GRADIENTS[color],
    boxShadow: isNone
      ? "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)" // Soft shadow for white bg
      : "0 10px 20px -10px rgba(0, 0, 0, 0.35)", // Deep shadow for colored bg
    border: isNone ? `1px solid ${token.colorSplit}` : "none",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease",
  };

  // Text Colors
  const titleColor = isNone ? token.colorTextHeading : "#ffffff";
  const subTitleColor = isNone
    ? token.colorTextSecondary
    : "rgba(255, 255, 255, 0.85)";

  return (
    <Row
      align="middle"
      justify="space-between"
      style={{ marginBottom: token.marginLG }}
    >
      <Col span={24}>
        <div role="banner" aria-label={title} style={containerStyle}>
          {/* Decorative Circle Background (Optional for depth) */}
          {!isNone && (
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: "rgba(255,255,255,0.1)",
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Icon Section */}
          <Avatar
            size={64}
            shape="square" // เราจะ Override border-radius เองเพื่อให้ดู Modern กว่า square ปกติ
            style={{
              backgroundColor: isNone
                ? token.colorFillAlter
                : "rgba(255, 255, 255, 0.2)", // Glass effect
              backdropFilter: isNone ? "none" : "blur(8px)",
              color: isNone ? token.colorPrimary : "#ffffff",
              borderRadius: token.borderRadius, // Soft rounded corners
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28, // Icon size
            }}
          >
            {icon}
          </Avatar>

          {/* Text Section */}
          <Space direction="vertical" size={2} style={{ flex: 1 }}>
            <Typography.Title
              level={3} // ใหญ่ขึ้นเล็กน้อยเพื่อความชัดเจน
              style={{
                margin: 0,
                color: titleColor,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.5px",
              }}
            >
              {title}
            </Typography.Title>
            {subTitle && (
              <Typography.Text
                style={{
                  color: subTitleColor,
                  fontSize: token.fontSize,
                  fontWeight: 500,
                }}
              >
                {subTitle}
              </Typography.Text>
            )}
          </Space>

          {/* Extra / Actions Section */}
          {extra && <div>{extra}</div>}
        </div>
      </Col>
    </Row>
  );
};

HeaderBar.displayName = "HeaderBar";
