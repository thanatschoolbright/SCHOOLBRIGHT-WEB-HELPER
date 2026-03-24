"use client";

import {
  CheckCircleFilled,
  CloudUploadOutlined,
  ContainerOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Flex, Modal, Steps, theme, Typography } from "antd";
import React from "react";

const { Text, Title } = Typography;

export type ProcessingStepStatus = "wait" | "process" | "finish" | "error";

interface ProcessingStep {
  title: string;
  description: string;
  status: ProcessingStepStatus;
  icon: React.ReactNode;
}

interface DeliveryLoadingModalProps {
  open: boolean;
  currentStep: number;
  steps: ProcessingStep[];
  title?: string;
}

/**
 * ✨ DeliveryLoadingModal - หน้าจอ Loading รูปแบบ Delivery Tracking
 * สำหรับแสดงสถานะการทำงานที่เป็นขั้นตอน (ซ้าย -> ขวา)
 * ใช้ในกรณีที่ต้องการให้ผู้ใช้งานทราบถึงความคืบหน้าของ Logic หลังบ้านที่ซับซ้อน
 */
export const DeliveryLoadingModal: React.FC<DeliveryLoadingModalProps> = ({
  open,
  currentStep,
  steps,
  title = "กำลังดำเนินการ...",
}) => {
  const { token } = theme.useToken();

  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      centered
      width={700}
      styles={{
        body: {
          padding: "40px 24px",
        },
      }}
      style={{ borderRadius: 20, overflow: "hidden" }}
    >
      <Flex vertical align="center" gap={32}>
        <Flex vertical align="center" gap={4}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            {title}
          </Title>
          <Text type="secondary">
            โปรดรอสักครู่ ระบบกำลังจัดการข้อมูลของคุณ
          </Text>
        </Flex>

        <Steps
          current={currentStep}
          labelPlacement="vertical"
          items={steps.map((step, index) => ({
            title: (
              <Text strong style={{ fontSize: 13 }}>
                {step.title}
              </Text>
            ),
            description: (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {step.description}
              </Text>
            ),
            icon:
              currentStep > index ? (
                <CheckCircleFilled style={{ color: token.colorSuccess }} />
              ) : currentStep === index ? (
                <SyncOutlined spin style={{ color: token.colorPrimary }} />
              ) : (
                step.icon
              ),
          }))}
        />

        <Flex
          style={{
            width: "100%",
            padding: "16px",
            background: token.colorFillAlter,
            borderRadius: 12,
            border: `1px dashed ${token.colorBorder}`,
          }}
          justify="center"
        >
          <Text type="secondary" italic>
            {steps[currentStep]?.description || "กำลังดำเนินการ..."}
          </Text>
        </Flex>
      </Flex>
    </Modal>
  );
};

// Default steps for Overtime Submission
export const overtimeSubmissionSteps: ProcessingStep[] = [
  {
    title: "เตรียมข้อมูล",
    description: "ตรวจสอบความถูกต้องของฟอร์ม",
    status: "wait",
    icon: <ContainerOutlined />,
  },
  {
    title: "บันทึกฐานข้อมูล",
    description: "กำลังส่งข้อมูลเข้าสู่ระบบ",
    status: "wait",
    icon: <CloudUploadOutlined />,
  },
  {
    title: "ส่งอีเมลแจ้งเตือน",
    description: "กำลังแจ้งผู้มีส่วนเกี่ยวข้อง",
    status: "wait",
    icon: <MailOutlined />,
  },
  {
    title: "เสร็จสิ้น",
    description: "ทำรายการสำเร็จเรียบร้อย",
    status: "wait",
    icon: <SafetyCertificateOutlined />,
  },
];
