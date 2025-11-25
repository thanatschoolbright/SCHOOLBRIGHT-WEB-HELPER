"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";

type HeaderSectionProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
};

export default function HeaderSection({
  title,
  subtitle,
  onBack,
}: HeaderSectionProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  return (
    <Space align="center" size={12} className="w-full">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        type="text"
        className="hover:-translate-y-0.5 transition-transform"
      >
        {TRANSLATION("backlog_issues_page.back")}
      </Button>
      <div className="flex flex-col">
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">{subtitle}</Typography.Text>
      </div>
    </Space>
  );
}
