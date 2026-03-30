"use client";

import {
  CheckCircleOutlined,
  FileTextOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import SummaryCard from "@/components/card/summary-card";
import { Col, Row, theme } from "antd";
import type { SummaryStats } from "../_types/all-issues.types";

interface SummaryCardsProps {
  stats: SummaryStats;
  loading: boolean;
}

export function SummaryCards({ stats, loading }: SummaryCardsProps) {
  const { token } = theme.useToken();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="จำนวนงานทั้งหมด"
          value={stats.total}
          subtitle="รายการในระบบ (ทุกโปรเจกต์)"
          icon={<FileTextOutlined />}
          color={token.colorPrimary}
          isLoading={loading}
        />
      </Col>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="งานที่เสร็จสิ้น"
          value={stats.closed}
          subtitle="รายการที่ปิดงานแล้ว"
          icon={<CheckCircleOutlined />}
          color={token.colorSuccess}
          isLoading={loading}
        />
      </Col>
      <Col xs={24} sm={8}>
        <SummaryCard
          title="อัตราความสำเร็จ"
          value={`${stats.progress}%`}
          subtitle="เปอร์เซ็นต์รวมทุกโปรเจกต์"
          icon={<TrophyOutlined />}
          color="#faad14"
          isLoading={loading}
        />
      </Col>
    </Row>
  );
}
