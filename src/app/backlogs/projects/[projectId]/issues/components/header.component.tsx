"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";

type HeaderSectionProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
  extra?: React.ReactNode;
};

export default function HeaderSection({
  title,
  subtitle,
  onBack,
  extra,
}: HeaderSectionProps): JSX.Element {
  const { t: TRANSLATION } = useTranslation("translate");

  return (
    <div className="flex justify-between items-center w-full">
      <Space align="center" size={12}>
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
      {extra && <div>{extra}</div>}
    </div>
  );
}
