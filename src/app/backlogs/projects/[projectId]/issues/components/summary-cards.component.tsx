"use client";

import { Card, Col, Row, Space, Typography, theme } from "antd";
import { useTranslation } from "react-i18next";

type SummaryCardsProps = {
  total: number;
  space: string;
  projectName: string;
};

export default function SummaryCards({
  total,
  space,
  projectName,
}: SummaryCardsProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");
  const { token } = theme.useToken();

  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12} lg={8}>
        <Card
          size="small"
          style={{
            borderRadius: 14,
            background: `linear-gradient(120deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%)`,
            boxShadow: token.boxShadowSecondary,
          }}
        >
          <Space direction="vertical" size={4}>
            <Typography.Text type="secondary">
              {TRANSLATION("backlog_issues_page.total_issues")}
            </Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {total ?? 0}
            </Typography.Title>
            <Typography.Text type="secondary" className="text-xs">
              {TRANSLATION("backlog_issues_page.total_issues_hint")}
            </Typography.Text>
          </Space>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card
          size="small"
          style={{
            borderRadius: 14,
            background: token.colorBgContainer,
            boxShadow: token.boxShadowTertiary,
          }}
        >
          <Space direction="vertical" size={4}>
            <Typography.Text type="secondary">
              {TRANSLATION("backlog_issues_page.space_label")}
            </Typography.Text>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {space || "-"}
            </Typography.Title>
            <Typography.Text type="secondary" className="text-xs">
              {TRANSLATION("backlog_issues_page.space_hint")}
            </Typography.Text>
          </Space>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card
          size="small"
          style={{
            borderRadius: 14,
            background: token.colorBgContainer,
            boxShadow: token.boxShadow,
          }}
        >
          <Space direction="vertical" size={4}>
            <Typography.Text type="secondary">
              {TRANSLATION("backlog_issues_page.project_label")}
            </Typography.Text>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {projectName || "-"}
            </Typography.Title>
            <Typography.Text type="secondary" className="text-xs">
              {TRANSLATION("backlog_issues_page.project_hint")}
            </Typography.Text>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
