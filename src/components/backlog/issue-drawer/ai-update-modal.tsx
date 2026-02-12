"use client";

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Flex,
  Input,
  Modal,
  Skeleton,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
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
            <RobotOutlined
              style={{ color: token.colorPrimary, fontSize: 24 }}
            />
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
          paddingInline: 32,
          paddingBlock: 32,
          background: token.colorBgLayout,
        },
        header: {
          paddingInline: 32,
          paddingTop: 24,
          paddingBottom: 16,
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          margin: 0,
          borderRadius: "16px 16px 0 0",
        },
        footer: {
          paddingInline: 32,
          paddingBlock: 20,
          background: token.colorBgContainer,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          margin: 0,
          borderRadius: "0 0 16px 16px",
        },
      }}
    >
      <Space direction="vertical" size={32} style={{ width: "100%" }}>
        {/* Issue Header Info */}
        <Card
          size="small"
          styles={{ body: { padding: "16px 20px" } }}
          style={{
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          }}
        >
          <Flex align="center" gap={16}>
            <Tag
              color="cyan"
              style={{
                borderRadius: 6,
                margin: 0,
                fontWeight: 700,
                paddingInline: 12,
                height: 28,
                display: "flex",
                alignItems: "center",
              }}
            >
              {aiState.issue?.issueKey}
            </Tag>
            <Text strong style={{ fontSize: "1.05rem" }}>
              {aiState.issue?.summary}
            </Text>
          </Flex>
        </Card>

        {/* Comparison Section */}
        <Flex gap={32} align="stretch" style={{ minHeight: 520 }}>
          {/* Left Panel: Original Source */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
              <FileTextOutlined
                style={{ color: token.colorTextDescription, fontSize: 16 }}
              />
              <Text
                strong
                style={{ color: token.colorTextSecondary, fontSize: "0.95rem" }}
              >
                รายละเอียดเดิม (Source)
              </Text>
            </Flex>
            <div
              style={{
                flex: 1,
                maxHeight: 520,
                overflowY: "auto",
                background: token.colorBgContainerDisabled,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 16,
                padding: 24,
                fontSize: "0.95rem",
                color: token.colorTextDescription,
                lineHeight: 1.8,
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
          <Flex vertical align="center" justify="center" style={{ width: 60 }}>
            <div
              style={{
                background: token.colorBgContainer,
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                border: `1px solid ${token.colorBorderSecondary}`,
                zIndex: 1,
              }}
            >
              <ArrowRightOutlined
                style={{ color: token.colorPrimary, fontSize: 18 }}
              />
            </div>
          </Flex>

          {/* Right Panel: AI Transformation */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Flex
              align="center"
              gap={10}
              style={{ marginBottom: 16 }}
              justify="space-between"
            >
              <Space size={12}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    background: token.colorSuccess,
                    borderRadius: "50%",
                    boxShadow: `0 0 10px ${token.colorSuccess}80`,
                  }}
                />
                <Text
                  strong
                  style={{ color: token.colorTextHeading, fontSize: "0.95rem" }}
                >
                  สรุปใหม่โดย AI (Draft)
                </Text>
              </Space>
              {aiState.generating && (
                <Tag
                  color="processing"
                  bordered={false}
                  style={{ borderRadius: 6, paddingInline: 12 }}
                >
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
                  borderRadius: 16,
                  padding: 32,
                }}
              >
                <Skeleton active paragraph={{ rows: 14 }} />
              </div>
            ) : (
              <TextArea
                value={aiState.newText}
                onChange={(e) => onUpdateText(e.target.value)}
                autoSize={{ minRows: 16, maxRows: 16 }}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  padding: 24,
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  border: `2px solid ${token.colorPrimaryBg}`,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
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
