"use client";

import React from "react";
import { Col, Row, Typography, Card, Flex, Tooltip } from "antd";
import {
  ProjectOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { TimelineMetrics } from "../types/timeline.types";

const { Text, Title } = Typography;

interface MetricSummaryProps {
  metrics: TimelineMetrics;
  loading?: boolean;
}

export const MetricSummaryComponent: React.FC<MetricSummaryProps> = ({
  metrics,
  loading = false,
}) => {
  // กำหนดชุดข้อมูล Metrics ตามสไตล์ที่คุณชอบ
  const metricItems = [
    {
      label: "โครงการทั้งหมด",
      value: metrics.totalProjects,
      color: "#3b82f6", // Blue
      icon: <ProjectOutlined />,
      desc: "จำนวนโปรเจกต์หลัก",
      tooltip: "จำนวนโครงการทั้งหมดที่อยู่ในระบบการจัดการ",
    },
    {
      label: "โครงการย่อย",
      value: metrics.totalSubProjects,
      color: "#8b5cf6", // Purple
      icon: <AppstoreOutlined />,
      desc: "งานย่อยภายใต้โครงการ",
      tooltip: "โครงการย่อย (Sub-projects) ที่ถูกแตกแขนงออกมา",
    },
    {
      label: "กำลังดำเนินการ",
      value: metrics.inProgress,
      color: "#f59e0b", // Orange
      icon: <SyncOutlined spin={!loading} />,
      desc: "ยังไม่เสร็จสิ้น",
      tooltip: "รายการโครงการที่อยู่ในขั้นตอนการปฏิบัติงาน",
    },
    {
      label: "เสร็จสมบูรณ์",
      value: metrics.completed,
      color: "#22c55e", // Green
      icon: <CheckCircleOutlined />,
      desc: "ปิดโครงการแล้ว",
      tooltip: "โครงการที่ดำเนินการเสร็จสิ้น 100%",
    },
    {
      label: "เกินกำหนด",
      value: metrics.overdue,
      color: "#ef4444", // Red
      icon: <WarningOutlined />,
      desc: "ต้องเร่งดำเนินการ",
      tooltip: "โครงการที่เลยระยะเวลาที่กำหนด (Overdue)",
    },
  ];

  return (
    <div className="mb-6">
      <Row gutter={[16, 16]}>
        {metricItems.map((item, idx) => (
          <Col xs={24} sm={12} md={idx === 0 ? 4 : 5} key={idx}>
            <Tooltip title={item.tooltip} placement="bottom">
              <Card
                className="shadow-sm border-0 rounded-xl overflow-hidden relative h-full"
                bodyStyle={{ padding: "20px 16px" }}
              >
                {/* 1. Watermark Icon (ลูกเล่นที่คุณชอบ) */}
                <div
                  className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12"
                  style={{ pointerEvents: "none" }}
                >
                  <span style={{ fontSize: "5rem", color: item.color }}>
                    {item.icon}
                  </span>
                </div>

                <Flex align="center" gap={12}>
                  {/* 2. Small Icon Box */}
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl flex-shrink-0"
                    style={{
                      backgroundColor: `${item.color}15`,
                      color: item.color,
                    }}
                  >
                    {item.icon}
                  </div>

                  {/* 3. Text Section */}
                  <div className="z-10 overflow-hidden">
                    <Text
                      type="secondary"
                      className="block text-xs uppercase font-bold tracking-wider"
                    >
                      {item.label}
                    </Text>
                    <div className="flex items-baseline gap-1">
                      <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                        {loading ? "..." : item.value}
                      </Title>
                    </div>
                    <Text type="secondary" style={{ fontSize: "10px" }}>
                      {item.desc}
                    </Text>
                  </div>
                </Flex>
              </Card>
            </Tooltip>
          </Col>
        ))}
      </Row>
    </div>
  );
};
