"use client";

import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloudUploadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  LoadingOutlined,
  MailOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  AutoComplete,
  Button,
  Card,
  Flex,
  Modal,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useCapturableStore } from "../_state/use-capturable-store";

const { Text } = Typography;

// ── ขั้นตอนการส่ง ──
type DeliveryStep = "idle" | "active" | "done" | "error";

interface StepState {
  prepare: DeliveryStep;
  excel: DeliveryStep;
  send: DeliveryStep;
  done: DeliveryStep;
}

const IDLE_STEPS: StepState = {
  prepare: "idle",
  excel: "idle",
  send: "idle",
  done: "idle",
};

interface TrackerStepDef {
  key: keyof StepState;
  icon: React.ReactNode;
  label: string;
}

const TRACKER_STEPS: TrackerStepDef[] = [
  { key: "prepare", icon: <FileTextOutlined />, label: "เตรียมข้อมูล" },
  { key: "excel", icon: <FileExcelOutlined />, label: "สร้าง Excel" },
  { key: "send", icon: <SendOutlined />, label: "ส่งอีเมล" },
  { key: "done", icon: <MailOutlined />, label: "สำเร็จ" },
];

// ── Preset emails ──
const PRESET_EMAILS = [
  { value: "wichuda.korn@schoolbright.co", label: "wichuda.korn@schoolbright.co" },
  { value: "thanat.light@schoolbright.co", label: "thanat.light@schoolbright.co" },
];

// ── DeliveryTracker Component ──
const DeliveryTracker: React.FC<{ steps: StepState; visible: boolean }> = ({
  steps,
  visible,
}) => {
  const { token } = theme.useToken();
  if (!visible) return null;

  const colorMap: Record<DeliveryStep, string> = {
    idle: token.colorBorderSecondary,
    active: token.colorPrimary,
    done: token.colorSuccess,
    error: token.colorError,
  };
  const bgMap: Record<DeliveryStep, string> = {
    idle: token.colorBgLayout,
    active: token.colorPrimaryBg,
    done: token.colorSuccessBg,
    error: token.colorErrorBg,
  };

  return (
    <Flex
      align="center"
      justify="space-between"
      style={{
        padding: "16px 20px",
        background: token.colorFillAlter,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      {TRACKER_STEPS.map((step, idx) => {
        const status = steps[step.key];
        const color = colorMap[status];
        const bg = bgMap[status];
        const isLast = idx === TRACKER_STEPS.length - 1;

        return (
          <Flex key={step.key} align="center" style={{ flex: 1, minWidth: 0 }}>
            <Flex vertical align="center" gap={6} style={{ flex: "0 0 auto" }}>
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: `2px solid ${color}`,
                  backgroundColor: bg,
                  transition: "all 0.4s ease",
                  boxShadow:
                    status === "active"
                      ? `0 0 0 4px ${token.colorPrimaryBg}`
                      : "none",
                }}
              >
                {status === "active" ? (
                  <LoadingOutlined style={{ color, fontSize: 20 }} />
                ) : status === "done" ? (
                  <CheckCircleFilled style={{ color, fontSize: 20 }} />
                ) : status === "error" ? (
                  <CloseCircleFilled style={{ color, fontSize: 20 }} />
                ) : (
                  <span style={{ color, fontSize: 18 }}>{step.icon}</span>
                )}
              </Flex>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: status === "active" || status === "done" ? 700 : 500,
                  color: status === "idle" ? token.colorTextDisabled : color,
                  whiteSpace: "nowrap",
                  transition: "all 0.3s",
                }}
              >
                {step.label}
              </Text>
            </Flex>

            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 3,
                  marginBottom: 20,
                  marginInline: 6,
                  borderRadius: 2,
                  background:
                    status === "done"
                      ? `linear-gradient(90deg,${token.colorSuccess},${token.colorSuccessBg})`
                      : status === "active"
                      ? `linear-gradient(90deg,${token.colorPrimary} 40%,${token.colorBorderSecondary} 100%)`
                      : token.colorBorderSecondary,
                  transition: "background 0.5s ease",
                }}
              />
            )}
          </Flex>
        );
      })}
    </Flex>
  );
};

