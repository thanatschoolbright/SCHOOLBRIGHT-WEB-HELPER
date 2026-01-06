"use client";
import React from "react";
import { Row, Col, Typography, theme, Space } from "antd";

const { Title, Text } = Typography;

export type HeaderBarProps = {
  icon: React.ReactNode;
  title: string;
  subTitle?: string;
  extra?: React.ReactNode;
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  icon,
  title,
  subTitle,
  extra,
}) => {
  const { token } = theme.useToken();

  // สไตล์เน้นความโปร่งโล่ง (Clean & Flat)
  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "8px 0", // ใช้ Padding เล็กน้อย ไม่ใช้พื้นหลังสี
    background: "transparent", // ถอดสีพื้นหลังทั้งหมด
    boxShadow: "none", // ห้ามมี Shadow
    border: "none", // ห้ามมี Border
    position: "relative",
  };

  return (
    <Row
      align="middle"
      justify="space-between"
      style={{
        marginBottom: token.marginLG,
        paddingBottom: 16,
        borderBottom: `1px solid ${token.colorSplit}`, // ใช้เส้นแบ่งบางๆ แทนการใช้กล่อง
      }}
    >
      <Col flex="auto">
        <div role="banner" aria-label={title} style={containerStyle}>
          {/* Icon Section - ถอด Shadow และ Background ออก */}
          <div
            style={{
              color: token.colorPrimary,
              fontSize: 32, // ปรับขนาดไอคอนให้ดูเด่นขึ้นทดแทนสีพื้น
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>

          {/* Text Section - ภาษาไทย 100% */}
          <Space direction="vertical" size={0} style={{ flex: 1 }}>
            <Title
              level={2}
              style={{
                margin: 0,
                color: token.colorTextHeading,
                fontWeight: 600,
                letterSpacing: "-0.5px",
              }}
            >
              {title}
            </Title>
            {subTitle && (
              <Text
                type="secondary"
                style={{
                  fontSize: token.fontSize,
                }}
              >
                {subTitle}
              </Text>
            )}
          </Space>
        </div>
      </Col>

      {/* Action Section ด้านขวา */}
      {extra && (
        <Col>
          <div style={{ marginLeft: 16 }}>{extra}</div>
        </Col>
      )}
    </Row>
  );
};

HeaderBar.displayName = "HeaderBar";
