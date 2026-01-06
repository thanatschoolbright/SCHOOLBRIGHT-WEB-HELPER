"use client";

import React from "react";
import { ReloadOutlined, UserOutlined, TeamOutlined } from "@ant-design/icons";
import { Button, Space, Typography, Flex, theme, Avatar } from "antd";

const { Title, Text } = Typography;

interface HeaderProps {
  title: string;
  subtitle: string;
  refreshLabel: string;
  onRefresh: () => void;
}

export const HeaderSection = ({
  title,
  subtitle,
  refreshLabel,
  onRefresh,
}: HeaderProps) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        padding: "16px 0",
        marginBottom: 8,
      }}
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
        {/* Left Side: Title & Description */}
        <Space size={20} align="start">
          <Avatar
            size={54}
            shape="square"
            icon={<TeamOutlined style={{ fontSize: 28 }} />}
            style={{
              backgroundColor: token.colorPrimaryBg,
              color: token.colorPrimary,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${token.colorPrimaryBorder}`,
            }}
          />
          <Flex vertical gap={4}>
            <Title
              level={2}
              style={{
                margin: 0,
                letterSpacing: "-0.02em",
                fontWeight: 800,
                fontSize: 28,
              }}
            >
              {title}
            </Title>
            <Text
              type="secondary"
              style={{
                fontSize: 15,
                color: token.colorTextDescription,
              }}
            >
              {subtitle}
            </Text>
          </Flex>
        </Space>

        {/* Right Side: Actions */}
        <Space>
          <Button
            size="large"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            style={{
              borderRadius: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            {refreshLabel}
          </Button>
        </Space>
      </Flex>
    </div>
  );
};
