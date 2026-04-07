"use client";

import {
  CalendarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CloudUploadOutlined,
  DatabaseOutlined,
  FileExcelOutlined,
  LoadingOutlined,
  MailOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  AutoComplete,
  Button,
  Card,
  Checkbox,
  Col,
  Flex,
  Modal,
  Row,
  Select,
  Tag,
  theme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { DateRange } from "../_api/capturable-api";
import { useCapturableStore } from "../_state/use-capturable-store";

const { Text } = Typography;

// ── Types ──
type StepStatus = "idle" | "active" | "done" | "error";

interface StepState {
  validate: StepStatus;
  build: StepStatus;
  send: StepStatus;
  confirm: StepStatus;
}

const IDLE_STEPS: StepState = {
  validate: "idle",
  build: "idle",
  send: "idle",
  confirm: "idle",
};

// ── Constants ──
const MONTH_OPTIONS = [
  { label: "ม.ค.", fullLabel: "มกราคม", value: 0 },
  { label: "ก.พ.", fullLabel: "กุมภาพันธ์", value: 1 },
  { label: "มี.ค.", fullLabel: "มีนาคม", value: 2 },
  { label: "เม.ย.", fullLabel: "เมษายน", value: 3 },
  { label: "พ.ค.", fullLabel: "พฤษภาคม", value: 4 },
  { label: "มิ.ย.", fullLabel: "มิถุนายน", value: 5 },
  { label: "ก.ค.", fullLabel: "กรกฎาคม", value: 6 },
  { label: "ส.ค.", fullLabel: "สิงหาคม", value: 7 },
  { label: "ก.ย.", fullLabel: "กันยายน", value: 8 },
  { label: "ต.ค.", fullLabel: "ตุลาคม", value: 9 },
  { label: "พ.ย.", fullLabel: "พฤศจิกายน", value: 10 },
  { label: "ธ.ค.", fullLabel: "ธันวาคม", value: 11 },
];

const PRESET_EMAILS = [
  { value: "wichuda.korn@schoolbright.co", label: "wichuda.korn@schoolbright.co" },
  { value: "thanat.light@schoolbright.co", label: "thanat.light@schoolbright.co" },
];

const CURRENT_YEAR = dayjs().year();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => ({
  label: `พ.ศ. ${CURRENT_YEAR - 2 + i + 543}`,
  value: CURRENT_YEAR - 2 + i,
}));

// ── Step Definitions ──
interface TrackerStep {
  key: keyof StepState;
  icon: React.ReactNode;
  label: string;
  desc: string;
}

const TRACKER_STEPS: TrackerStep[] = [
  {
    key: "validate",
    icon: <DatabaseOutlined />,
    label: "ตรวจสอบข้อมูล",
    desc: "ตรวจสอบช่วงเวลาและผู้รับอีเมล",
  },
  {
    key: "build",
    icon: <FileExcelOutlined />,
    label: "สร้าง Excel",
    desc: "สร้างไฟล์รายงานทุก range พร้อมกัน",
  },
  {
    key: "send",
    icon: <SendOutlined />,
    label: "ส่งอีเมล",
    desc: "แนบไฟล์และส่งไปยังผู้รับทุกราย",
  },
  {
    key: "confirm",
    icon: <MailOutlined />,
    label: "เสร็จสิ้น",
    desc: "อีเมลถูกส่งเรียบร้อยแล้ว",
  },
];

