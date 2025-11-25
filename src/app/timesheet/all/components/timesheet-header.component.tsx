import React from "react";
import { Typography, Space } from "antd";
import { AreaChartOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export const TimesheetHeader: React.FC = () => {
  const { t } = useTranslation("translate");

  return (
    <div className="mb-6">
      <Space align="center" size="middle">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
          <AreaChartOutlined className="text-2xl text-white" />
        </div>
        <div>
          <Typography.Title level={2} className="!mb-0">
            {t("timesheet_page.title")}
          </Typography.Title>
          <Typography.Text type="secondary" className="text-base">
            {t("timesheet_page.subtitle")}
          </Typography.Text>
        </div>
      </Space>
    </div>
  );
};
