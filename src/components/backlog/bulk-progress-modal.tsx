"use client";

import { LoadingOutlined } from "@ant-design/icons";
import { Button, Modal, Progress, Space, Spin, Steps, Typography } from "antd";
import { memo, useMemo } from "react";

export type BulkStepStatus = "wait" | "process" | "finish" | "error";

export type BulkProgressStep = {
  key: string;
  title: string;
  description?: string;
  status: BulkStepStatus;
};

export type BulkProgressModalProps = {
  onClose?: () => void;
  open: boolean;
  steps: BulkProgressStep[];
};

//** Modal แสดงสถานะการอัปเดตแบบกลุ่มเป็นขั้นตอน พร้อมแจ้งเตือนผู้ใช้
function BulkProgressModalComponent({ onClose, open, steps }: BulkProgressModalProps) {
  const isProcessing = steps.some((step) => step.status === "process");
  const finishedCount = steps.filter((step) =>
    step.status === "finish" || step.status === "error"
  ).length;
  const percent = steps.length ? Math.round((finishedCount / steps.length) * 100) : 0;

  const stepItems = useMemo(
    () =>
      steps.map((step) => ({
        title: step.title,
        description: step.description,
        status: step.status,
      })),
    [steps]
  );

  return (
    <Modal
      centered
      closable={!isProcessing}
      footer={
        !isProcessing && steps.length
          ? [
              <Button key="close" type="primary" onClick={onClose}>
                ปิดหน้าต่าง
              </Button>,
            ]
          : null
      }
      maskClosable={false}
      open={open}
      styles={{ content: { borderRadius: 24, padding: 28 } }}
      width={520}
      onCancel={isProcessing ? undefined : onClose}
    >
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <div>
          <Typography.Title level={4} style={{ marginBottom: 4 }}>
            กำลังอัปเดตข้อมูลด้วย AI
          </Typography.Title>
          <Typography.Text type="danger">
            โปรดอย่าปิดหรือรีเฟรชหน้าเว็บนี้จนกว่ากระบวนการจะเสร็จสมบูรณ์
          </Typography.Text>
        </div>

        <Space
          align="center"
          style={{ width: "100%", justifyContent: "center" }}
          size={16}
        >
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 28, color: "#1677ff" }} spin />}
            spinning={isProcessing}
          />
          <Typography.Text type="secondary">
            {isProcessing
              ? "กำลังประมวลผล กรุณารอสักครู่"
              : "กระบวนการเสร็จสมบูรณ์"}
          </Typography.Text>
        </Space>

        <Progress
          percent={percent}
          status={steps.some((step) => step.status === "error") ? "exception" : undefined}
        />

        <Steps
          direction="vertical"
          items={stepItems.map((item) => ({
            title: item.title,
            description: item.description,
            status: item.status,
          }))}
        />
      </Space>
    </Modal>
  );
}

const BulkProgressModal = memo(BulkProgressModalComponent);

export default BulkProgressModal;
