"use client";
import {
  CalendarOutlined,
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
  Checkbox,
  Col,
  Flex,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// ====================================================================
// Types & Constants
// ====================================================================

type ExportModalTemplate4Props = {
  visible: boolean;
  onClose: () => void;
};

type DeliveryStep = "idle" | "active" | "done" | "error";

interface StepState {
  prepare: DeliveryStep;
  excel: DeliveryStep;
  send: DeliveryStep;
  done: DeliveryStep;
}

const PRESET_EMAILS = [
  {
    value: "wichuda.korn@schoolbright.co",
    label: "wichuda.korn@schoolbright.co",
  },
  {
    value: "thanat.light@schoolbright.co",
    label: "thanat.light@schoolbright.co",
  },
];

const MONTH_OPTIONS = [
  { label: "มกราคม", value: 0 },
  { label: "กุมภาพันธ์", value: 1 },
  { label: "มีนาคม", value: 2 },
  { label: "เมษายน", value: 3 },
  { label: "พฤษภาคม", value: 4 },
  { label: "มิถุนายน", value: 5 },
  { label: "กรกฎาคม", value: 6 },
  { label: "สิงหาคม", value: 7 },
  { label: "กันยายน", value: 8 },
  { label: "ตุลาคม", value: 9 },
  { label: "พฤศจิกายน", value: 10 },
  { label: "ธันวาคม", value: 11 },
];

const IDLE_STEPS: StepState = {
  prepare: "idle",
  excel: "idle",
  send: "idle",
  done: "idle",
};

// ====================================================================
// DeliveryTracker: แสดงสถานะการส่งจากซ้ายไปขวา
// ====================================================================

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
            {/* Node */}
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
              <Typography.Text
                style={{
                  fontSize: 11,
                  fontWeight:
                    status === "active" || status === "done" ? 700 : 500,
                  color: status === "idle" ? token.colorTextDisabled : color,
                  whiteSpace: "nowrap",
                  transition: "all 0.3s",
                }}
              >
                {step.label}
              </Typography.Text>
            </Flex>

            {/* Connector */}
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

// ====================================================================
// ExportModalTemplate4
// ====================================================================

export default function ExportModalTemplate4({
  visible,
  onClose,
}: ExportModalTemplate4Props) {
  const { token } = theme.useToken();

  const [selectedMonths, setSelectedMonths] = useState<number[]>([
    dayjs().month(),
  ]);
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [recipients, setRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState<string>("");
  const [steps, setSteps] = useState<StepState>(IDLE_STEPS);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // อัปเดต step แต่ละขั้น
  const setStep = (key: keyof StepState, status: DeliveryStep) => {
    setSteps((prev) => ({ ...prev, [key]: status }));
  };

  // เพิ่มอีเมลจาก input
  const addEmail = useCallback(() => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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

  // ส่ง Audit Report ผ่านอีเมลทีละเดือน
  const requestSendEmail = useCallback(async () => {
    if (selectedMonths.length === 0) {
      toast.error("โปรดเลือกอย่างน้อย 1 เดือน");
      return;
    }
    if (recipients.length === 0) {
      toast.error("โปรดระบุอีเมลผู้รับอย่างน้อย 1 รายการ");
      return;
    }

    const payloads = selectedMonths
      .sort((a, b) => a - b)
      .map((month) => ({
        start_date: dayjs()
          .year(selectedYear)
          .month(month)
          .startOf("month")
          .format("YYYY-MM-DD"),
        end_date: dayjs()
          .year(selectedYear)
          .month(month)
          .endOf("month")
          .format("YYYY-MM-DD"),
      }));

    setIsRunning(true);
    setIsDone(false);
    setSteps(IDLE_STEPS);

    try {
      for (let i = 0; i < payloads.length; i++) {
        const payload = payloads[i];
        const monthLabel =
          MONTH_OPTIONS[selectedMonths.sort((a, b) => a - b)[i] ?? 0]?.label ??
          "";

        if (!payload) continue;

        // ขั้น 1: เตรียมข้อมูล
        setStep("prepare", "active");
        await new Promise((r) => setTimeout(r, 300));
        setStep("prepare", "done");

        // ขั้น 2: สร้าง Excel + ส่งอีเมล (เรียก API)
        setStep("excel", "active");
        await new Promise((r) => setTimeout(r, 200));
        setStep("excel", "done");
        setStep("send", "active");

        const response = await axios.post(
          "/api/v1/timesheet/excel/template_4/send-email",
          {
            start_date: payload.start_date,
            end_date: payload.end_date,
            recipients,
          },
        );

        setStep("send", "done");

        if (payloads.length > 1) {
          toast.info(
            `ส่งเดือน ${monthLabel} สำเร็จ (${i + 1}/${payloads.length})`,
            {
              duration: 1500,
            },
          );
          // reset สำหรับ loop ถัดไป
          if (i < payloads.length - 1) {
            setSteps(IDLE_STEPS);
            await new Promise((r) => setTimeout(r, 600));
          }
        }

        if (response.data?.data?.failed > 0) {
          toast.warning(`ส่งไม่สำเร็จ ${response.data.data.failed} ที่อยู่`);
        }
      }

      // ขั้นสุดท้าย: Done
      setStep("done", "done");
      setIsDone(true);
      toast.success(`ส่ง Audit Report สำเร็จ ${selectedMonths.length} เดือน`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      setStep("send", "error");
      toast.error("ส่งอีเมลไม่สำเร็จ: " + message);
    } finally {
      setIsRunning(false);
    }
  }, [selectedMonths, selectedYear, recipients]);

  const handleClose = () => {
    if (isRunning) return;
    setSteps(IDLE_STEPS);
    setIsDone(false);
    setRecipients([]);
    setEmailInput("");
    onClose();
  };

  const currentYear = dayjs().year();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    label: `พ.ศ. ${currentYear - 2 + i + 543}`,
    value: currentYear - 2 + i,
  }));

  const isTracking =
    steps.prepare !== "idle" ||
    steps.excel !== "idle" ||
    steps.send !== "idle" ||
    steps.done !== "idle";

  return (
    <Modal
      title={
        <Space size={12}>
          <FileTextOutlined style={{ color: token.colorPrimary }} />
          <Typography.Text style={{ fontWeight: 600, fontSize: 16 }}>
            Export Audit Report (Template 4)
          </Typography.Text>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      width={620}
      centered
      closable={!isRunning}
      maskClosable={!isRunning}
      styles={{ body: { padding: "12px 0 0 0" } }}
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
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            ระบบจะสร้าง Excel แยกตามเดือนที่เลือก
            แล้วส่งเป็นไฟล์แนบไปยังอีเมลที่ระบุ
          </Typography.Text>
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
            <CheckCircleFilled
              style={{ color: token.colorSuccess, fontSize: 18 }}
            />
            <Typography.Text
              style={{ color: token.colorSuccess, fontWeight: 600 }}
            >
              ส่งอีเมลเรียบร้อยแล้ว
            </Typography.Text>
          </Flex>
        )}

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
              <Typography.Text style={{ fontWeight: 600 }}>
                ผู้รับอีเมล
              </Typography.Text>
            </Space>

            {/* Autocomplete Input */}
            <Flex gap={8}>
              <AutoComplete
                value={emailInput}
                onChange={setEmailInput}
                onSelect={(val) => {
                  setEmailInput(val);
                }}
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
                disabled={isRunning}
              />
              <Button
                icon={<CloudUploadOutlined />}
                onClick={addEmail}
                disabled={isRunning || !emailInput}
                shape="round"
              >
                เพิ่ม
              </Button>
            </Flex>

            {/* รายการอีเมล */}
            {recipients.length > 0 && (
              <Flex wrap="wrap" gap={6}>
                {recipients.map((email) => (
                  <Tag
                    key={email}
                    icon={<MailOutlined />}
                    closable={!isRunning}
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

        {/* เลือกปีและเดือน */}
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            background: token.colorFillAlter,
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Flex vertical gap={16}>
            <Flex justify="space-between" align="center">
              <Space size={8}>
                <CalendarOutlined style={{ color: token.colorPrimary }} />
                <Typography.Text style={{ fontWeight: 600 }}>
                  เลือกปีและเดือน
                </Typography.Text>
              </Space>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 140 }}
                options={yearOptions}
                disabled={isRunning}
              />
            </Flex>

            <Card
              bordered={false}
              styles={{ body: { padding: 16 } }}
              style={{
                background: token.colorBgContainer,
                borderRadius: token.borderRadius,
              }}
            >
              <Checkbox.Group
                value={selectedMonths}
                onChange={(values) => setSelectedMonths(values as number[])}
                style={{ width: "100%" }}
                disabled={isRunning}
              >
                <Row gutter={[0, 12]}>
                  {MONTH_OPTIONS.map((month) => (
                    <Col span={6} key={month.value}>
                      <Checkbox value={month.value}>{month.label}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Card>
          </Flex>
        </Card>

        {/* ปุ่มดำเนินการ */}
        <Flex justify="flex-end" gap={12}>
          <Button onClick={handleClose} shape="round" disabled={isRunning}>
            {isDone ? "ปิด" : "ยกเลิก"}
          </Button>
          {!isDone && (
            <Button
              type="primary"
              loading={isRunning}
              onClick={requestSendEmail}
              disabled={selectedMonths.length === 0 || recipients.length === 0}
              shape="round"
              icon={<SendOutlined />}
              style={{ fontWeight: 500 }}
            >
              ส่งอีเมล{" "}
              {selectedMonths.length > 0
                ? `${selectedMonths.length} เดือน`
                : ""}
            </Button>
          )}
        </Flex>
      </Flex>
    </Modal>
  );
}
