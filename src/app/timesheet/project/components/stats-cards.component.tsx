import React from "react";
import { Card, Row, Col, Statistic, Skeleton } from "antd";
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface StatsCardsProps {
  totalProjects: number;
  activeProjects: number;
  closedProjects: number;
  totalSubProjects: number;
  loading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalProjects,
  activeProjects,
  closedProjects,
  totalSubProjects,
  loading,
}) => {
  const { t } = useTranslation("translate");

  const stats = [
    {
      title: t("project_page.stat_total_projects"),
      value: totalProjects,
      icon: <ProjectOutlined />,
      color: "#1890ff",
    },
    {
      title: t("project_page.stat_active_projects"),
      value: activeProjects,
      icon: <CheckCircleOutlined />,
      color: "#52c41a",
    },
    {
      title: t("project_page.stat_closed_projects"),
      value: closedProjects,
      icon: <ClockCircleOutlined />,
      color: "#8c8c8c",
    },
    {
      title: t("project_page.stat_total_features"),
      value: totalSubProjects,
      icon: <AppstoreOutlined />,
      color: "#722ed1",
    },
  ];

  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {stats.map((stat, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card hoverable>
            <Statistic
              title={stat.title}
              value={stat.value}
              prefix={
                <span style={{ color: stat.color, fontSize: 24 }}>
                  {stat.icon}
                </span>
              }
              valueStyle={{ color: stat.color }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};
