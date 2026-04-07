"use client";

import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloudServerOutlined,
  DiscordOutlined,
  EyeOutlined,
  LoadingOutlined,
  MailOutlined,
  RocketOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Button, Flex, Modal, theme, Typography } from "antd";
import React from "react";
import { useDescriptionStore } from "../_stores/description-store";

const { Text } = Typography;

// ====================================================================
// Step definitions
// ====================================================================

interface StepDef {
  key: number;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  description: string;
}

const STEPS: StepDef[] = [
  {
    key: 1,
    icon: <CloudServerOutlined />,
    label: "เตรียมข้อมูล",
    sublabel: "รวบรวมรายงานไทม์ชีท",
    description: "กำลังดึงรายการพนักงานทั้งหมด คำนวณชั่วโมงรวม และจัดเตรียม payload สำหรับการแจ้งเตือน",
  },
  {
    key: 2,
    icon: <MailOutlined />,
    label: "ส่ง Email",
    sublabel: "ผู้รับหลายท่าน",
    description: "กำลังสร้าง HTML Email Template และส่งผ่าน SMTP ไปยังผู้รับที่กำหนดไว้ทั้งหมด",
  },
  {
    key: 3,
    icon: <DiscordOutlined />,
    label: "ส่ง Discord",
    sublabel: "Timesheet System Channel",
    description: "กำลังส่ง Webhook Embed ไปยัง Discord Channel พร้อมสรุปสถานะทีม",
  },
  {
    key: 4,
    icon: <SendOutlined />,
    label: "สำเร็จ",
    sublabel: "ส่งแจ้งเตือนครบทุกช่องทาง",
    description: "การแจ้งเตือนถูกส่งเรียบร้อยแล้ว ตรวจสอบรายละเอียดการส่งได้ที่ปุ่มด้านล่าง",
  },
];

// ====================================================================
// Single Step Node
// ====================================================================

type StepStatus = "idle" | "active" | "done" | "error";

const StepNode: React.FC<{
  step: StepDef;
  status: StepStatus;
  isLast: boolean;
}> = ({ step, status, isLast }) => {
  const { token } = theme.useToken();

  const colorMap: Record<StepStatus, string> = {
    idle: token.colorBorderSecondary,
    active: token.colorPrimary,
    done: token.colorSuccess,
    error: token.colorError,
  };

  const bgMap: Record<StepStatus, string> = {
    idle: token.colorBgLayout,
    active: token.colorPrimaryBg,
    done: token.colorSuccessBg,
    error: token.colorErrorBg,
  };

  const color = colorMap[status];
  const bg = bgMap[status];

  const iconNode =
    status === "active" ? (
      <LoadingOutlined style={{ fontSize: 22, color }} />
    ) : status === "done" ? (
      <CheckCircleFilled style={{ fontSize: 22, color }} />
    ) : status === "error" ? (
      <CloseCircleFilled style={{ fontSize: 22, color }} />
    ) : (
      React.cloneElement(step.icon as React.ReactElement<{ style?: React.CSSProperties }>, {
        style: { fontSize: 20, color },
      })
    );

  return (
    <Flex align="center" style={{ flex: 1, minWidth: 0 }}>
      {/* Node */}
      <Flex vertical align="center" gap={8} style={{ flex: "0 0 auto" }}>
        {/* Circle icon */}
        <Flex
          align="center"
          justify="center"
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            backgroundColor: bg,
            border: `2px solid ${color}`,
            transition: "all 0.4s ease",
            boxShadow:
              status === "active"
                ? `0 0 0 6px ${token.colorPrimaryBg}, 0 0 12px ${token.colorPrimary}40`
                : status === "done"
                  ? `0 0 8px ${token.colorSuccess}30`
                  : "none",
          }}
        >
          {iconNode}
        </Flex>

        {/* Label */}
        <Flex vertical align="center" gap={2}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: status === "active" || status === "done" ? 700 : 500,
              color: status === "idle" ? token.colorTextDisabled : color,
              whiteSpace: "nowrap",
              transition: "all 0.3s",
            }}
          >
            {step.label}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: status === "idle" ? token.colorTextDisabled : token.colorTextDescription,
              whiteSpace: "nowrap",
            }}
          >
            {step.sublabel}
          </Text>
        </Flex>
      </Flex>

      {/* Connector line */}
      {!isLast && (
        <div
          style={{
            flex: 1,
            height: 3,
            marginBottom: 32,
            marginInline: 8,
            borderRadius: 2,
            background:
              status === "done"
                ? `linear-gradient(90deg, ${token.colorSuccess}, ${token.colorSuccessBg})`
                : status === "active"
                  ? `linear-gradient(90deg, ${token.colorPrimary} 40%, ${token.colorBorderSecondary} 100%)`
                  : token.colorBorderSecondary,
            transition: "background 0.5s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {status === "active" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, transparent 0%, ${token.colorPrimary}80 50%, transparent 100%)`,
                animation: "shimmer 1.2s infinite",
              }}
            />
          )}
        </div>
      )}
    </Flex>
  );
};

