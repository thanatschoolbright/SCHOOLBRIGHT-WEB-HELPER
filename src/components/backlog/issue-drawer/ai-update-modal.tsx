"use client";

import React from "react";
import {
  Modal,
  Button,
  Card,
  Typography,
  Space,
  Flex,
  Skeleton,
  Input,
  theme,
  Tag,
} from "antd";
import {
  RobotOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import type { AiUpdateState } from "./types";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

export type AiUpdateModalProps = {
  aiState: AiUpdateState;
  onApprove: () => void;
  onClose: () => void;
  onRegenerate: () => void;
  onUpdateText: (value: string) => void;
};

export default function AiUpdateModal({
  aiState,
  onApprove,
  onClose,
  onRegenerate,
  onUpdateText,
}: AiUpdateModalProps) {
  const { token } = theme.useToken();

  if (!aiState.open) return null;

  return (
    <Modal
      open={aiState.open}
      onCancel={onClose}
      width={1100}
      centered
      title={
        <Flex align="center" gap={12}>
          <div
            style={{
              background: token.colorPrimaryBg,
              padding: "8px 12px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RobotOutlined style={{ color: token.colorPrimary, fontSize: 24 }} />
          </div>
          <Flex vertical gap={0}>
            <Title level={5} style={{ margin: 0 }}>
              AI Summary & Analysis
            </Title>
            <Text type="secondary" style={{ fontSize: "0.75rem" }}>
              ตรวจสอบและแก้ไขข้อมูลที่ AI ช่วยสรุปก่อนบันทึกเข้าระบบ
            </Text>
          </Flex>
        </Flex>
      }
      footer={
        <Flex justify="space-between" align="center" style={{ width: "100%" }}>
          <Text type="secondary" style={{ fontSize: "0.85rem" }}>
            * ข้อมูลจะถูกบันทึกทับในส่วนรายละเอียด (Description) ของงาน
          </Text>
          <Space size="middle">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRegenerate}
              disabled={aiState.generating}
              loading={aiState.generating}
            >
              สร้างใหม่
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              disabled={!aiState.newText || aiState.generating}
              onClick={onApprove}
              style={{ fontWeight: 600, paddingInline: 32 }}
            >
              อนุมัติและบันทึก
            </Button>
          </Space>
        </Flex>
      }
      styles={{
        body: {
          paddingBlock: 24,
          background: token.colorBgLayout,
        },
      }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Issue Header Info */}
        <Card
          size="small"
          styles={{ body: { padding: "12px 16px" } }}
          style={{
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <Flex align="center" gap={12}>
            <Tag color="cyan" style={{ borderRadius: 4, margin: 0, fontWeight: 600 }}>
              {aiState.issue?.issueKey}
            </Tag>
            <Text strong style={{ fontSize: "1rem" }}>
              {aiState.issue?.summary}
            </Text>
          </Flex>
        </Card>

        {/* Comparison Section */}
        <Flex gap={20} align="stretch" style={{ minHeight: 500 }}>
          {/* Left Panel: Original Source */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
              <FileTextOutlined style={{ color: token.colorTextDescription }} />
              <Text strong style={{ color: token.colorTextSecondary }}>
                รายละเอียดเดิม (Source)
              </Text>
            </Flex>
            <div
              style={{
                flex: 1,
                maxHeight: 500,
                overflowY: "auto",
                background: token.colorBgContainerDisabled,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 12,
                padding: 20,
                fontSize: "0.9rem",
                color: token.colorTextDescription,
                lineHeight: 1.6,
              }}
            >
              {aiState.issue?.description ? (
                <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {aiState.issue.description}
                </Paragraph>
              ) : (
                <Text type="secondary" italic>
                  ไม่มีข้อมูลรายละเอียดเดิม
                </Text>
              )}
            </div>
          </div>

          {/* Divider with Arrow */}
          <Flex vertical align="center" justify="center" style={{ width: 40 }}>
            <div
              style={{
                background: token.colorBgContainer,
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: `1px solid ${token.colorBorderSecondary}`,
                zIndex: 1,
              }}
            >
              <ArrowRightOutlined style={{ color: token.colorPrimary }} />
            </div>
          </Flex>

          {/* Right Panel: AI Transformation */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Flex align="center" gap={8} style={{ marginBottom: 12 }} justify="space-between">
              <Space>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    background: token.colorSuccess,
                    borderRadius: "50%",
                    boxShadow: `0 0 8px ${token.colorSuccess}`,
                  }}
                />
                <Text strong style={{ color: token.colorTextHeading }}>
                  สรุปใหม่โดย AI (Draft)
                </Text>
              </Space>
              {aiState.generating && (
                <Tag color="processing" bordered={false}>
                  AI Is Thinking...
                </Tag>
              )}
            </Flex>
            {aiState.generating ? (
              <div
                style={{
                  flex: 1,
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <Skeleton active paragraph={{ rows: 12 }} />
              </div>
            ) : (
              <TextArea
                value={aiState.newText}
                onChange={(e) => onUpdateText(e.target.value)}
                autoSize={{ minRows: 15, maxRows: 15 }}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  padding: 20,
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  border: `2px solid ${token.colorPrimaryBg}`,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                  transition: "all 0.3s",
                }}
                placeholder="AI กำลังร่างข้อความ..."
              />
            )}
          </div>
        </Flex>
      </Space>
    </Modal>
  );
}

