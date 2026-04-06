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
import { useTimelineStore } from "../_stores/timeline-store";

const SummarySection: React.FC = () => {
  const { getSummaryMetrics, isFetching } = useTimelineStore();
  const summaryMetrics = getSummaryMetrics();

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="จำนวนโครงการทั้งหมด"
          value={summaryMetrics.totalProjects}
          unit="โครงการ"
          icon={<ProjectOutlined />}
          isLoading={isFetching}
        />
      </Col>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="โครงการที่เปิดอยู่"
          value={summaryMetrics.activeProjects}
          unit="โครงการ"
          icon={<RocketOutlined />}
          color="#52c41a"
          isLoading={isFetching}
        />
      </Col>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="จำนวนโครงการย่อย"
          value={summaryMetrics.totalFeatures}
          unit="โครงการย่อย"
          icon={<PicCenterOutlined />}
          color="#1890ff"
          isLoading={isFetching}
        />
      </Col>
    </Row>
  );
};

export default SummarySection;
