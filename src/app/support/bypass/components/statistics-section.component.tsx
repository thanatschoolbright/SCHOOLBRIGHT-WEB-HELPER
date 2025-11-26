import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { Statistics } from "../types/bypass.types";

type StatisticsSectionProps = {
  statistics: Statistics;
};

export default function StatisticsSection({
  statistics,
}: StatisticsSectionProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  return (
    <Row gutter={[16, 16]}>
      {/* Total Schools */}
      <Col xs={24} sm={12} md={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title={TRANSLATION("bypass_page.stat_total_schools")}
            value={statistics.total}
            prefix={<BankOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>

      {/* Active Schools */}
      <Col xs={24} sm={12} md={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title={TRANSLATION("bypass_page.stat_active")}
            value={statistics.active}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>

      {/* Inactive Schools */}
      <Col xs={24} sm={12} md={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title={TRANSLATION("bypass_page.stat_inactive")}
            value={statistics.inactive}
            prefix={<CloseCircleOutlined />}
            valueStyle={{ color: "#ff4d4f" }}
          />
        </Card>
      </Col>

      {/* Grade A Schools */}
      <Col xs={24} sm={12} md={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title={TRANSLATION("bypass_page.stat_grade_a")}
            value={statistics.gradeA}
            prefix={<CrownOutlined />}
            valueStyle={{ color: "#faad14" }}
          />
        </Card>
      </Col>
    </Row>
  );
}
