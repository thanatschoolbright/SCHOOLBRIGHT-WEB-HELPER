import React from "react";
import { Card, Space, Button, Progress, Typography } from "antd";
import {
  FileExcelOutlined,
  DownloadOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
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
        return "เตรียมข้อมูล...";
      case 1:
        return "กำลังประมวลผล...";
      case 2:
        return "สร้างไฟล์สำเร็จ";
      case 3:
        return "ดาวน์โหลดเสร็จสิ้น";
      default:
        return "";
    }
  };

  const getExportIcon = () => {
    if (exportStep === 3) return <CheckCircleOutlined />;
    if (isExporting) return <LoadingOutlined />;
    return <FileExcelOutlined />;
  };

  return (
    <Card
      className="mb-6 rounded-xl shadow-md border-0"
      title={
        <Space>
          <FileExcelOutlined className="text-green-600" />
          <span>ส่งออกข้อมูล Excel</span>
        </Space>
      }
    >
      <Space direction="vertical" size="middle" className="w-full">
        {isExporting && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <Space direction="vertical" size="small" className="w-full">
              <Typography.Text strong>{getExportStepLabel()}</Typography.Text>
              <Progress
                percent={exportStep * 33.33}
                status={exportStep === 3 ? "success" : "active"}
                strokeColor={{
                  "0%": "#1890ff",
                  "100%": "#52c41a",
                }}
              />
            </Space>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="primary"
            icon={getExportIcon()}
            onClick={onExportTemplate}
            loading={isExporting}
            className="rounded-lg"
          >
            Template 1: สรุปตามบุคคล
          </Button>

          <Button
            type="primary"
            icon={getExportIcon()}
            onClick={onExportTemplate2}
            loading={isExporting}
            className="rounded-lg"
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            Template 2: สรุปตามโปรเจ็ค
          </Button>

          <Button
            type="primary"
            icon={getExportIcon()}
            onClick={onExportTemplate3}
            loading={isExporting}
            className="rounded-lg"
            style={{ backgroundColor: "#faad14", borderColor: "#faad14" }}
          >
            Template 3: สรุปรายสัปดาห์
          </Button>

          <Button
            type="primary"
            icon={getExportIcon()}
            onClick={onExportTemplate4}
            loading={isExporting}
            className="rounded-lg"
            style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
          >
            Template 4: Audit Report
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={onExportAll}
            loading={isExporting}
            className="rounded-lg"
          >
            ส่งออกทั้งหมด
          </Button>
        </div>
      </Space>
    </Card>
  );
};
