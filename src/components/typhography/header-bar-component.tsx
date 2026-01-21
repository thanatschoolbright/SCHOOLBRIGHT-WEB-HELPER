"use client";

import React from "react";
import { Row, Col, Typography, theme, Space, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export type HeaderBarProps = {
  icon: React.ReactNode;
  title: string;
  subTitle?: string;
  extra?: React.ReactNode;
  showBackButton?: boolean;
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  icon,
  title,
  subTitle,
  extra,
  showBackButton = false,
}) => {
  const { token } = theme.useToken();
  const router = useRouter();

  return (
    <div
      style={{
        marginBottom: token.marginLG,
        paddingBottom: 20,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: "transparent",
      }}
    >
      <Row
        align="middle"
        justify="space-between"
        gutter={[16, 16]}
        wrap={false}
      >
        <Col flex="auto">
          <Space size={20} align="start">
            {/* Back Button */}
            {showBackButton && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                style={{
                  height: 48,
                  width: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  borderRadius: 12,
                  background: token.colorFillTertiary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              />
            )}

            <Space size={16} align="start">
              {/* Minimal Clean Icon Container */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: token.colorPrimary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 24,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {icon}
              </div>

              {/* Typography Section */}
              <Space direction="vertical" size={2}>
                <Title
                  level={2}
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: 24,
                    letterSpacing: "0.02em",
                    color: token.colorTextHeading,
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </Title>
                {subTitle && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 14,
                      fontWeight: 400,
                      color: token.colorTextDescription,
                    }}
                  >
                    {subTitle}
                  </Text>
                )}
              </Space>
            </Space>
          </Space>
        </Col>

        {/* Extra Actions - Always on the right side */}
        {extra && (
          <Col flex="none">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {extra}
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
};

HeaderBar.displayName = "HeaderBar";
