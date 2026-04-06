"use client";

import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloudServerOutlined,
  DiscordOutlined,
  LoadingOutlined,
  MailOutlined,
  RocketOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Flex, Modal, theme, Typography } from "antd";
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
}

const STEPS: StepDef[] = [
  {
    key: 1,
    icon: <CloudServerOutlined />,
    label: "เตรียมข้อมูล",
    sublabel: "รวบรวมรายงานไทม์ชีท",
  },
  {
    key: 2,
    icon: <MailOutlined />,
    label: "ส่ง Email",
    sublabel: "sa@ · thanat.light@",
  },
  {
    key: 3,
    icon: <DiscordOutlined />,
    label: "ส่ง Discord",
    sublabel: "Timesheet System Channel",
  },
  {
    key: 4,
    icon: <SendOutlined />,
    label: "สำเร็จ",
    sublabel: "ส่งแจ้งเตือนครบทุกช่องทาง",
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
            boxShadow: status === "active" ? `0 0 0 4px ${token.colorPrimaryBg}` : "none",
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
          {/* Animated shimmer เมื่อ active */}
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

/**
 * แสดง Delivery Tracking Modal เมื่อกำลังส่งการแจ้งเตือน
 * อ่าน notifyStep จาก useDescriptionStore โดยตรง
 */
export const DeliveryTracker: React.FC = () => {
  const { token } = theme.useToken();

  const notifyStep = useDescriptionStore((s) => s.notifyStep);
  const notifyLoading = useDescriptionStore((s) => s.notifyLoading);

  const isVisible = notifyLoading || notifyStep === 4 || notifyStep === 5;

  const getStepStatus = (stepKey: number): StepStatus => {
    if (notifyStep === 5) {
      // error state — ทุก step ที่ผ่านแล้ว = done, step ปัจจุบัน = error
      if (stepKey < notifyStep) return "done";
      if (stepKey === notifyStep) return "error";
      return "idle";
    }
    if (stepKey < notifyStep) return "done";
    if (stepKey === notifyStep) return "active";
    return "idle";
  };

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

  return (
    <>
      {/* CSS animation สำหรับ shimmer */}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      <Modal
        open={isVisible}
        footer={null}
        closable={false}
        centered
        width={560}
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
            }}
          >
            {React.cloneElement(titleIcon, {
              style: { fontSize: 20, color: titleColor },
            } as React.HTMLAttributes<HTMLElement>)}
          </Flex>
          <Flex vertical gap={2}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: titleColor,
                transition: "color 0.3s",
              }}
            >
              {titleText}
            </Text>
            <Text style={{ fontSize: 12, color: token.colorTextDescription }}>
              SchoolBright Timesheet · Daily Notification
            </Text>
          </Flex>
        </Flex>

        {/* Tracker */}
        <Flex
          style={{
            padding: "36px 32px 32px",
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

        {/* Footer status text */}
        <Flex
          justify="center"
          style={{
            padding: "0 32px 24px",
            background: token.colorBgContainer,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: token.colorTextDescription,
              textAlign: "center",
            }}
          >
            {notifyStep === 1 && "กำลังรวบรวมข้อมูลพนักงานและรายงานไทม์ชีท..."}
            {notifyStep === 2 && "กำลังส่งอีเมลไปยัง sa@schoolbright.co และ thanat.light@schoolbright.co"}
            {notifyStep === 3 && "กำลังส่ง Webhook ไปยัง Discord Timesheet Channel..."}
            {notifyStep === 4 && "ส่งการแจ้งเตือนครบทุกช่องทางเรียบร้อยแล้ว"}
            {notifyStep === 5 && "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"}
          </Text>
        </Flex>
      </Modal>
    </>
  );
};
