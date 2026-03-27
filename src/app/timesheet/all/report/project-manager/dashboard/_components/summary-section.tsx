"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import SummaryCard from "@components/card/summary-card";
import { Col, Row } from "antd";
import React from "react";
import { usePMDashboardStore } from "../_state/use-pm-dashboard-store";

/**
 * ✨ ส่วนแสดงบัตรสรุปข้อมูล (Summary Tiles)
 */
const SummarySection: React.FC = () => {
  const { summary, isLoading } = usePMDashboardStore();

  const metrics = [
    {
      title: "โครงการทั้งหมด",
      value: summary?.total_projects || 0,
      unit: "โครงการ",
      icon: <ProjectOutlined />,
      color: "#1890ff",
    },
    {
      title: "ชั่วโมงทำงานรวม",
      value: summary?.total_hours || 0,
      unit: "ชม.",
      icon: <ClockCircleOutlined />,
      color: "#52c41a",
    },
    {
      title: "ฟีเจอร์ที่บันทึก",
      value: summary?.total_features || 0,
      unit: "ชิ้น",
      icon: <CheckCircleOutlined />,
      color: "#722ed1",
    },
    {
      title: "ความคืบหน้าภาพรวม",
      value: summary?.avg_completion || 0,
      unit: "%",
      icon: <RiseOutlined />,
      color: "#faad14",
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {metrics.map((item, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <SummaryCard
            title={item.title}
            value={item.value}
            unit={item.unit}
            icon={item.icon}
            color={item.color}
            isLoading={isLoading}
          />
        </Col>
      ))}
    </Row>
  );
};

export default SummarySection;
