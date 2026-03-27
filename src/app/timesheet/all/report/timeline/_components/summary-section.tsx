// ✨ Component สำหรับแสดงการสรุปตัวเลข (Metrics Area)
"use client";

import SummaryCard from "@/components/card/summary-card";
import {
  PicCenterOutlined,
  ProjectOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { Col, Row } from "antd";
import React from "react";
import { useTimelineStore } from "../_state/timeline-store";

const SummarySection: React.FC = () => {
  const { getMetrics, isLoading } = useTimelineStore();
  const metrics = getMetrics();

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="จำนวนโครงการทั้งหมด"
          value={metrics.totalProjects}
          unit="โครงการ"
          icon={<ProjectOutlined />}
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="โครงการที่เปิดอยู่"
          value={metrics.activeProjects}
          unit="โครงการ"
          icon={<RocketOutlined />}
          color="#52c41a"
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="จำนวนโครงการย่อยย่อย"
          value={metrics.totalFeatures}
          unit="โครงการย่อย"
          icon={<PicCenterOutlined />}
          color="#1890ff"
          isLoading={isLoading}
        />
      </Col>
    </Row>
  );
};

export default SummarySection;
