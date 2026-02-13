"use client";

import {
  AlertOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  RobotOutlined,
  TagOutlined,
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
import dayjs from "dayjs";
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

  const issue = aiState.issue;

  // Logic สำหรับแสดง Validation ข้อมูลที่ Auto Filled
  const autoFilledData = [
    {
      label: "รหัส Milestone / Version",
      icon: <TagOutlined />,
      current: issue?.milestone?.[0]?.name || issue?.versions?.[0]?.name,
      proposed: "Latest (อัตโนมัติ)",
      changed: !issue?.milestone?.length && !issue?.versions?.length,
    },
    {
      label: "วันที่เริ่มต้น (Start Date)",
      icon: <CalendarOutlined />,
      current: issue?.startDate
        ? dayjs(issue.startDate).format("DD/MM/YYYY")
        : null,
      proposed: dayjs().format("DD/MM/YYYY"),
      changed: !issue?.startDate,
    },
    {
      label: "วันที่สิ้นสุด (Due Date)",
      icon: <CalendarOutlined />,
      current: issue?.dueDate
        ? dayjs(issue.dueDate).format("DD/MM/YYYY")
        : null,
      proposed: dayjs().add(4, "day").format("DD/MM/YYYY"),
      changed: !issue?.dueDate,
    },
    {
      label: "เวลาที่ประเมิน (Estimate Hour)",
      icon: <ClockCircleOutlined />,
      current: issue?.estimatedHours ? `${issue.estimatedHours} h` : null,
      proposed: "2 h",
      changed: !issue?.estimatedHours,
    },
  ];

  const hasAnyChange = autoFilledData.some((item) => item.changed);

  return (
    <Modal
      open={aiState.open}
      onCancel={onClose}
      width={1400}
      centered
      title={
        <Flex align="center" gap={16}>
          <Flex
            align="center"
            justify="center"
            style={{
              background: token.colorPrimaryBg,
              width: 48,
              height: 48,
              borderRadius: 12,
            }}
          >
            <RobotOutlined
              style={{ color: token.colorPrimary, fontSize: 28 }}
            />
          </Flex>
          <Flex vertical gap={4}>
            <Title level={4} style={{ margin: 0 }}>
              AI Summary & Analysis
            </Title>
            <Text type="secondary" style={{ fontSize: "0.85rem" }}>
              ตรวจสอบและแก้ไขข้อมูลที่ AI ช่วยสรุปก่อนบันทึกเข้าระบบ
            </Text>
          </Flex>
        </Flex>
      }
      footer={
        <Flex justify="space-between" align="center" style={{ width: "100%" }}>
          <Space direction="vertical" align="start" size={4}>
            <Text type="secondary" style={{ fontSize: "0.85rem" }}>
              * ข้อมูลจะถูกบันทึกทับในส่วนรายละเอียด (Description) ของงาน
            </Text>
            {hasAnyChange && (
              <Text type="warning" style={{ fontSize: "0.85rem" }}>
                * ระบบจะทำการ Auto-fill ข้อมูลที่ไม่ได้กรอกโดยอัตโนมัติ
              </Text>
            )}
          </Space>
          <Space size="large">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRegenerate}
              disabled={aiState.generating}
              loading={aiState.generating}
              size="large"
            >
              สร้างใหม่
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              disabled={!aiState.newText || aiState.generating}
              onClick={onApprove}
              style={{ fontWeight: 600, paddingInline: 40 }}
            >
              อนุมัติและบันทึก
            </Button>
          </Space>
        </Flex>
      }
      styles={{
        content: {
          boxShadow: "none",
        },
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
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {/* Issue Header Info */}
        <Card
          size="small"
          styles={{ body: { padding: "16px 20px" } }}
          style={{
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: "none",
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

        {/* Validation Section */}
        {hasAnyChange && (
          <Card
            size="small"
            title={
              <Space size={12}>
                <AlertOutlined
                  style={{ color: token.colorWarning, fontSize: 18 }}
                />
                <Text
                  strong
                  style={{ color: token.colorWarning, fontSize: "1rem" }}
                >
                  การปรับปรุงข้อมูลอัตโนมัติ (Auto Validation)
                </Text>
              </Space>
            }
            styles={{ body: { padding: "20px 24px" } }}
            style={{
              borderRadius: 12,
              border: `1px solid ${token.colorWarningBorder}`,
              background: token.colorWarningBg,
              boxShadow: "none",
            }}
          >
            <Flex gap={40} wrap="wrap">
              {autoFilledData
                .filter((item) => item.changed)
                .map((item, index) => (
                  <Flex key={index} vertical gap={8} style={{ minWidth: 240 }}>
                    <Space size={8} style={{ color: token.colorTextSecondary }}>
                      {item.icon}
                      <Text type="secondary" style={{ fontSize: "0.85rem" }}>
                        {item.label}
                      </Text>
                    </Space>
                    <Flex align="center" gap={12}>
                      <Text type="danger" delete style={{ fontSize: "0.9rem" }}>
                        {item.current || "ไม่ได้กรอก"}
                      </Text>
                      <ArrowRightOutlined
                        style={{
                          fontSize: 12,
                          color: token.colorWarning,
                          opacity: 0.6,
                        }}
                      />
                      <Text
                        strong
                        type="success"
                        style={{ fontSize: "0.95rem" }}
                      >
                        {item.proposed}
                      </Text>
                    </Flex>
                  </Flex>
                ))}
            </Flex>
          </Card>
        )}

        {/* Comparison Section */}
        <Flex gap={40} align="stretch" style={{ minHeight: 600 }}>
          {/* Left Panel: Original Source */}
          <Flex vertical flex={1} gap={16}>
            <Flex align="center" gap={10}>
              <FileTextOutlined
                style={{ color: token.colorTextDescription, fontSize: 18 }}
              />
              <Text
                strong
                style={{ color: token.colorTextSecondary, fontSize: "1rem" }}
              >
                รายละเอียดเดิม (Source)
              </Text>
            </Flex>
            <Card
              styles={{
                body: {
                  padding: 24,
                  height: 600,
                  overflowY: "auto",
                  background: token.colorBgContainerDisabled,
                  fontSize: "0.95rem",
                  color: token.colorTextDescription,
                  lineHeight: 1.8,
                },
              }}
              style={{
                borderRadius: 16,
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: "none",
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
            </Card>
          </Flex>

          {/* Divider with Arrow */}
          <Flex vertical align="center" justify="center" style={{ width: 60 }}>
            <Flex
              align="center"
              justify="center"
              style={{
                background: token.colorBgContainer,
                width: 52,
                height: 52,
                borderRadius: "50%",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                border: `1px solid ${token.colorBorderSecondary}`,
                zIndex: 1,
              }}
            >
              <ArrowRightOutlined
                style={{ color: token.colorPrimary, fontSize: 24 }}
              />
            </Flex>
          </Flex>

          {/* Right Panel: AI Transformation */}
          <Flex vertical flex={1} gap={16}>
            <Flex align="center" justify="space-between">
              <Space size={12}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    background: token.colorSuccess,
                    borderRadius: "50%",
                  }}
                />
                <Text
                  strong
                  style={{ color: token.colorTextHeading, fontSize: "1rem" }}
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
              <Card
                styles={{
                  body: {
                    padding: 32,
                    height: 600,
                  },
                }}
                style={{
                  borderRadius: 16,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Skeleton active paragraph={{ rows: 16 }} />
              </Card>
            ) : (
              <TextArea
                value={aiState.newText}
                onChange={(e) => onUpdateText(e.target.value)}
                style={{
                  height: 600,
                  borderRadius: 16,
                  padding: 24,
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  border: `2px solid ${token.colorPrimaryBg}`,
                  boxShadow: "none",
                  transition: "all 0.3s",
                  resize: "none",
                }}
                placeholder="AI กำลังร่างข้อความ..."
              />
            )}
          </Flex>
        </Flex>
      </Space>
    </Modal>
  );
}
