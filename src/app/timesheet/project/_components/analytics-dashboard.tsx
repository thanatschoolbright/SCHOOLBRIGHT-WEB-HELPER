import React from "react";
import { Card, Row, Col, Progress, Typography, Empty } from "antd";
import { Column } from "@ant-design/plots";
import { useTranslation } from "react-i18next";

interface Project {
  id: number;
  name: string;
  status: string;
  categoryType: string;
  start_date?: string;
  end_date?: string;
  features?: Array<{ is_deleted: boolean }>;
}

interface AnalyticsDashboardProps {
  projects: Project[];
  getCategoryName: (id: string) => string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projects,
  getCategoryName,
}) => {
  const { t } = useTranslation("translate");

  const categoryData = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    projects.forEach((p) => {
      const catName = getCategoryName(p.categoryType);
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      category: name,
      count,
    }));
  }, [projects, getCategoryName]);

  const statusData = React.useMemo(() => {
    const active = projects.filter((p) => p.status === "open").length;
    const closed = projects.filter((p) => p.status === "close").length;
    return [
      { status: t("project_page.status_active"), count: active },
      { status: t("project_page.status_closed"), count: closed },
    ];
  }, [projects, t]);

  const completionRate = React.useMemo(() => {
    const total = projects.length;
    const closed = projects.filter((p) => p.status === "close").length;
    return total > 0 ? Math.round((closed / total) * 100) : 0;
  }, [projects]);

  if (projects.length === 0) {
    return (
      <Card>
        <Empty description={t("project_page.no_data")} />
      </Card>
    );
  }

  const columnConfig = {
    data: categoryData,
    xField: "category",
    yField: "count",
    label: {
      position: "top" as const,
      style: {
        fill: "#000000",
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      category: {
        alias: t("project_page.category"),
      },
      count: {
        alias: t("project_page.project_count"),
      },
    },
  };

  return (
    <Card title={t("project_page.analytics_title")}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" title={t("project_page.category_distribution")}>
            <Column {...columnConfig} height={250} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title={t("project_page.completion_rate")}>
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Progress
                type="circle"
                percent={completionRate}
                size={180}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
              />
              <Typography.Title level={4} style={{ marginTop: 20 }}>
                {t("project_page.projects_completed")}
              </Typography.Title>
              <Typography.Text type="secondary">
                {projects.filter((p) => p.status === "close").length} /{" "}
                {projects.length} {t("project_page.projects")}
              </Typography.Text>
            </div>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};
