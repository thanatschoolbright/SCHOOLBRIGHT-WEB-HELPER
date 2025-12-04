"use client";

import React from "react";
import { Row, Col, Card } from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { OvertimeStats } from "../types/overtime.types";
import { SummaryCard } from "./summary-card.component";

interface SummaryCardsProps {
  stats: OvertimeStats;
  loading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  stats,
  loading,
}) => {
  const { t } = useTranslation();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8}>
        <SummaryCard
          title={t("overtime_page.total_requests")}
          value={stats.total}
          subValue={t("overtime_page.total_requests_sub")}
          icon={<FileTextOutlined />}
          color="#1890ff"
          loading={loading}
        />
      </Col>
      <Col xs={24} sm={12} md={8}>
        <SummaryCard
          title={t("overtime_page.pending_requests")}
          value={stats.pending}
          subValue={t("overtime_page.pending_page_note")}
          icon={<ClockCircleOutlined />}
          color="#faad14"
          loading={loading}
        />
      </Col>
      <Col xs={24} sm={12} md={8}>
        <SummaryCard
          title={t("overtime_page.approved_requests")}
          value={stats.approved}
          subValue={t("overtime_page.approved_page_note")}
          icon={<CheckCircleOutlined />}
          color="#52c41a"
          loading={loading}
        />
      </Col>
    </Row>
  );
};
