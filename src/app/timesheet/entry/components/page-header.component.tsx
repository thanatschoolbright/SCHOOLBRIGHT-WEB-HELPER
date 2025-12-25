import React from "react";
import { Typography, Button, Space, Badge } from "antd";
import {
  PlusOutlined,
  BookOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { getGreeting } from "../utils/timesheet-entry.helpers";

interface PageHeaderProps {
  adminName: string;
  onAddClick: () => void;
  onAddMultiClick: () => void;
  token: any;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  adminName,
  onAddClick,
  onAddMultiClick,
  token,
}) => {
  const { t } = useTranslation("translate");

  const handleOpenGuide = () => {
    window.open(
      "https://docs.google.com/document/d/1bfkhcYs_X79c5j2uZ5pH-C5QAeIjN91aSVNNZEf2guI/edit?usp=sharing",
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorBgLayout} 100%)`,
        padding: "24px",
        borderRadius: token.borderRadiusLG,
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div>
        <Typography.Title level={3} style={{ margin: 0, fontWeight: 700 }}>
          {getGreeting()}, {t("timesheet_entry_page.greeting_prefix")}
          {adminName} 👋
        </Typography.Title>
        <Typography.Text type="secondary">
          {t("timesheet_entry_page.subtitle")}
        </Typography.Text>
      </div>
      <Space size="middle">
        <Button size="large" icon={<BookOutlined />} onClick={handleOpenGuide}>
          {t("timesheet_entry_page.user_guide_button")}
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={onAddClick}
        >
          {t("timesheet_entry_page.add_entry_button")}
        </Button>
        <Badge count="ใหม่" offset={[-10, 5]}>
          <Button
            type="primary"
            size="large"
            icon={<AppstoreAddOutlined />}
            onClick={onAddMultiClick}
          >
            {t("timesheet_entry_page.add_multi_entry_button")}
          </Button>
        </Badge>
      </Space>
    </div>
  );
};
