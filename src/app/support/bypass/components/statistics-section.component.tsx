import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  TeamOutlined,
  DashboardOutlined,
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
        <Card  className="shadow-sm">
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
        <Card  className="shadow-sm">
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
        <Card  className="shadow-sm">
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
        <Card  className="shadow-sm">
          <Statistic
            title={TRANSLATION("bypass_page.stat_grade_a")}
            value={statistics.gradeA}
            prefix={<CrownOutlined />}
            valueStyle={{ color: "#faad14" }}
          />
        </Card>
      </Col>

      {/* Total Students */}
      <Col xs={24} sm={12} md={6}>
        <Card  className="shadow-sm">
          <Statistic
            title={TRANSLATION("bypass_page.stat_total_students")}
            value={statistics.totalStudents}
            prefix={<TeamOutlined />}
            valueStyle={{ color: "#722ed1" }}
            formatter={(value) =>
              typeof value === "number" ? value.toLocaleString("th-TH") : value
            }
          />
        </Card>
      </Col>

      {/* Average Students per School */}
      <Col xs={24} sm={12} md={6}>
        <Card  className="shadow-sm">
          <Statistic
            title={TRANSLATION("bypass_page.stat_average_students")}
            value={statistics.averageStudentsPerSchool}
            prefix={<DashboardOutlined />}
            precision={2}
            valueStyle={{ color: "#13c2c2" }}
          />
        </Card>
      </Col>

      {/* Active Students */}
      <Col xs={24} sm={12} md={6}>
        <Card  className="shadow-sm">
          <Statistic
            title={TRANSLATION("bypass_page.stat_active_students")}
            value={statistics.activeStudents}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: "#237804" }}
            formatter={(value) =>
              typeof value === "number" ? value.toLocaleString("th-TH") : value
            }
          />
        </Card>
      </Col>
    </Row>
  );
}
