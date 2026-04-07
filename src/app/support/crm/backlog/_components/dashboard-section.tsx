"use client";

import SummaryCard from "@/components/card/summary-card";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Col, Row } from "antd";
import React from "react";
import type { CrmSummary } from "../_api/crm-api";

interface DashboardSectionProps {
  summary: CrmSummary;
  isLoading: boolean;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  summary,
  isLoading,
}) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8} lg={8} xl={4}>
        <SummaryCard
          title="เคสทั้งหมด"
          value={summary.total}
          icon={<UnorderedListOutlined />}
          color="#1677ff"
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={5}>
        <SummaryCard
          title="รอดำเนินการ"
          value={summary.open}
          icon={<ClockCircleOutlined />}
          color="#faad14"
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={5}>
        <SummaryCard
          title="กำลังดำเนินการ"
          value={summary.in_progress}
          icon={<SyncOutlined />}
          color="#1677ff"
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={5}>
        <SummaryCard
          title="แก้ไขแล้ว"
          value={summary.resolved}
          icon={<CheckCircleOutlined />}
          color="#52c41a"
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={5}>
        <SummaryCard
          title="ปิดเคส"
          value={summary.closed}
          icon={<CloseCircleOutlined />}
          color="#8c8c8c"
          isLoading={isLoading}
        />
      </Col>
    </Row>
  );
};
