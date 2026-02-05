"use client";

import { ClockCircleOutlined } from "@ant-design/icons";
import {
  Avatar,
  Card,
  ConfigProvider,
  Flex,
  Statistic,
  Typography,
  theme,
} from "antd";
import React from "react";

const { Text } = Typography;

interface TimesheetStatCardProps {
  title: React.ReactNode;
  value: number;
  suffix?: string;
  color?: string;
  loading?: boolean;
  description?: string;
  icon?: React.ReactNode;
}

export const TimesheetStatCard: React.FC<TimesheetStatCardProps> = ({
  title,
  value,
  suffix = "ชั่วโมง",
  color = "#1677ff",
  loading = false,
  description,
  icon,
}) => {
  const { token } = theme.useToken();

  return (
    <ConfigProvider
      theme={{
        components: {
          Card: {
            // ใช้ Token ในการกำหนด Border และ Background แทน Inline Style
            colorBorderSecondary: `${color}20`,
            containerBg: token.colorBgContainer,
          },
        },
      }}
    >
      <Card
        loading={loading}
        // ใช้ styles props (v5) แทน style เพื่อความสะอาด
        styles={{
          body: {
            padding: token.paddingLG,
            // สร้าง Gradient ผ่าน background ของ body แทน
            background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${color}08 100%)`,
            position: "relative",
            overflow: "hidden",
            borderRadius: 24,
          },
        }}
      >
        {/* ใช้ Flex แทนการจัดตำแหน่งด้วย div */}
        <Flex vertical gap="middle">
          {/* ส่วนหัว: ไอคอนและชื่อ */}
          <Flex align="center" gap="small">
            <Avatar
              shape="square"
              size="small"
              icon={icon || <ClockCircleOutlined />}
              style={{
                backgroundColor: `${color}15`,
                color: color,
                borderRadius: 10,
              }}
            />
            <Text strong style={{ color: token.colorTextHeading }}>
              {title}
            </Text>
          </Flex>

          {/* ส่วนค่าสถิติ */}
          <Flex vertical gap={4}>
            <Statistic
              value={value}
              suffix={
                <Text style={{ fontSize: token.fontSize, color: color }}>
                  {suffix}
                </Text>
              }
              valueStyle={{
                color: color,
                fontSize: 28,
                fontWeight: 700,
              }}
            />

            {/* คำอธิบาย */}
            {description && (
              <Text type="secondary" size="small">
                {description}
              </Text>
            )}
          </Flex>
        </Flex>

        {/* ตกแต่งพื้นหลัง (Decorative element)
            ใช้ Avatar ขนาดใหญ่ที่มี blur แทนการวาด div */}
        <Avatar
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            filter: "blur(30px)",
            backgroundColor: color,
            opacity: 0.1,
          }}
          size={100}
        />
      </Card>
    </ConfigProvider>
  );
};
