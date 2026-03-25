"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileZipOutlined,
  HistoryOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  Button,
  Flex,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import React from "react";

interface BulkDownloadTrackingModalProps {
  visible: boolean;
  onClose: () => void;
  bulkDownloadProgress: number;
  bulkTrackingData: any[];
}

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; text: string }
> = {
  waiting: {
    color: "default",
    icon: <ClockCircleOutlined />,
    text: "รอการดำเนินการ",
  },
  processing: {
    color: "processing",
    icon: <LoadingOutlined />,
    text: "กำลังสร้าง PDF",
  },
  completed: {
    color: "success",
    icon: <CheckCircleOutlined />,
    text: "เสร็จสมบูรณ์",
  },
  failed: {
    color: "error",
    icon: <CloseCircleOutlined />,
    text: "ล้มเหลว",
  },
  zipping: {
    color: "warning",
    icon: <LoadingOutlined />,
    text: "กำลังรวมไฟล์ ZIP",
  },
  finished: {
    color: "success",
    icon: <FileZipOutlined />,
    text: "ดาวน์โหลดสำเร็จ",
  },
};

/**
 * Modal แสดงความคืบหน้าการดาวน์โหลด PDF แบบกลุ่ม (Bulk Download Tracking)
 */
const BulkDownloadTrackingModal: React.FC<BulkDownloadTrackingModalProps> = ({
  visible,
  onClose,
  bulkDownloadProgress,
  bulkTrackingData,
}) => {
  const { token } = theme.useToken();
  const isDone = bulkDownloadProgress >= 100;

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined style={{ color: token.colorPrimary }} />
          สถานะการเตรียมไฟล์ดาวน์โหลด (Bulk Download)
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          type="primary"
          onClick={onClose}
          disabled={!isDone}
        >
          {isDone ? "ตกลง" : `กำลังดำเนินการ (${bulkDownloadProgress}%)`}
        </Button>,
      ]}
      width={800}
      centered
      maskClosable={false}
      styles={{ body: { padding: "20px 0" } }}
    >
      <Flex vertical gap={24} style={{ paddingInline: 24 }}>
        {/* ส่วนแสดงความคืบหน้าภาพรวม */}
        <Flex vertical gap={8}>
          <Flex justify="space-between" align="center">
            <Typography.Text strong>ความคืบหน้าภาพรวม</Typography.Text>
            <Typography.Text
              strong
              style={{ color: token.colorPrimary, fontWeight: 600 }}
            >
              {bulkDownloadProgress}%
            </Typography.Text>
          </Flex>
          <Progress
            percent={bulkDownloadProgress}
            status={isDone ? "success" : "active"}
            strokeColor={{
              "0%": token.colorPrimary,
              "100%": token.colorSuccess,
            }}
            showInfo={false}
          />
        </Flex>

        {/* ตารางแสดงสถานะรายไฟล์ */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <Table
            dataSource={bulkTrackingData}
            pagination={false}
            size="small"
            rowKey="key"
            columns={[
              {
                title: "ลำดับ",
                key: "index",
                width: 60,
                render: (_: any, __: any, index: number) => index + 1,
              },
              {
                title: "ชื่อไฟล์",
                dataIndex: "fileName",
                key: "fileName",
              },
              {
                title: "สถานะ",
                dataIndex: "status",
                key: "status",
                width: 150,
                render: (status: string) => {
                  const item = STATUS_CONFIG[status] ?? STATUS_CONFIG.waiting;
                  return (
                    <Tag icon={item.icon} color={item.color}>
                      {item.text}
                    </Tag>
                  );
                },
              },
            ]}
            locale={{ emptyText: "ไม่มีข้อมูลการดาวน์โหลด" }}
          />
        </div>
      </Flex>
    </Modal>
  );
};

export default BulkDownloadTrackingModal;