// ── EmailExportModal ──
export const EmailExportModal: React.FC = () => {
  const { token } = theme.useToken();
  const {
    emailModalVisible,
    emailLoading,
    dateRange,
    data,
    setEmailModalVisible,
    sendEmail,
  } = useCapturableStore();

  const [recipients, setRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [steps, setSteps] = useState<StepState>(IDLE_STEPS);
  const [isDone, setIsDone] = useState(false);

  const setStep = (key: keyof StepState, status: DeliveryStep) => {
    setSteps((prev) => ({ ...prev, [key]: status }));
  };

  // เพิ่มอีเมลจาก input
  const addEmail = useCallback(() => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }
    if (recipients.includes(email)) {
      toast.warning("อีเมลนี้มีอยู่แล้ว");
      return;
    }
    setRecipients((prev) => [...prev, email]);
    setEmailInput("");
  }, [emailInput, recipients]);

  // ส่ง Email
  const handleSend = useCallback(async () => {
    if (recipients.length === 0) {
      toast.error("โปรดระบุอีเมลผู้รับอย่างน้อย 1 รายการ");
      return;
    }

    setSteps(IDLE_STEPS);
    setIsDone(false);

    // ขั้น 1: เตรียมข้อมูล
    setStep("prepare", "active");
    await new Promise((r) => setTimeout(r, 300));
    setStep("prepare", "done");

    // ขั้น 2: สร้าง Excel (server จัดการ)
    setStep("excel", "active");
    await new Promise((r) => setTimeout(r, 200));
    setStep("excel", "done");

    // ขั้น 3: ส่งอีเมล
    setStep("send", "active");
    const success = await sendEmail(recipients);

    if (success) {
      setStep("send", "done");
      setStep("done", "done");
      setIsDone(true);
    } else {
      setStep("send", "error");
    }
  }, [recipients, sendEmail]);

  const handleClose = () => {
    if (emailLoading) return;
    setSteps(IDLE_STEPS);
    setIsDone(false);
    setRecipients([]);
    setEmailInput("");
    setEmailModalVisible(false);
  };

  const isTracking =
    steps.prepare !== "idle" ||
    steps.excel !== "idle" ||
    steps.send !== "idle" ||
    steps.done !== "idle";

  const formattedStart = dateRange[0].format("DD/MM/YYYY");
  const formattedEnd = dateRange[1].format("DD/MM/YYYY");

  return (
    <Modal
      title={
        <Space size={12}>
          <MailOutlined style={{ color: token.colorPrimary }} />
          <Text style={{ fontWeight: 600, fontSize: 16 }}>
            ส่ง Capitalization Report ทางอีเมล
          </Text>
        </Space>
      }
      open={emailModalVisible}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      width={620}
      centered
      closable={!emailLoading}
      maskClosable={!emailLoading}
      styles={{ body: { padding: "12px 0 0" } }}
    >
      <Flex vertical gap={20}>
        {/* คำแนะนำ */}
        <Flex
          style={{
            padding: "10px 16px",
            background: token.colorInfoBg,
            borderRadius: token.borderRadius,
            border: `1px solid ${token.colorInfoBorder}`,
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            ระบบจะสร้าง Excel Capitalization Report ช่วงวันที่{" "}
            <Text strong>
              {formattedStart} — {formattedEnd}
            </Text>{" "}
            แล้วส่งเป็นไฟล์แนบไปยังอีเมลที่ระบุ
          </Text>
        </Flex>

        {/* Delivery Tracker */}
        <DeliveryTracker steps={steps} visible={isTracking} />

        {/* สำเร็จ */}
        {isDone && (
          <Flex
            align="center"
            justify="center"
            gap={8}
            style={{
              padding: "12px 16px",
              borderRadius: token.borderRadius,
              background: token.colorSuccessBg,
              border: `1px solid ${token.colorSuccessBorder}`,
            }}
          >
            <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 18 }} />
            <Text style={{ color: token.colorSuccess, fontWeight: 600 }}>
              ส่งอีเมลเรียบร้อยแล้ว
            </Text>
          </Flex>
        )}

        {/* ข้อมูลไฟล์ที่จะส่ง */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            background: token.colorFillAlter,
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex align="center" gap={10}>
            <Flex
              align="center"
              justify="center"
              style={{
                width: 40,
                height: 40,
                borderRadius: token.borderRadius,
                background: token.colorSuccessBg,
                flexShrink: 0,
              }}
            >
              <FileExcelOutlined style={{ fontSize: 20, color: token.colorSuccess }} />
            </Flex>
            <Flex vertical gap={2}>
              <Text strong style={{ fontSize: 13 }}>
                Capitalization_Report_{formattedStart}_to_{formattedEnd}.xlsx
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {data.length} โครงการ · ช่วงวันที่ {formattedStart} — {formattedEnd}
              </Text>
            </Flex>
          </Flex>
        </Card>

        {/* อีเมลผู้รับ */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            background: token.colorFillAlter,
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex vertical gap={12}>
            <Space size={8}>
              <MailOutlined style={{ color: token.colorPrimary }} />
              <Text style={{ fontWeight: 600 }}>ผู้รับอีเมล</Text>
            </Space>

            <Flex gap={8}>
              <AutoComplete
                value={emailInput}
                onChange={setEmailInput}
                onSelect={(val) => setEmailInput(val)}
                options={PRESET_EMAILS.filter(
                  (p) =>
                    !recipients.includes(p.value) &&
                    p.value.includes(emailInput.toLowerCase()),
                )}
                placeholder="พิมพ์หรือเลือกอีเมลผู้รับ..."
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addEmail();
                }}
                disabled={emailLoading || isDone}
              />
              <Button
                icon={<CloudUploadOutlined />}
                onClick={addEmail}
                disabled={emailLoading || isDone || !emailInput}
                shape="round"
              >
                เพิ่ม
              </Button>
            </Flex>

            {recipients.length > 0 && (
              <Flex wrap="wrap" gap={6}>
                {recipients.map((email) => (
                  <Tag
                    key={email}
                    icon={<MailOutlined />}
                    closable={!emailLoading && !isDone}
                    onClose={() =>
                      setRecipients((prev) => prev.filter((e) => e !== email))
                    }
                    color="blue"
                    style={{ fontSize: 12 }}
                  >
                    {email}
                  </Tag>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>

        {/* ปุ่มดำเนินการ */}
        <Flex justify="flex-end" gap={12}>
          <Button onClick={handleClose} shape="round" disabled={emailLoading}>
            {isDone ? "ปิด" : "ยกเลิก"}
          </Button>
          {!isDone && (
            <Button
              type="primary"
              loading={emailLoading}
              onClick={handleSend}
              disabled={recipients.length === 0 || data.length === 0}
              shape="round"
              icon={<SendOutlined />}
              style={{ fontWeight: 500 }}
            >
              ส่งอีเมล ({recipients.length} ที่อยู่)
            </Button>
          )}
        </Flex>
      </Flex>
    </Modal>
  );
};
