"use client";

import DashboardLayout from "@components/layouts/backend-layout";
import { Card, Flex, Tag, theme, Typography } from "antd";

const { Text, Paragraph } = Typography;

// รายการ Endpoints ทั้งหมดของระบบ LINE สำหรับแสดงในตาราง Summary
const ENDPOINT_SUMMARY = [
  {
    method: "GET",
    path: "/application/line/webhook",
    desc: "ตรวจสอบสถานะ Webhook",
    tag: "Webhook",
  },
  {
    method: "POST",
    path: "/application/line/webhook",
    desc: "รับ Event จาก LINE",
    tag: "Webhook",
  },
  {
    method: "GET",
    path: "/application/line/groups",
    desc: "ดึงรายชื่อกลุ่ม",
    tag: "Groups",
  },
  {
    method: "PUT",
    path: "/application/line/groups",
    desc: "ตั้งค่ากลุ่มเป้าหมาย",
    tag: "Groups",
  },
  {
    method: "GET",
    path: "/hardware/machine-monitoring/channel/line",
    desc: "ส่งรายงานภาพรวม",
    tag: "Reports",
  },
  {
    method: "GET",
    path: "/hardware/machine-monitoring/channel/line/{school_id}",
    desc: "ส่งรายงานรายโรงเรียน",
    tag: "Reports",
  },
] as const;

const METHOD_COLOR: Record<string, string> = {
  GET: "#1677ff",
  POST: "#52c41a",
  PUT: "#fa8c16",
};
const TAG_COLOR: Record<string, string> = {
  Webhook: "purple",
  Groups: "cyan",
  Reports: "orange",
};

// Payload จำลองสำหรับทดสอบ LINE Webhook POST แต่ละประเภท
const PAYLOAD_JOIN = JSON.stringify(
  {
    destination: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    events: [
      {
        type: "join",
        replyToken: "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
        source: { type: "group", groupId: "Ca56f94637cc4347f90a6f4719b" },
        timestamp: Date.now(),
        mode: "active",
      },
    ],
  },
  null,
  2,
);

const PAYLOAD_MESSAGE_LUID = JSON.stringify(
  {
    destination: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    events: [
      {
        type: "message",
        replyToken: "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
        source: {
          type: "group",
          groupId: "Ca56f94637cc4347f90a6f4719b",
          userId: "U4af4980629...",
        },
        timestamp: Date.now(),
        mode: "active",
        message: { id: "444573844083572737", type: "text", text: "/luid" },
      },
    ],
  },
  null,
  2,
);

const PAYLOAD_MESSAGE_STATUS = JSON.stringify(
  {
    destination: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    events: [
      {
        type: "message",
        replyToken: "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
        source: {
          type: "group",
          groupId: "Ca56f94637cc4347f90a6f4719b",
          userId: "U4af4980629...",
        },
        timestamp: Date.now(),
        mode: "active",
        message: { id: "444573844083572738", type: "text", text: "สถานะ" },
      },
    ],
  },
  null,
  2,
);

const PAYLOAD_MESSAGE_SEARCH = JSON.stringify(
  {
    destination: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    events: [
      {
        type: "message",
        replyToken: "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
        source: {
          type: "group",
          groupId: "Ca56f94637cc4347f90a6f4719b",
          userId: "U4af4980629...",
        },
        timestamp: Date.now(),
        mode: "active",
        message: {
          id: "444573844083572739",
          type: "text",
          text: "โรงเรียนสาธิต",
        },
      },
    ],
  },
  null,
  2,
);

/**
 * หน้าเอกสาร LINE API Documentation สำหรับนักพัฒนา
 */

// Component กล่อง Section พร้อม accent bar ด้านซ้าย
function SectionCard({
  id,
  icon,
  title,
  children,
  accentColor,
  extra,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accentColor: string;
  extra?: React.ReactNode;
}) {
  return (
    <Card
      id={id}
      style={{
        marginBottom: 24,
        borderRadius: 16,
        borderLeft: `4px solid ${accentColor}`,
      }}
      styles={{ body: { padding: "20px 24px" } }}
      title={
        <Flex align="center" gap={10}>
          <span style={{ color: accentColor, fontSize: 15 }}>{icon}</span>
          <Text strong style={{ fontSize: 14 }}>
            {title}
          </Text>
        </Flex>
      }
      extra={extra}
    >
      {children}
    </Card>
  );
}

// Component แสดง Method + Path + Description
function EndpointBlock({
  method,
  path,
  label,
  desc,
  children,
}: {
  method: "GET" | "POST" | "PUT";
  path: string;
  label?: string;
  desc: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Flex align="center" gap={8} style={{ marginBottom: 6 }} wrap="wrap">
        <Tag
          style={{
            background: METHOD_COLOR[method],
            color: "#fff",
            border: "none",
            fontWeight: 600,
            fontSize: 11,
            margin: 0,
          }}
        >
          {method}
        </Tag>
        <Text code style={{ fontSize: 12 }}>
          {path}
        </Text>
        {label && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            — {label}
          </Text>
        )}
      </Flex>
      <Paragraph
        type="secondary"
        style={{ fontSize: 13, marginBottom: children ? 8 : 0 }}
      >
        {desc}
      </Paragraph>
      {children}
    </div>
  );
}

// Component เส้นคั่นระหว่าง Endpoint ภายใน Card เดียวกัน
function SectionDivider() {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        height: 1,
        background: token.colorBorderSecondary,
        margin: "20px 0",
      }}
    />
  );
}

export default function LineApiDocsPage() {
  const { token } = theme.useToken();

  return <DashboardLayout></DashboardLayout>;
}
