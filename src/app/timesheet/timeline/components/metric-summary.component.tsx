import React from "react";
import { Card, Col, Row, Statistic } from "antd";
import {
  ProjectOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { TimelineMetrics } from "../types/timeline.types";

interface MetricSummaryProps {
  metrics: TimelineMetrics;
  loading?: boolean;
}

export const MetricSummaryComponent: React.FC<MetricSummaryProps> = ({
  metrics,
  loading = false,
}) => {
  const { t } = useTranslation("translate");

  return (
    <div className="mb-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={4}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title={t("timeline_page.metrics.total_projects")}
              value={metrics.totalProjects}
              prefix={<ProjectOutlined className="text-blue-500" />}
              loading={loading}
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title={t("timeline_page.metrics.total_sub_projects")}
              value={metrics.totalSubProjects}
              prefix={<AppstoreOutlined className="text-purple-500" />}
              loading={loading}
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title={t("timeline_page.metrics.in_progress")}
              value={metrics.inProgress}
              prefix={<SyncOutlined spin className="text-orange-500" />}
              loading={loading}
              valueStyle={{ fontWeight: "bold", color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title={t("timeline_page.metrics.completed")}
              value={metrics.completed}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              loading={loading}
              valueStyle={{ fontWeight: "bold", color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title={t("timeline_page.metrics.overdue")}
              value={metrics.overdue}
              prefix={<WarningOutlined className="text-red-500" />}
              loading={loading}
              valueStyle={{ fontWeight: "bold", color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