// ────────────────────────────────────────────────
// DeliveryTracker
// ────────────────────────────────────────────────
const DeliveryTracker: React.FC<{ steps: StepState; visible: boolean }> = ({
  steps,
  visible,
}) => {
  const { token } = theme.useToken();
  if (!visible) return null;

  const colorMap: Record<StepStatus, string> = {
    idle: token.colorBorderSecondary,
    active: token.colorPrimary,
    done: token.colorSuccess,
    error: token.colorError,
  };
  const bgMap: Record<StepStatus, string> = {
    idle: token.colorFillAlter,
    active: token.colorPrimaryBg,
    done: token.colorSuccessBg,
    error: token.colorErrorBg,
  };

  return (
    <Flex
      vertical
      gap={0}
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        overflow: "hidden",
        background: token.colorBgContainer,
      }}
    >
      {/* Header */}
      <Flex
        align="center"
        gap={8}
        style={{
          padding: "10px 16px",
          background: token.colorFillAlter,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <ThunderboltOutlined style={{ color: token.colorPrimary, fontSize: 13 }} />
        <Text style={{ fontSize: 12, fontWeight: 600, color: token.colorTextSecondary }}>
          สถานะการดำเนินการ
        </Text>
      </Flex>

      {/* Steps */}
      <Flex style={{ padding: "16px 20px" }} align="flex-start">
        {TRACKER_STEPS.map((step, idx) => {
          const status = steps[step.key];
          const color = colorMap[status];
          const bg = bgMap[status];
          const isLast = idx === TRACKER_STEPS.length - 1;

          return (
            <Flex key={step.key} align="flex-start" style={{ flex: 1, minWidth: 0 }}>
              {/* Node + label */}
              <Flex vertical align="center" gap={6} style={{ flex: "0 0 auto", minWidth: 72 }}>
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: `2px solid ${color}`,
                    backgroundColor: bg,
                    transition: "all 0.35s ease",
                    boxShadow:
                      status === "active"
                        ? `0 0 0 5px ${token.colorPrimaryBg}, 0 0 12px ${token.colorPrimary}40`
                        : "none",
                    position: "relative",
                  }}
                >
                  {status === "active" ? (
                    <LoadingOutlined style={{ color, fontSize: 18 }} spin />
                  ) : status === "done" ? (
                    <CheckCircleFilled style={{ color, fontSize: 18 }} />
                  ) : status === "error" ? (
                    <CloseCircleFilled style={{ color, fontSize: 18 }} />
                  ) : (
                    <span style={{ color, fontSize: 16 }}>{step.icon}</span>
                  )}
                </Flex>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: status === "active" || status === "done" ? 700 : 400,
                    color: status === "idle" ? token.colorTextDisabled : color,
                    textAlign: "center",
                    lineHeight: 1.3,
                    transition: "all 0.3s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.label}
                </Text>
                {status !== "idle" && (
                  <Text
                    style={{
                      fontSize: 10,
                      color:
                        status === "active"
                          ? token.colorPrimary
                          : status === "done"
                          ? token.colorSuccess
                          : status === "error"
                          ? token.colorError
                          : token.colorTextDisabled,
                      textAlign: "center",
                      lineHeight: 1.3,
                      maxWidth: 72,
                      whiteSpace: "normal",
                      transition: "all 0.3s",
                    }}
                  >
                    {step.desc}
                  </Text>
                )}
              </Flex>

              {/* Connector */}
              {!isLast && (
                <div
                  style={{
                    flex: 1,
                    height: 3,
                    marginTop: 20,
                    marginInline: 4,
                    borderRadius: 2,
                    background:
                      status === "done"
                        ? `linear-gradient(90deg, ${token.colorSuccess}, ${token.colorSuccessBg})`
                        : status === "active"
                        ? `linear-gradient(90deg, ${token.colorPrimary} 50%, ${token.colorBorderSecondary} 100%)`
                        : token.colorFillSecondary,
                    transition: "background 0.5s ease",
                  }}
                />
              )}
            </Flex>
          );
        })}
      </Flex>
    </Flex>
  );
};

