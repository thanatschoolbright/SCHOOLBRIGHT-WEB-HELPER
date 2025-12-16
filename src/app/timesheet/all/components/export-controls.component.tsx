import React from "react";
import { Card, Space, Dropdown, Button, Progress, Typography, Tag } from "antd";
import type { MenuProps } from "antd";
import {
  FileExcelOutlined,
  DownloadOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ProjectOutlined,
  CalendarOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface ExportControlsProps {
  isExporting: boolean;
  exportStep: number;
  onExportTemplate: () => void;
  onExportTemplate2: () => void;
  onExportTemplate3: () => void;
  onExportTemplate4: () => void;
  onExportAll: () => void;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  isExporting,
  exportStep,
  onExportTemplate,
  onExportTemplate2,
  onExportTemplate3,
  onExportTemplate4,
  onExportAll,
}) => {
  const { t } = useTranslation("translate");

  const getExportStepLabel = () => {
    switch (exportStep) {
      case 0:
        return t("export_controls.step_preparing");
      case 1:
        return t("export_controls.step_processing");
      case 2:
        return t("export_controls.step_success");
      case 3:
        return t("export_controls.step_completed");
      default:
        return "";
    }
  };

  const getExportIcon = () => {
    if (exportStep === 3) return <CheckCircleOutlined />;
    if (isExporting) return <LoadingOutlined spin />;
    return <FileExcelOutlined />;
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "template1",
      label: t("export_controls.template_1"),
      icon: <UserOutlined />,
      onClick: onExportTemplate,
      disabled: isExporting,
    },
    {
      key: "template2",
      label: t("export_controls.template_2"),
      icon: <ProjectOutlined />,
      onClick: onExportTemplate2,
      disabled: isExporting,
    },
    {
      key: "template3",
      label: t("export_controls.template_3"),
      icon: <CalendarOutlined />,
      onClick: onExportTemplate3,
      disabled: isExporting,
    },
    {
      key: "template4",
      label: t("export_controls.template_4"),
      icon: <AuditOutlined />,
      onClick: onExportTemplate4,
      disabled: isExporting,
    },
    {
      type: "divider",
    },
    {
      key: "all",
      label: t("export_controls.export_all"),
      icon: <DownloadOutlined />,
      onClick: onExportAll,
      disabled: isExporting,
    },
  ];

  return (
    <Card
      className="mb-6"
      title={
        <Space>
          <FileExcelOutlined />
          <Typography.Text strong>{t("export_controls.title")}</Typography.Text>
        </Space>
      }
      extra={
        exportStep === 3 && (
          <Tag icon={<CheckCircleOutlined />} color="success">
            {t("export_controls.completed")}
          </Tag>
        )
      }
    >
      <Space direction="vertical" size="large" className="w-full">
        {isExporting && (
          <Card size="small" type="inner">
            <Space direction="vertical" size="small" className="w-full">
              <Space>
                <LoadingOutlined spin />
                <Typography.Text strong>{getExportStepLabel()}</Typography.Text>
              </Space>
              <Progress
                percent={exportStep * 33.33}
                status={exportStep === 3 ? "success" : "active"}
                strokeColor={{
                  "0%": "#1890ff",
                  "100%": "#52c41a",
                }}
                showInfo={false}
              />
            </Space>
          </Card>
        )}

        <Space size="middle">
          <Dropdown
            menu={{ items: menuItems }}
            placement="bottomLeft"
            disabled={isExporting}
          >
            <Button
              type="primary"
              size="large"
              icon={getExportIcon()}
              loading={isExporting}
            >
              {t("export_controls.select_template")}
            </Button>
          </Dropdown>

          <Typography.Text type="secondary">
            {t("export_controls.description")}
          </Typography.Text>
        </Space>
      </Space>
    </Card>
  );
};
