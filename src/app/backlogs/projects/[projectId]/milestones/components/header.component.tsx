"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import React from "react";

type HeaderProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
};

export const HeaderComponent: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
}) => (
  <Space direction="vertical" size={12} style={{ width: "100%" }}>
    <Button
      icon={<ArrowLeftOutlined />}
      onClick={onBack}
      size="large"
      type="text"
      style={{ alignSelf: "flex-start" }}
    >
      {subtitle}
    </Button>
    <Typography.Title level={3} style={{ margin: 0 }}>
      {title}
    </Typography.Title>
  </Space>
);
