"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  ConfigProvider,
  Divider,
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

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            // คุมขนาดปุ่มย้อนกลับผ่าน Token แทนการระบุ CSS
            controlHeight: isMobile ? 40 : 48,
            borderRadius: 12,
          },
          Typography: {
            // กำหนด Margin ของ Title เป็น 0 ทั่วทั้ง Component นี้
            titleMarginBottom: 0,
            titleMarginTop: 0,
          },
        },
      }}
    >
      <Flex vertical style={{ marginBottom: token.marginLG }}>
        <Flex
          justify="space-between"
          align={isMobile ? "flex-start" : "center"}
          gap="middle"
          wrap="wrap"
        >
          {/* ส่วนซ้าย: ปุ่มย้อนกลับ + ไอคอน + ข้อความ */}
          <Flex gap={isMobile ? "small" : "middle"} align="start" flex={1}>
            {/* 1. ปุ่มย้อนกลับ (Back Button) */}
            {showBackButton && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                style={{
                  backgroundColor: token.colorFillTertiary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              />
            )}

            <Flex gap="middle" align="start">
              {/* 2. ไอคอนหลัก (Primary Icon) */}
              <Avatar
                shape="square"
                size={isMobile ? 40 : 48}
                icon={icon}
                style={{
                  backgroundColor: token.colorPrimary,
                  borderRadius: 12,
                }}
              />

              {/* 3. ส่วนข้อความ (Typography) */}
              <Flex vertical gap={isMobile ? 0 : 4}>
                <Title
                  level={isMobile ? 4 : 2}
                  ellipsis
                  style={{ fontWeight: 700, lineHeight: 1.2 }}
                >
                  {title}
                </Title>
                {subTitle && (
                  <Text type="secondary" size="small" ellipsis>
                    {subTitle}
                  </Text>
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
                // ขยับให้ตรงกับข้อความเมื่ออยู่ใน Mobile Mode
                paddingLeft: isMobile && (showBackButton || icon) ? 56 : 0,
              }}
            >
              {extra}
            </Flex>
          )}
        </Flex>

        {/* เส้นคั่นด้านล่าง (Border Bottom) */}
        <Divider style={{ marginBlock: isMobile ? 12 : 20 }} />
      </Flex>
    </ConfigProvider>
  );
};

HeaderBar.displayName = "HeaderBar";
