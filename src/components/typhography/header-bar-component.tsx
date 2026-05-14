"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  ConfigProvider,
  Flex,
  Grid,
  Typography,
  theme,
} from "antd";
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

/**
 * Component สำหรับส่วนหัวของหน้าจอ (Header Bar)
 * ปรับปรุงโดยใช้ Ant Design Components 100% และกำจัด CSS Inline
 */
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

  // ตรวจสอบสถานะ Mobile (หน้าจอเล็กกว่า md)
  const isMobile = !screens.md;

  const iconSize = isMobile ? 44 : 52;

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            controlHeight: isMobile ? 36 : 40,
            borderRadius: 999,
          },
          Typography: {
            titleMarginBottom: 0,
            titleMarginTop: 0,
          },
        },
      }}
    >
      <Flex
        vertical
        style={{
          marginBottom: token.marginLG,
          paddingBottom: isMobile ? 12 : 16,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Flex
          justify="space-between"
          align={isMobile ? "flex-start" : "center"}
          gap="middle"
          wrap="wrap"
        >
          {/* ส่วนซ้าย: ปุ่มย้อนกลับ + ไอคอน + ข้อความ */}
          <Flex gap={isMobile ? 10 : 14} align="center" flex={1}>
            {/* 1. ปุ่มย้อนกลับ (Back Button) */}
            {showBackButton && (
              <Button
                icon={<ArrowLeftOutlined style={{ fontSize: 14 }} />}
                onClick={() => router.back()}
                style={{
                  backgroundColor: "transparent",
                  border: `1px solid ${token.colorBorder}`,
                  width: isMobile ? 36 : 40,
                  height: isMobile ? 36 : 40,
                  flexShrink: 0,
                  boxShadow: "none",
                }}
              />
            )}

            <Flex gap={isMobile ? 12 : 16} align="center">
              {/* 2. ไอคอนหลัก (Primary Icon) */}
              <div
                style={{
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <Avatar
                  shape="square"
                  size={iconSize}
                  icon={
                    <span
                      style={{
                        fontSize: isMobile ? 20 : 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: token.colorPrimary,
                      }}
                    >
                      {icon}
                    </span>
                  }
                  style={{
                    background: token.colorFillAlter,
                    borderRadius: 12,
                    border: `1px solid ${token.colorBorder}`,
                    position: "relative",
                    zIndex: 1,
                  }}
                />
              </div>

              {/* 3. ส่วนข้อความ (Typography) */}
              <Flex vertical gap={isMobile ? 1 : 3}>
                <Title
                  level={isMobile ? 4 : 3}
                  ellipsis
                  style={{
                    fontWeight: 700,
                    lineHeight: 1.25,
                    letterSpacing: "-0.01em",
                    margin: 0,
                    color: token.colorText,
                  }}
                >
                  {title}
                </Title>
                {subTitle && (
                  <Flex align="center" gap={6}>
                    <Text
                      type="secondary"
                      ellipsis
                      style={{ fontSize: isMobile ? 12 : 13, lineHeight: 1.4 }}
                    >
                      {subTitle}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Flex>

          {/* ส่วนขวา: Extra Actions */}
          {extra && (
            <Flex
              align="center"
              justify={isMobile ? "flex-start" : "flex-end"}
              style={{
                width: isMobile ? "100%" : "auto",
                paddingLeft: isMobile && (showBackButton || icon) ? 60 : 0,
              }}
            >
              {extra}
            </Flex>
          )}
        </Flex>
      </Flex>
    </ConfigProvider>
  );
};

HeaderBar.displayName = "HeaderBar";
