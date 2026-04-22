"use client";

import {
  ApiOutlined,
  BellOutlined,
  BookOutlined,
  CodeOutlined,
  InfoCircleOutlined,
  LockOutlined,
  MessageOutlined,
  NodeIndexOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import {
  Anchor,
  Card,
  Col,
  Flex,
  List,
  Row,
  Tag,
  theme,
  Typography,
} from "antd";
import { ApiTestPanel } from "./_components/api-test-panel";

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

  return (
    <DashboardLayout>
      <div style={{ width: "100%", paddingBottom: 64 }}>
        <HeaderBar
          icon={<ApiOutlined />}
          title="LINE API เอกสารและทดสอบระบบ"
          subTitle="เอกสารประกอบการพัฒนาและทดสอบการเชื่อมต่อระบบกับ LINE Messaging API"
        />

        {/* ส่วน Summary — ภาพรวม Endpoints */}
        <Card
          style={{ marginTop: 24, borderRadius: 16, marginBottom: 24 }}
          styles={{ body: { padding: "16px 20px" } }}
        >
          <Flex align="center" gap={10} style={{ marginBottom: 14 }}>
            <NodeIndexOutlined
              style={{ fontSize: 16, color: token.colorPrimary }}
            />
            <Text strong style={{ fontSize: 15 }}>
              รายการ Endpoints ทั้งหมด
            </Text>
            <Tag color="blue">{ENDPOINT_SUMMARY.length} endpoints</Tag>
            <Tag color="green">Phase 1</Tag>
          </Flex>
          <Row gutter={[8, 8]}>
            {ENDPOINT_SUMMARY.map((ep, idx) => (
              <Col xs={24} sm={12} md={8} key={idx}>
                <Flex
                  align="center"
                  gap={8}
                  style={{
                    padding: "8px 12px",
                    background: token.colorFillQuaternary,
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorderSecondary}`,
                  }}
                >
                  <Tag
                    style={{
                      background: METHOD_COLOR[ep.method],
                      color: "#fff",
                      border: "none",
                      fontWeight: 600,
                      fontSize: 10,
                      margin: 0,
                      flexShrink: 0,
                    }}
                  >
                    {ep.method}
                  </Tag>
                  <Tag
                    color={TAG_COLOR[ep.tag]}
                    style={{ margin: 0, flexShrink: 0, fontSize: 10 }}
                  >
                    {ep.tag}
                  </Tag>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, wordBreak: "break-all" }}
                  >
                    {ep.desc}
                  </Text>
                </Flex>
              </Col>
            ))}
          </Row>
        </Card>

        <Row gutter={24} align="top">
          {/* ฝั่งซ้าย: เนื้อหาหลัก */}
          <Col xs={24} xl={17}>
            {/* หมวด 1: ข้อมูลทั่วไป */}
            <SectionCard
              id="overview"
              icon={<InfoCircleOutlined />}
              title="ข้อมูลทั่วไป"
              accentColor={token.colorPrimary}
            >
              <Paragraph style={{ marginBottom: 12 }}>
                ระบบใช้ <Text strong>LINE Messaging API</Text>{" "}
                รับส่งข้อมูลระหว่างผู้ใช้และเซิร์ฟเวอร์
                ผ่านการรักษาความปลอดภัยด้วย <Text strong>HMAC-SHA256</Text>{" "}
                Signature Verification
              </Paragraph>
              <Flex
                align="center"
                gap={8}
                style={{
                  padding: "10px 14px",
                  background: token.colorFillTertiary,
                  borderRadius: 8,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <BookOutlined style={{ color: token.colorTextSecondary }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Base Path:
                </Text>
                <Text code style={{ fontSize: 13 }}>
                  /api/v1/application/line
                </Text>
              </Flex>
            </SectionCard>

            {/* หมวด 2: Webhook */}
            <SectionCard
              id="webhook"
              icon={<MessageOutlined />}
              title="Webhook Endpoint"
              accentColor="#722ed1"
              extra={<Tag color="purple">Phase 1</Tag>}
            >
              <EndpointBlock
                method="GET"
                path="/webhook"
                desc="ตรวจสอบสถานะความพร้อมของ Webhook และข้อมูลเบื้องต้นของ Channel โดยไม่ต้องส่ง Signature"
              />
              <ApiTestPanel
                method="GET"
                endpoint="/api/v1/application/line/webhook"
                title="ตรวจสอบสถานะ Webhook"
              />

              <SectionDivider />

              <EndpointBlock
                method="POST"
                path="/webhook"
                label="event: join"
                desc="จำลอง Bot ถูก invite เข้ากลุ่ม LINE ระบบจะทักทายและบันทึก Group ID ลงฐานข้อมูล"
              >
                <Flex
                  gap={8}
                  align="flex-start"
                  style={{
                    padding: "10px 12px",
                    background: token.colorWarningBg,
                    border: `1px solid ${token.colorWarningBorder}`,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <LockOutlined
                    style={{ color: token.colorWarning, marginTop: 2 }}
                  />
                  <Text style={{ fontSize: 12 }}>
                    Webhook จริงต้องผ่าน <Text code>x-line-signature</Text>{" "}
                    (HMAC-SHA256) — การทดสอบผ่านหน้านี้ข้ามขั้นตอน Signature
                    ได้เมื่อไม่มี header
                  </Text>
                </Flex>
              </EndpointBlock>
              <ApiTestPanel
                method="POST"
                endpoint="/api/v1/application/line/webhook"
                title="ทดสอบ: Bot ถูก invite เข้ากลุ่ม"
                defaultPayload={PAYLOAD_JOIN}
              />

              <SectionDivider />

              <EndpointBlock
                method="POST"
                path="/webhook"
                label="คำสั่ง /luid"
                desc="จำลองผู้ใช้พิมพ์ /luid ในกลุ่ม ระบบจะ reply กลับด้วย userId และ groupId"
              />
              <ApiTestPanel
                method="POST"
                endpoint="/api/v1/application/line/webhook"
                title="ทดสอบ: คำสั่ง /luid"
                defaultPayload={PAYLOAD_MESSAGE_LUID}
              />

              <SectionDivider />

              <EndpointBlock
                method="POST"
                path="/webhook"
                label="คำสั่ง สถานะ"
                desc="จำลองผู้ใช้พิมพ์ สถานะ ระบบจะดึงรายงานสถานะ POS แล้ว reply กลับ"
              />
              <ApiTestPanel
                method="POST"
                endpoint="/api/v1/application/line/webhook"
                title="ทดสอบ: ดึงสถานะ POS"
                defaultPayload={PAYLOAD_MESSAGE_STATUS}
              />

              <SectionDivider />

              <EndpointBlock
                method="POST"
                path="/webhook"
                label="ค้นหาโรงเรียน"
                desc="จำลองผู้ใช้พิมพ์ keyword ค้นหาชื่อโรงเรียน ระบบจะค้นหาและ reply ผลลัพธ์กลับ"
              />
              <ApiTestPanel
                method="POST"
                endpoint="/api/v1/application/line/webhook"
                title="ทดสอบ: ค้นหาโรงเรียน"
                defaultPayload={PAYLOAD_MESSAGE_SEARCH}
              />
            </SectionCard>

            {/* หมวด 3: การจัดการกลุ่ม */}
            <SectionCard
              id="groups"
              icon={<TeamOutlined />}
              title="การจัดการกลุ่ม LINE"
              accentColor="#13c2c2"
            >
              <EndpointBlock
                method="GET"
                path="/groups"
                desc="ดึงรายชื่อ LINE Group ที่ Bot เคยเข้าร่วมและถูกบันทึกในระบบ"
              />
              <ApiTestPanel
                method="GET"
                endpoint="/api/v1/application/line/groups"
                title="ดึงรายชื่อกลุ่ม LINE"
              />

              <SectionDivider />

              <EndpointBlock
                method="PUT"
                path="/groups"
                desc="ตั้งค่ากลุ่มเป้าหมาย (Active Group) สำหรับการส่งรายงานสถานะอุปกรณ์"
              />
              <ApiTestPanel
                method="PUT"
                endpoint="/api/v1/application/line/groups"
                title="ตั้งค่ากลุ่มเป้าหมาย"
                defaultPayload='{ "group_id": "C..." }'
              />
            </SectionCard>

            {/* หมวด 4: รายงานภาพรวม */}
            <SectionCard
              id="notifications"
              icon={<BellOutlined />}
              title="รายงานสถานะ POS ภาพรวม"
              accentColor="#fa8c16"
            >
              <EndpointBlock
                method="GET"
                path="/hardware/machine-monitoring/channel/line"
                desc="ดึงสถานะเครื่อง POS ล่าสุดทั้งหมด สร้างรายงาน Flex Message และส่งไปยังกลุ่มที่ตั้งค่าไว้"
              >
                <Flex
                  gap={8}
                  align="flex-start"
                  style={{
                    padding: "10px 12px",
                    background: token.colorInfoBg,
                    border: `1px solid ${token.colorInfoBorder}`,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <LockOutlined
                    style={{ color: token.colorInfo, marginTop: 2 }}
                  />
                  <Text style={{ fontSize: 12 }}>
                    รองรับการเรียกผ่าน Cron Job — ต้องส่ง{" "}
                    <Text code>Authorization: Bearer {"{CRON_SECRET}"}</Text>
                  </Text>
                </Flex>
              </EndpointBlock>
              <ApiTestPanel
                method="GET"
                endpoint="/api/v1/hardware/machine-monitoring/channel/line"
                title="ส่งรายงานภาพรวมไปยัง LINE"
              />
            </SectionCard>

            {/* หมวด 5: รายงานรายโรงเรียน */}
            <SectionCard
              id="school-report"
              icon={<BellOutlined />}
              title="รายงานสถานะฮาร์ดแวร์รายโรงเรียน"
              accentColor="#52c41a"
              extra={<Tag color="green">School-Specific</Tag>}
            >
              <EndpointBlock
                method="GET"
                path="/hardware/machine-monitoring/channel/line/{school_id}"
                desc="ส่งรายงานสถานะเครื่องฮาร์ดแวร์ของโรงเรียนเดียว แสดงรายชื่อเครื่อง แอปพลิเคชัน และสถานะ Online/Offline"
              >
                <Flex
                  gap={8}
                  align="center"
                  style={{
                    padding: "8px 12px",
                    background: token.colorSuccessBg,
                    border: `1px solid ${token.colorSuccessBorder}`,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 12 }}>
                    ไม่ต้องใช้ Bearer Token — เรียกได้โดยตรง
                  </Text>
                </Flex>
              </EndpointBlock>
              <ApiTestPanel
                method="GET"
                endpoint="/api/v1/hardware/machine-monitoring/channel/line/1234"
                title="ส่งรายงานรายโรงเรียน (แก้ 1234 เป็นรหัสโรงเรียน)"
              />
            </SectionCard>

            {/* หมวด 6: คำสั่งบิลต์อิน */}
            <SectionCard
              id="commands"
              icon={<CodeOutlined />}
              title="คำสั่งที่รองรับใน Webhook"
              accentColor="#eb2f96"
            >
              <List
                itemLayout="horizontal"
                dataSource={[
                  {
                    cmd: "/luid",
                    desc: "ขอดู LINE User ID ของผู้ใช้ปัจจุบัน",
                    color: "purple",
                  },
                  {
                    cmd: "สถานะ",
                    desc: "ดึงรายงานสถานะเครื่อง POS แบบ real-time",
                    color: "green",
                  },
                  {
                    cmd: "<ชื่อโรงเรียน>",
                    desc: "ค้นหาข้อมูลโรงเรียนด้วยชื่อ (ต้องมีความยาว 2 ตัวอักษรขึ้นไป)",
                    color: "blue",
                  },
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Tag
                          color={item.color}
                          style={{ fontFamily: "monospace", fontWeight: 600 }}
                        >
                          {item.cmd}
                        </Tag>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {item.desc}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </SectionCard>
          </Col>

          {/* ฝั่งขวา: สารบัญ + ความปลอดภัย */}
          <Col xs={0} xl={7}>
            <div style={{ position: "sticky", top: 24 }}>
              <Card
                title={
                  <Flex align="center" gap={8}>
                    <BookOutlined style={{ color: token.colorPrimary }} />
                    <Text strong>สารบัญ</Text>
                  </Flex>
                }
                style={{ borderRadius: 16, marginBottom: 16 }}
                styles={{ body: { padding: "8px 16px" } }}
              >
                <Anchor
                  affix={false}
                  items={[
                    {
                      key: "overview",
                      href: "#overview",
                      title: "ข้อมูลทั่วไป",
                    },
                    {
                      key: "webhook",
                      href: "#webhook",
                      title: "Webhook Endpoint",
                    },
                    { key: "groups", href: "#groups", title: "การจัดการกลุ่ม" },
                    {
                      key: "notifications",
                      href: "#notifications",
                      title: "รายงานภาพรวม",
                    },
                    {
                      key: "school-report",
                      href: "#school-report",
                      title: "รายงานรายโรงเรียน",
                    },
                    {
                      key: "commands",
                      href: "#commands",
                      title: "คำสั่งบิลต์อิน",
                    },
                  ]}
                />
              </Card>

              <Card
                title={
                  <Flex align="center" gap={8}>
                    <SafetyCertificateOutlined
                      style={{ color: token.colorWarning }}
                    />
                    <Text strong>ความปลอดภัย</Text>
                  </Flex>
                }
                style={{
                  borderRadius: 16,
                  border: `1px solid ${token.colorWarningBorder}`,
                  background: token.colorWarningBg,
                }}
                styles={{ body: { padding: "12px 16px" } }}
              >
                <Text
                  type="secondary"
                  style={{ fontSize: 12, lineHeight: 1.7 }}
                >
                  ห้ามเปิดเผย <Text strong>Channel Secret</Text> และ{" "}
                  <Text strong>Access Token</Text> ในฝั่ง Client เด็ดขาด
                  การตรวจสอบ Signature ต้องทำที่ฝั่ง Server เท่านั้น
                </Text>
              </Card>
            </div>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  );
}
