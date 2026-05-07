"use client";

import {
  AndroidOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  AppleOutlined,
} from "@ant-design/icons";
import { Card, Col, Flex, Row, Statistic, Typography, theme } from "antd";

import type { ApplicationRecord } from "@/types/canteen.type";

interface SummaryCardsProps {
  applications: ApplicationRecord[];
  isLoading: boolean;
}

// ✨ แสดงการ์ดสรุปจำนวนแอปพลิเคชันแยกตามแพลตฟอร์ม
export const SummaryCards = ({ applications, isLoading }: SummaryCardsProps) => {
  const { token } = theme.useToken();

  const summaryMetrics = [
    {
      label: "แอปพลิเคชันทั้งหมด",
      value: applications.length,
      color: token.colorPrimary,
      icon: <AppstoreOutlined />,
      description: "รายการโปรเจกต์ในระบบ",
    },
    {
      label: "Android Apps",
      value: applications.filter((app) =>
        app.app_type.toLowerCase().includes("android"),
      ).length,
      color: "#22c55e",
      icon: <AndroidOutlined />,
      description: "แพลตฟอร์ม Android",
    },
    {
      label: "iOS / Apple Apps",
      value: applications.filter(
        (app) =>
          app.app_type.toLowerCase().includes("ios") ||
          app.app_type.toLowerCase().includes("apple"),
      ).length,
      color: token.colorText,
      icon: <AppleOutlined />,
      description: "แพลตฟอร์ม iOS",
    },
    {
      label: "Web / Others",
      value: applications.filter(
        (app) =>
          !app.app_type.toLowerCase().includes("android") &&
          !app.app_type.toLowerCase().includes("ios"),
      ).length,
      color: "#f59e0b",
      icon: <GlobalOutlined />,
      description: "แพลตฟอร์มอื่นๆ",
    },
  ];

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {summaryMetrics.map((metric, index) => (
        <Col xs={24} sm={12} md={6} key={index}>
          <Card
            variant="borderless"
            className="shadow-sm rounded-xl overflow-hidden relative h-full"
          >
            <div
              className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12"
              style={{ pointerEvents: "none" }}
            >
              <span style={{ fontSize: "5rem", color: metric.color }}>
                {metric.icon}
              </span>
            </div>
            <Flex align="center" gap={16}>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl"
                style={{
                  backgroundColor: token.colorFillSecondary,
                  color: metric.color,
                }}
              >
                {metric.icon}
              </div>
              <div className="z-10">
                <Typography.Text
                  type="secondary"
                  className="block text-xs uppercase font-bold tracking-wider"
                >
                  {metric.label}
                </Typography.Text>
                <Statistic
                  value={isLoading ? 0 : metric.value}
                  valueStyle={{ fontWeight: 600, fontSize: 24 }}
                />
                <Typography.Text type="secondary" className="text-xs">
                  {metric.description}
                </Typography.Text>
              </div>
            </Flex>
          </Card>
        </Col>
      ))}
    </Row>
  );
};