// ────────────────────────────────────────────────
// EmailExportModal
// ────────────────────────────────────────────────
export const EmailExportModal: React.FC = () => {
  const { token } = theme.useToken();
  const { emailModalVisible, emailLoading, setEmailModalVisible, sendEmail } =
    useCapturableStore();

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([dayjs().month()]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [steps, setSteps] = useState<StepState>(IDLE_STEPS);
  const [isDone, setIsDone] = useState(false);

  const setStep = (key: keyof StepState, status: StepStatus) =>
    setSteps((prev) => ({ ...prev, [key]: status }));

  // ── สร้าง ranges จาก selectedMonths ──
  const selectedRanges = useMemo<DateRange[]>(() =>
    [...selectedMonths]
      .sort((a, b) => a - b)
      .map((month) => ({
        start_date: dayjs().year(selectedYear).month(month).startOf("month").format("YYYY-MM-DD"),
        end_date: dayjs().year(selectedYear).month(month).endOf("month").format("YYYY-MM-DD"),
      })),
    [selectedYear, selectedMonths],
  );

  // ── เพิ่มอีเมล ──
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

  // ── ส่งอีเมล ──
  const handleSend = useCallback(async () => {
    if (selectedMonths.length === 0) {
      toast.error("โปรดเลือกอย่างน้อย 1 เดือน");
      return;
    }
    if (recipients.length === 0) {
      toast.error("โปรดระบุอีเมลผู้รับอย่างน้อย 1 รายการ");
      return;
    }

    setSteps(IDLE_STEPS);
    setIsDone(false);

    setStep("validate", "active");
    await new Promise((r) => setTimeout(r, 400));
    setStep("validate", "done");

    setStep("build", "active");
    await new Promise((r) => setTimeout(r, 300));
    setStep("build", "done");

    setStep("send", "active");
    const success = await sendEmail(selectedRanges, recipients);

    if (success) {
      setStep("send", "done");
      setStep("confirm", "done");
      setIsDone(true);
    } else {
      setStep("send", "error");
    }
  }, [selectedMonths, recipients, selectedRanges, sendEmail]);

  const handleClose = () => {
    if (emailLoading) return;
    setSteps(IDLE_STEPS);
    setIsDone(false);
    setRecipients([]);
    setEmailInput("");
    setSelectedMonths([dayjs().month()]);
    setEmailModalVisible(false);
  };

  const isTracking = Object.values(steps).some((s) => s !== "idle");

  // ── quick select helpers ──
  const selectAllMonths = () => setSelectedMonths(MONTH_OPTIONS.map((m) => m.value));
  const selectQ = (months: number[]) => setSelectedMonths(months);

  return (
    <Modal
      open={emailModalVisible}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      width={680}
      centered
      closable={!emailLoading}
      maskClosable={!emailLoading}
      styles={{
        content: { padding: 0, borderRadius: token.borderRadiusLG, overflow: "hidden" },
        body: { padding: 0 },
        header: { display: "none" },
      }}
    >
      <Flex vertical>
        {/* ── Modal Header ── */}
        <Flex
          align="center"
          justify="space-between"
          style={{
            padding: "18px 24px 16px",
            background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%)`,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex align="center" gap={12}>
            <Flex
              align="center"
              justify="center"
              style={{
                width: 44,
                height: 44,
                borderRadius: token.borderRadiusLG,
                background: token.colorPrimary,
                flexShrink: 0,
              }}
            >
              <MailOutlined style={{ fontSize: 20, color: "#fff" }} />
            </Flex>
            <Flex vertical gap={2}>
              <Text strong style={{ fontSize: 15, lineHeight: 1.3 }}>
                ส่ง Capitalization Report ทางอีเมล
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                เลือกปีและเดือน — ส่งหลาย report ในอีเมลเดียว
              </Text>
            </Flex>
          </Flex>
          {!emailLoading && (
            <Button
              onClick={handleClose}
              size="small"
              type="text"
              style={{ color: token.colorTextSecondary, fontSize: 18, lineHeight: 1 }}
            >
              ×
            </Button>
          )}
        </Flex>

        {/* ── Scrollable Content ── */}
        <Flex
          vertical
          gap={16}
          style={{
            padding: "20px 24px 24px",
            maxHeight: "75vh",
            overflowY: "auto",
            background: token.colorBgLayout,
          }}
        >
          {/* Delivery Tracker */}
          <DeliveryTracker steps={steps} visible={isTracking} />

          {/* Success Banner */}
          {isDone && (
            <Flex
              align="center"
              gap={10}
              style={{
                padding: "14px 18px",
                borderRadius: token.borderRadiusLG,
                background: token.colorSuccessBg,
                border: `1px solid ${token.colorSuccessBorder}`,
              }}
            >
              <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 20 }} />
              <Flex vertical gap={1}>
                <Text strong style={{ fontSize: 13, color: token.colorSuccess }}>
                  ส่งอีเมลเรียบร้อยแล้ว
                </Text>
                <Text style={{ fontSize: 12, color: token.colorSuccessText }}>
                  ส่ง {selectedMonths.length} ไฟล์ไปยัง {recipients.length} ที่อยู่สำเร็จ
                </Text>
              </Flex>
            </Flex>
          )}

          {/* ── Section 1: เลือกปีและเดือน ── */}
          <Card
            variant="borderless"
            styles={{ body: { padding: 0 } }}
            style={{
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${token.colorBorderSecondary}`,
              overflow: "hidden",
            }}
          >
            {/* Card Header */}
            <Flex
              align="center"
              justify="space-between"
              style={{
                padding: "12px 18px",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorFillAlter,
              }}
            >
              <Flex align="center" gap={8}>
                <CalendarOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
                <Text strong style={{ fontSize: 13 }}>เลือกปีและเดือน</Text>
                {selectedMonths.length > 0 && (
                  <Tag
                    bordered={false}
                    style={{
                      borderRadius: 99,
                      fontSize: 11,
                      padding: "0 8px",
                      background: token.colorPrimaryBg,
                      color: token.colorPrimary,
                    }}
                  >
                    {selectedMonths.length} เดือน · {selectedMonths.length} ไฟล์
                  </Tag>
                )}
              </Flex>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                options={YEAR_OPTIONS}
                style={{ width: 136 }}
                size="small"
                disabled={emailLoading || isDone}
              />
            </Flex>

            <Flex vertical gap={12} style={{ padding: "14px 18px" }}>
              {/* Quick select */}
              <Flex align="center" gap={6} wrap="wrap">
                <Text type="secondary" style={{ fontSize: 11 }}>เลือกเร็ว:</Text>
                {[
                  { label: "ทั้งปี", action: selectAllMonths },
                  { label: "Q1", action: () => selectQ([0, 1, 2]) },
                  { label: "Q2", action: () => selectQ([3, 4, 5]) },
                  { label: "Q3", action: () => selectQ([6, 7, 8]) },
                  { label: "Q4", action: () => selectQ([9, 10, 11]) },
                  { label: "H1", action: () => selectQ([0, 1, 2, 3, 4, 5]) },
                  { label: "H2", action: () => selectQ([6, 7, 8, 9, 10, 11]) },
                ].map((q) => (
                  <Tag
                    key={q.label}
                    onClick={!emailLoading && !isDone ? q.action : undefined}
                    style={{
                      cursor: emailLoading || isDone ? "default" : "pointer",
                      borderRadius: 99,
                      fontSize: 11,
                      padding: "1px 10px",
                      border: `1px solid ${token.colorBorderSecondary}`,
                      background: token.colorBgContainer,
                      userSelect: "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {q.label}
                  </Tag>
                ))}
                {selectedMonths.length > 0 && (
                  <Tag
                    onClick={!emailLoading && !isDone ? () => setSelectedMonths([]) : undefined}
                    style={{
                      cursor: emailLoading || isDone ? "default" : "pointer",
                      borderRadius: 99,
                      fontSize: 11,
                      padding: "1px 10px",
                      border: `1px solid ${token.colorErrorBorder}`,
                      background: token.colorErrorBg,
                      color: token.colorError,
                      userSelect: "none",
                    }}
                  >
                    ล้าง
                  </Tag>
                )}
              </Flex>

              {/* Month Grid */}
              <Checkbox.Group
                value={selectedMonths}
                onChange={(vals) => setSelectedMonths(vals as number[])}
                disabled={emailLoading || isDone}
                style={{ width: "100%" }}
              >
                <Row gutter={[8, 8]}>
                  {MONTH_OPTIONS.map((m) => {
                    const checked = selectedMonths.includes(m.value);
                    return (
                      <Col span={4} key={m.value}>
                        <Flex
                          align="center"
                          justify="center"
                          style={{
                            height: 48,
                            borderRadius: token.borderRadius,
                            border: `1.5px solid ${checked ? token.colorPrimary : token.colorBorderSecondary}`,
                            background: checked ? token.colorPrimaryBg : token.colorBgContainer,
                            cursor: emailLoading || isDone ? "default" : "pointer",
                            transition: "all 0.2s",
                            position: "relative",
                          }}
                          onClick={
                            !emailLoading && !isDone
                              ? () =>
                                  setSelectedMonths((prev) =>
                                    prev.includes(m.value)
                                      ? prev.filter((v) => v !== m.value)
                                      : [...prev, m.value],
                                  )
                              : undefined
                          }
                        >
                          <Checkbox value={m.value} style={{ display: "none" }} />
                          <Flex vertical align="center" gap={1}>
                            <Text
                              strong={checked}
                              style={{
                                fontSize: 12,
                                color: checked ? token.colorPrimary : token.colorText,
                                transition: "color 0.2s",
                              }}
                            >
                              {m.label}
                            </Text>
                            {checked && (
                              <div
                                style={{
                                  width: 16,
                                  height: 2,
                                  borderRadius: 1,
                                  background: token.colorPrimary,
                                }}
                              />
                            )}
                          </Flex>
                        </Flex>
                      </Col>
                    );
                  })}
                </Row>
              </Checkbox.Group>

              {/* Preview files */}
              {selectedMonths.length > 0 && (
                <Flex vertical gap={4}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    ไฟล์ที่จะส่ง ({selectedMonths.length} ไฟล์):
                  </Text>
                  <Flex wrap="wrap" gap={4}>
                    {selectedRanges.map((r) => (
                      <Tag
                        key={r.start_date}
                        icon={<FileExcelOutlined />}
                        bordered={false}
                        color="green"
                        style={{ fontSize: 11, borderRadius: 6 }}
                      >
                        {dayjs(r.start_date).format("MMM YYYY")}
                      </Tag>
                    ))}
                  </Flex>
                </Flex>
              )}
            </Flex>
          </Card>

          {/* ── Section 2: อีเมลผู้รับ ── */}
          <Card
            variant="borderless"
            styles={{ body: { padding: 0 } }}
            style={{
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${token.colorBorderSecondary}`,
              overflow: "hidden",
            }}
          >
            <Flex
              align="center"
              justify="space-between"
              style={{
                padding: "12px 18px",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorFillAlter,
              }}
            >
              <Flex align="center" gap={8}>
                <MailOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
                <Text strong style={{ fontSize: 13 }}>ผู้รับอีเมล</Text>
                {recipients.length > 0 && (
                  <Tag
                    bordered={false}
                    style={{
                      borderRadius: 99,
                      fontSize: 11,
                      padding: "0 8px",
                      background: token.colorInfoBg,
                      color: token.colorInfo,
                    }}
                  >
                    {recipients.length} ที่อยู่
                  </Tag>
                )}
              </Flex>
            </Flex>

            <Flex vertical gap={12} style={{ padding: "14px 18px" }}>
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
                  onKeyDown={(e) => { if (e.key === "Enter") addEmail(); }}
                  disabled={emailLoading || isDone}
                />
                <Button
                  icon={<CloudUploadOutlined />}
                  onClick={addEmail}
                  disabled={emailLoading || isDone || !emailInput}
                  style={{ borderRadius: token.borderRadius }}
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
                      onClose={() => setRecipients((prev) => prev.filter((e) => e !== email))}
                      color="blue"
                      style={{ fontSize: 12, borderRadius: token.borderRadius }}
                    >
                      {email}
                    </Tag>
                  ))}
                </Flex>
              )}

              {recipients.length === 0 && (
                <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
                  ยังไม่มีผู้รับ — พิมพ์อีเมลแล้วกด Enter หรือ "เพิ่ม"
                </Text>
              )}
            </Flex>
          </Card>
        </Flex>

        {/* ── Footer ── */}
        <Flex
          justify="space-between"
          align="center"
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            {selectedMonths.length > 0 && recipients.length > 0
              ? `จะส่ง ${selectedMonths.length} ไฟล์ → ${recipients.length} ที่อยู่`
              : "เลือกเดือนและผู้รับก่อนส่ง"}
          </Text>
          <Flex gap={10}>
            <Button
              onClick={handleClose}
              disabled={emailLoading}
              style={{ borderRadius: token.borderRadius }}
            >
              {isDone ? "ปิด" : "ยกเลิก"}
            </Button>
            {!isDone && (
              <Button
                type="primary"
                loading={emailLoading}
                onClick={handleSend}
                disabled={selectedMonths.length === 0 || recipients.length === 0}
                icon={<SendOutlined />}
                style={{
                  borderRadius: token.borderRadius,
                  fontWeight: 600,
                  background:
                    selectedMonths.length > 0 && recipients.length > 0
                      ? `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`
                      : undefined,
                  border: "none",
                  boxShadow:
                    selectedMonths.length > 0 && recipients.length > 0
                      ? `0 4px 12px ${token.colorPrimaryBorder}`
                      : "none",
                }}
              >
                ส่ง {selectedMonths.length > 0 ? `${selectedMonths.length} ไฟล์` : ""}
              </Button>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  );
};
