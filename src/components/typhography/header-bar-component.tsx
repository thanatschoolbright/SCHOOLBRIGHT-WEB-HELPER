"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Flex, Grid, Typography, theme } from "antd";
import { useRouter } from "next/navigation";
import React from "react";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();

  const isMobile = !screens.md;

  return (
    <Flex
      vertical
      style={{
        marginBottom: token.marginLG,
        paddingBottom: isMobile ? 12 : 20,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex
        justify="space-between"
        align={isMobile ? "flex-start" : "center"}
        gap={16}
        wrap="wrap"
      >
        <Flex
          gap={isMobile ? 12 : 20}
          align="start"
          style={{ flex: 1, minWidth: 0 }}
        >
          {/* Back Button */}
          {showBackButton && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              style={{
                height: isMobile ? 40 : 48,
                width: isMobile ? 40 : 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? 18 : 20,
                borderRadius: 12,
                background: token.colorFillTertiary,
                border: `1px solid ${token.colorBorderSecondary}`,
                flexShrink: 0,
              }}
            />
          )}

          <Flex gap={16} align="start" style={{ minWidth: 0 }}>
            {/* Minimal Clean Icon Container */}
            <Flex
              align="center"
              justify="center"
              style={{
                width: isMobile ? 40 : 48,
                height: isMobile ? 40 : 48,
                borderRadius: 12,
                background: token.colorPrimary,
                color: "#fff",
                fontSize: isMobile ? 20 : 24,
                flexShrink: 0,
                marginTop: isMobile ? 0 : 2,
              }}
            >
              {icon}
            </Flex>

            {/* Typography Section */}
            <Flex vertical gap={2} style={{ minWidth: 0 }}>
              <Title
                level={2}
                ellipsis
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: isMobile ? 20 : 24,
                  letterSpacing: "0.01em",
                  color: token.colorTextHeading,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Title>
              {subTitle && (
                <Text
                  type="secondary"
                  ellipsis
                  style={{
                    fontSize: isMobile ? 12 : 14,
                    fontWeight: 400,
                    color: token.colorTextDescription,
                  }}
                >
                  {subTitle}
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>

        {/* Extra Actions - Responsive layout */}
        {extra && (
          <Flex
            align="center"
            justify={isMobile ? "flex-start" : "flex-end"}
            style={{
              width: isMobile ? "100%" : "auto",
              marginTop: isMobile ? 8 : 0,
              paddingLeft:
                isMobile && (showBackButton || icon)
                  ? showBackButton
                    ? 52
                    : 56
                  : 0,
            }}
          >
            {extra}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

HeaderBar.displayName = "HeaderBar";
