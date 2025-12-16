import React from "react";
import { Card, Space, Button, Typography } from "antd";
import { PlusOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface ActionBarProps {
  onCreateProject: () => void;
  onViewTimeline: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  onCreateProject,
  onViewTimeline,
}) => {
  const { t } = useTranslation("translate");

  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t("project_page.title")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("project_page.subtitle")}
          </Typography.Text>
        </div>
        <Space>
          <Button
            icon={<ArrowRightOutlined />}
            size="large"
            onClick={onViewTimeline}
          >
            {t("project_page.timeline_view")}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={onCreateProject}
          >
            {t("project_page.create_project")}
          </Button>
        </Space>
      </div>
    </Card>
  );
};
