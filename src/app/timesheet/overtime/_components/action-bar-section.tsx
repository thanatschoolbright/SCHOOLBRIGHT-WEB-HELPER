"use client";

import {
  BarChartOutlined,
  CloseOutlined,
  DownloadOutlined,
  MailOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { Button, Flex, Space, Tag, theme, Typography } from "antd";
import React from "react";

interface ActionBarSectionProps {
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  setProcessedRecordItems: (map: Map<React.Key, any>) => void;
  isBatchProcessing: boolean;
  setIsBatchStatusModalVisible: (v: boolean) => void;
  requestBatchSendOvertimeMailToHR: () => void;
  handleBulkPdfDownloadZip: () => void;
  navigationRouter: any;
  setIsAnalyticsModalVisible: (v: boolean) => void;
}

/**
 * แถบดำเนินการแบบกลุ่ม แสดงเมื่อมีรายการที่ถูกเลือกในตาราง
 */
const ActionBarSection: React.FC<ActionBarSectionProps> = ({
  selectedRowKeys,
  setSelectedRowKeys,
  setProcessedRecordItems,
  isBatchProcessing,
  setIsBatchStatusModalVisible,
  requestBatchSendOvertimeMailToHR,
  handleBulkPdfDownloadZip,
  setIsAnalyticsModalVisible,
}) => {
  const { token } = theme.useToken();

  const handleClearSelection = () => {
    setSelectedRowKeys([]);
    setProcessedRecordItems(new Map());
  };

  return (
    <Flex
      align="center"
      justify="space-between"
      wrap="wrap"
      gap={12}
      style={{
        padding: "12px 20px",
        background: token.colorPrimaryBg,
        border: `1px solid ${token.colorPrimaryBorder}`,
        borderRadius: token.borderRadiusLG,
      }}
    >
      {/* ข้อมูลจำนวนรายการที่เลือก */}
      <Flex align="center" gap={10}>
        <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
          {selectedRowKeys.length} รายการ
        </Tag>
        <Typography.Text style={{ fontWeight: 600 }}>
          ถูกเลือกแล้ว
        </Typography.Text>
      </Flex>

      {/* ปุ่มดำเนินการ */}
      <Space size="small" wrap>
        <Button
          icon={<SwapOutlined />}
          disabled={isBatchProcessing}
          onClick={() => setIsBatchStatusModalVisible(true)}
        >
          เปลี่ยนสถานะ
        </Button>
        <Button
          icon={<MailOutlined />}
          disabled={isBatchProcessing}
          onClick={requestBatchSendOvertimeMailToHR}
        >
          ส่งอีเมล HR
        </Button>
        <Button
          icon={<DownloadOutlined />}
          disabled={isBatchProcessing}
          onClick={handleBulkPdfDownloadZip}
        >
          ดาวน์โหลด PDF (ZIP)
        </Button>
        <Button
          icon={<BarChartOutlined />}
          disabled={isBatchProcessing}
          onClick={() => setIsAnalyticsModalVisible(true)}
        >
          วิเคราะห์ข้อมูล
        </Button>
        <Button
          icon={<CloseOutlined />}
          disabled={isBatchProcessing}
          onClick={handleClearSelection}
        >
          ล้างการเลือก
        </Button>
      </Space>
    </Flex>
  );
};

export default ActionBarSection;
