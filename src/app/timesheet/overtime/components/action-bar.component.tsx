"use client";

import React from "react";
import { Card, Space, Button, Divider } from "antd";
import {
  PlusOutlined,
  FilePdfOutlined,
  CheckOutlined,
  MailOutlined,
  FileTextOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface ActionBarProps {
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  setProcessedItems: (items: Set<React.Key>) => void;
  batchProcessing: boolean;
  setVisible: (visible: boolean) => void;
  setBatchStatusModalVisible: (visible: boolean) => void;
  batchSendEmail: () => void;
  router: any;
  setAnalyticsVisible: (visible: boolean) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  selectedRowKeys,
  setSelectedRowKeys,
  setProcessedItems,
  batchProcessing,
  setVisible,
  setBatchStatusModalVisible,
  batchSendEmail,
  router,
  setAnalyticsVisible,
}) => {
  const { t } = useTranslation();

  return (
    <Card
      bordered={false}
      className="shadow-md rounded-xl mb-6"
      bodyStyle={{ padding: "16px 24px" }}
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left Side: Bulk Actions (Only visible when items selected) */}
        <Space wrap>
          {selectedRowKeys.length > 0 ? (
            <>
              <span className="font-semibold mr-2">
                {selectedRowKeys.length} รายการที่เลือก:
              </span>
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={() => {
                  const ids = selectedRowKeys.join(",");
                  router.push(`/timesheet/overtime/preview/bulk?ids=${ids}`);
                }}
              >
                {t("overtime_page.view_pdf_bulk")}
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => setBatchStatusModalVisible(true)}
                loading={batchProcessing}
              >
                {t("overtime_page.change_status_bulk")}
              </Button>
              <Button
                icon={<MailOutlined />}
                onClick={batchSendEmail}
                loading={batchProcessing}
              >
                {t("overtime_page.send_email_bulk")}
              </Button>
              <Button
                type="text"
                danger
                onClick={() => {
                  setSelectedRowKeys([]);
                  setProcessedItems(new Set());
                }}
              >
                {t("overtime_page.cancel")}
              </Button>
            </>
          ) : (
            <span className="text-gray-400">
              เลือกรายการในตารางเพื่อจัดการหลายรายการพร้อมกัน
            </span>
          )}
        </Space>

        {/* Right Side: Global Actions */}
        <Space wrap>
          <Button
            icon={<FileTextOutlined />}
            onClick={() =>
              window.open(
                "https://docs.google.com/document/d/12eEuCzFtCxE3C_CfhkGZ9J8yo3jiKVD2uANYBMXXnUE/edit?usp=sharing",
                "_blank"
              )
            }
            danger
          >
            ระเบียบการขอทำงานล่วงเวลา (ต้องอ่านก่อนขอ)
          </Button>
          <Button
            icon={<RiseOutlined />}
            onClick={() => setAnalyticsVisible(true)}
            style={{ borderColor: "#1890ff", color: "#1890ff" }}
          >
            Executive Analytics
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setVisible(true)}
            size="large"
          >
            {t("overtime_page.add_overtime")}
          </Button>
        </Space>
      </div>
    </Card>
  );
};
