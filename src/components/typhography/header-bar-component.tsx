"use client";
import React from "react";
import { Avatar, Row, Col, Typography, theme, Tooltip, Space } from "antd";

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
};

const GRADIENTS: Record<HeaderBarColor, string> = {
  purple: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
  orange: "linear-gradient(135deg,#ff9800 0%,#ff5722 100%)",
  blue: "linear-gradient(135deg,#43cea2 0%,#185a9d 100%)",
  green: "linear-gradient(135deg,#56ab2f 0%,#a8e063 100%)",
  red: "linear-gradient(135deg,#ff5858 0%,#f857a6 100%)",
  pink: "linear-gradient(135deg,#ff9a9e 0%,#fad0c4 100%)",
  teal: "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
  none: "transparent",
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  icon,
  title,
  subTitle,
  color = "purple",
}) => {
  const { token } = theme.useToken();

  const background = color === "none" ? token.colorBgElevated : GRADIENTS[color];
  const titleColor = color === "none" ? token.colorText : token.colorWhite;
  const subTitleColor = color === "none" ? token.colorTextSecondary : "rgba(255,255,255,0.9)";

  return (
    <Row align="middle" justify="space-between" gutter={16} style={{ marginBottom: 24 }}>
      <Col flex="auto">
        <div
          role="banner"
          aria-label={title}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderRadius: 12,
            padding: "18px 20px",
            background,
          }}
        >
          <Avatar size={56} shape="square" style={{ background: color === "none" ? token.colorBgElevated : "rgba(255,255,255,0.16)", color: titleColor }}>
            {icon}
          </Avatar>

          <Space direction="vertical" size={0}>
            <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>
              {title}
            </Typography.Title>
            {subTitle && (
              <Typography.Text style={{ color: subTitleColor }}>{subTitle}</Typography.Text>
            )}
          </Space>
        </div>
      </Col>

      <Col>
        <Tooltip title={title}>
          <Typography.Text type="secondary">{/* helper area reserved */}</Typography.Text>
        </Tooltip>
      </Col>
    </Row>
  );
};

HeaderBar.displayName = "HeaderBar";
