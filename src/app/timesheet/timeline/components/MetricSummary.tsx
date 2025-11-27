import React from "react";
import { Card, Col, Row, Statistic } from "antd";
import {
  ProjectOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

interface Metrics {
  totalProjects: number;
  totalSubProjects: number;
  overdue: number;
  completed: number;
  inProgress: number;
}

interface MetricSummaryProps {
  metrics: Metrics;
  loading?: boolean;
}

export const MetricSummary: React.FC<MetricSummaryProps> = ({
  metrics,
  loading = false,
}) => {
  return (
    <div className="mb-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={4}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Total Projects"
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
              title="Total Sub-Projects"
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
              title="In Progress"
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
              title="Completed"
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
              title="Overdue"
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