// ====================================================================
// Delivery Tracker Modal
// ====================================================================

export const DeliveryTracker: React.FC = () => {
  const { token } = theme.useToken();

  const notifyStep = useDescriptionStore((s) => s.notifyStep);
  const notifyLoading = useDescriptionStore((s) => s.notifyLoading);
  const openNotifyResultDrawer = useDescriptionStore((s) => s.openNotifyResultDrawer);

  const isVisible = notifyLoading || notifyStep === 4 || notifyStep === 5;

  const getStepStatus = (stepKey: number): StepStatus => {
    if (notifyStep === 5) {
      if (stepKey < notifyStep) return "done";
      if (stepKey === notifyStep) return "error";
      return "idle";
    }
    if (stepKey < notifyStep) return "done";
    if (stepKey === notifyStep) return "active";
    return "idle";
  };

  const activeStep = STEPS.find((s) => getStepStatus(s.key) === "active");
  const currentDescription =
    notifyStep === 4
      ? "การแจ้งเตือนถูกส่งเรียบร้อยแล้ว กดปุ่มด้านล่างเพื่อดูรายละเอียดการส่ง"
      : notifyStep === 5
        ? "เกิดข้อผิดพลาดระหว่างการส่งแจ้งเตือน กรุณาตรวจสอบการเชื่อมต่อและลองใหม่"
        : activeStep?.description ?? "";

  const titleText =
    notifyStep === 4
      ? "ส่งการแจ้งเตือนสำเร็จ"
      : notifyStep === 5
        ? "เกิดข้อผิดพลาด"
        : "กำลังส่งการแจ้งเตือน...";

  const titleColor =
    notifyStep === 4
      ? token.colorSuccess
      : notifyStep === 5
        ? token.colorError
        : token.colorPrimary;

  const titleIcon =
    notifyStep === 4 ? (
      <CheckCircleFilled style={{ color: token.colorSuccess }} />
    ) : notifyStep === 5 ? (
      <CloseCircleFilled style={{ color: token.colorError }} />
    ) : (
      <RocketOutlined style={{ color: token.colorPrimary }} />
    );

  // Progress percentage
  const progressPct = notifyStep === 0 ? 0 : notifyStep >= 4 ? 100 : Math.round(((notifyStep - 1) / (STEPS.length - 1)) * 100);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>

      <Modal
        open={isVisible}
        footer={null}
        closable={false}
        centered
        width={600}
        styles={{
          content: {
            borderRadius: token.borderRadiusLG,
            padding: 0,
            overflow: "hidden",
          },
          body: { padding: 0 },
        }}
      >
        {/* Header */}
        <Flex
          align="center"
          gap={12}
          style={{
            padding: "24px 32px 20px",
            background:
              notifyStep === 4
                ? `linear-gradient(135deg, ${token.colorSuccessBg}, ${token.colorBgContainer})`
                : notifyStep === 5
                  ? `linear-gradient(135deg, ${token.colorErrorBg}, ${token.colorBgContainer})`
                  : `linear-gradient(135deg, ${token.colorPrimaryBg}, ${token.colorBgContainer})`,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            transition: "background 0.5s",
          }}
        >
          <Flex
            align="center"
            justify="center"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: token.colorBgContainer,
              border: `1.5px solid ${titleColor}`,
              flexShrink: 0,
              boxShadow: `0 0 10px ${titleColor}30`,
            }}
          >
            {React.cloneElement(titleIcon, {
              style: { fontSize: 20, color: titleColor },
            } as React.HTMLAttributes<HTMLElement>)}
          </Flex>
          <Flex vertical gap={2} style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: 700, color: titleColor, transition: "color 0.3s" }}>
              {titleText}
            </Text>
            <Text style={{ fontSize: 12, color: token.colorTextDescription }}>
              SchoolBright Timesheet · Daily Notification System
            </Text>
          </Flex>
          {/* Step badge */}
          <Flex
            align="center"
            justify="center"
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              background: notifyStep >= 4 ? token.colorSuccessBg : token.colorPrimaryBg,
              border: `1px solid ${notifyStep >= 4 ? token.colorSuccessBorder : token.colorPrimaryBorder}`,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 700, color: notifyStep >= 4 ? token.colorSuccess : token.colorPrimary }}>
              {notifyStep >= 4 ? "เสร็จสิ้น" : `ขั้นตอน ${notifyStep} / ${STEPS.length}`}
            </Text>
          </Flex>
        </Flex>

        {/* Overall progress bar */}
        <div style={{ height: 3, background: token.colorBgLayout }}>
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: notifyStep === 4
                ? `linear-gradient(90deg, ${token.colorSuccess}, ${token.colorSuccessActive})`
                : `linear-gradient(90deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
              transition: "width 0.6s ease",
              borderRadius: "0 2px 2px 0",
            }}
          />
        </div>

        {/* Tracker */}
        <Flex
          style={{
            padding: "36px 32px 8px",
            background: token.colorBgContainer,
          }}
        >
          {STEPS.map((step, idx) => (
            <StepNode
              key={step.key}
              step={step}
              status={getStepStatus(step.key)}
              isLast={idx === STEPS.length - 1}
            />
          ))}
        </Flex>

        {/* Description box */}
        <Flex
          style={{
            padding: "16px 32px 24px",
            background: token.colorBgContainer,
          }}
          vertical
          gap={16}
        >
          <Flex
            align="flex-start"
            gap={10}
            style={{
              padding: "14px 18px",
              borderRadius: token.borderRadius,
              background: notifyStep === 4
                ? token.colorSuccessBg
                : notifyStep === 5
                  ? token.colorErrorBg
                  : token.colorFillQuaternary,
              border: `1px solid ${notifyStep === 4 ? token.colorSuccessBorder : notifyStep === 5 ? token.colorErrorBorder : token.colorBorderSecondary}`,
              minHeight: 48,
            }}
          >
            {notifyStep > 0 && notifyStep < 4 && (
              <LoadingOutlined style={{ color: token.colorPrimary, marginTop: 2, flexShrink: 0 }} />
            )}
            {notifyStep === 4 && (
              <CheckCircleFilled style={{ color: token.colorSuccess, marginTop: 2, flexShrink: 0 }} />
            )}
            {notifyStep === 5 && (
              <CloseCircleFilled style={{ color: token.colorError, marginTop: 2, flexShrink: 0 }} />
            )}
            <Text
              style={{
                fontSize: 12,
                color: notifyStep === 4
                  ? token.colorSuccess
                  : notifyStep === 5
                    ? token.colorError
                    : token.colorTextSecondary,
                lineHeight: 1.6,
              }}
            >
              {currentDescription}
            </Text>
          </Flex>

          {/* ปุ่มดูผลลัพธ์ — แสดงเฉพาะเมื่อ done */}
          {notifyStep === 4 && (
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="large"
              block
              onClick={openNotifyResultDrawer}
              style={{
                background: `linear-gradient(135deg, ${token.colorSuccess}, ${token.colorSuccessActive})`,
                border: "none",
                fontWeight: 600,
                borderRadius: token.borderRadius,
                boxShadow: `0 4px 12px ${token.colorSuccess}40`,
              }}
            >
              ดูรายละเอียดผลการส่ง
            </Button>
          )}
        </Flex>
      </Modal>
    </>
  );
};
