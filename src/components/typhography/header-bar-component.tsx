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

  return (
    <div
      style={{
        marginBottom: token.marginLG,
        paddingBottom: 20,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: "transparent",
      }}
    >
      <Row align="middle" justify="space-between" gutter={[16, 16]}>
        <Col flex="auto">
          <Space size={16} align="center">
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
        </Col>

        {/* Extra Actions */}
        {extra && (
          <Col xs={24} sm="auto">
            <div
              style={{
                display: "flex",
                alignItems: "center",
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
