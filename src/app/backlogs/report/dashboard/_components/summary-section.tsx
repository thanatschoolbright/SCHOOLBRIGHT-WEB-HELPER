"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import SummaryCard from "@components/card/summary-card";
import { Col, Row, theme } from "antd";
import { useBacklogDashboardStore } from "../_state/use-backlog-dashboard-store";

/**
 * แสดงการ์ดสรุปข้อมูลสถิติรวม
 */
export const SummarySection = () => {
  const { token } = theme.useToken();
  const { getTotalStats, loading } = useBacklogDashboardStore();
  const stats = getTotalStats();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="จำนวนงานที่พบทั้งหมด"
          value={stats.total}
          icon={<FileTextOutlined />}
          color={token.colorPrimary}
          suffix="งาน"
          isLoading={loading}
        />
      </Col>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="ปิดงานแล้ว (Closed)"
          value={stats.closed}
          icon={<CheckCircleOutlined />}
          color={token.colorSuccess}
          suffix="งาน"
          isLoading={loading}
        />
      </Col>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="งานคงค้าง (Open/Pending)"
          value={stats.total - stats.closed}
          icon={<ClockCircleOutlined />}
          color={token.colorError}
          suffix="งาน"
          isLoading={loading}
        />
      </Col>
    </Row>
  );
};
