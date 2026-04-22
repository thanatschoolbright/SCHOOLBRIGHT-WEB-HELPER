"use client";

import {
  ApiOutlined,
  BellOutlined,
  CodeOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import {
  Anchor,
  Badge,
  Card,
  Divider,
  Flex,
  List,
  Tag,
  Typography,
} from "antd";
import { ApiTestPanel } from "./_components/api-test-panel";

const { Title, Text, Paragraph } = Typography;

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
 * หน้าเอกสาร LINE API Documentation สำหรับนักพัฒนา (Strict ตามมาตรฐานโครงการ)
 */
export default function LineApiDocsPage() {
  return (
    <DashboardLayout>
      <div style={{ width: "100%", paddingBottom: 64 }}>
        <HeaderBar
          icon={<ApiOutlined />}
          title="LINE API DOCUMENTATION"
          subTitle="เอกสารประกอบการพัฒนาและเชื่อมต่อระบบกับ LINE Messaging API (Phase 1)"
        />

        <div style={{ marginTop: 24 }}>
          <Flex wrap="wrap" gap={24}>
            {/* ฝั่งซ้าย: เนื้อหาหลัก */}
            <div style={{ flex: "1 1 800px" }}>
              {/* ส่วนที่ 1: การตั้งค่าพื้นฐาน */}
              <Card
                id="overview"
                title={
                  <Flex align="center" gap={8}>
                    <InfoCircleOutlined /> ข้อมูลทั่วไป
                  </Flex>
                }
                style={{ marginBottom: 24, borderRadius: 16 }}
              >
                <Paragraph>
                  ระบบใช้ <strong>LINE Messaging API</strong>{" "}
                  ในการรับส่งข้อมูลระหว่างผู้ใช้และเซิร์ฟเวอร์
                  โดยมีการรักษาความปลอดภัยผ่าน <strong>HMAC-SHA256</strong>{" "}
                  Signature Verification
                </Paragraph>
                <Divider />
                <Title level={5}>Base Path</Title>
                <Text
                  code
                  style={{
                    fontSize: 16,
                    display: "block",
                    padding: "8px 16px",
                    background: "#f5f5f5",
                    borderRadius: 8,
                  }}
                >
                  /api/v1/application/line
                </Text>
              </Card>

              {/* ส่วนที่ 2: Webhook Endpoint */}
              <Card
                id="webhook"
                title={
                  <Flex align="center" gap={8}>
                    <MessageOutlined /> Webhook Endpoint
                  </Flex>
                }
                style={{ marginBottom: 24, borderRadius: 16 }}
                extra={<Tag color="green">Phase 1</Tag>}
              >
                {/* GET Webhook — ตรวจสอบสถานะ */}
                <Title level={5}>
                  <Tag color="blue">GET</Tag> /webhook
                </Title>
                <Paragraph>
                  ใช้สำหรับตรวจสอบสถานะความพร้อมของ Webhook
                  และดึงข้อมูลเบื้องต้นของ Channel โดยไม่ต้องส่ง Signature
                </Paragraph>

                <ApiTestPanel
                  method="GET"
                  endpoint="/api/v1/application/line/webhook"
                  title="ตรวจสอบสถานะ Webhook"
                />

                <Divider />

                {/* POST Webhook — ทดสอบ event: join */}
                <Title level={5}>
                  <Tag color="cyan">POST</Tag> /webhook —{" "}
                  <Text type="secondary" style={{ fontWeight: 400 }}>
                    event: join
                  </Text>
                </Title>
                <Paragraph>
                  จำลอง Bot ถูก invite เข้ากลุ่ม LINE — ระบบจะทักทายและบันทึก
                  Group ID ลงฐานข้อมูล
                </Paragraph>
                <Card
                  type="inner"
                  title="Security Header"
                  style={{ marginBottom: 8 }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Webhook จริงต้องผ่าน <Text code>x-line-signature</Text>{" "}
                    (HMAC-SHA256) — การทดสอบผ่านหน้านี้ข้ามขั้นตอน Signature ได้
                    เพราะ Server ตรวจเฉพาะเมื่อมี header
                  </Text>
                </Card>
                <ApiTestPanel
                  method="POST"
                  endpoint="/api/v1/application/line/webhook"
                  title="ทดสอบ: Bot ถูก invite เข้ากลุ่ม"
                  defaultPayload={PAYLOAD_JOIN}
                />

                <Divider />

                {/* POST Webhook — คำสั่ง /luid */}
                <Title level={5}>
                  <Tag color="cyan">POST</Tag> /webhook —{" "}
                  <Text type="secondary" style={{ fontWeight: 400 }}>
                    คำสั่ง /luid
                  </Text>
                </Title>
                <Paragraph>
                  จำลองผู้ใช้พิมพ์ <Text code>/luid</Text> ในกลุ่ม — ระบบจะ
                  reply กลับด้วย userId และ groupId
                </Paragraph>
                <ApiTestPanel
                  method="POST"
                  endpoint="/api/v1/application/line/webhook"
                  title="ทดสอบ: คำสั่ง /luid"
                  defaultPayload={PAYLOAD_MESSAGE_LUID}
                />

                <Divider />

                {/* POST Webhook — คำสั่ง สถานะ */}
                <Title level={5}>
                  <Tag color="cyan">POST</Tag> /webhook —{" "}
                  <Text type="secondary" style={{ fontWeight: 400 }}>
                    คำสั่ง สถานะ
                  </Text>
                </Title>
                <Paragraph>
                  จำลองผู้ใช้พิมพ์ <Text code>สถานะ</Text> —
                  ระบบจะดึงรายงานสถานะ POS แล้ว reply กลับ
                </Paragraph>
                <ApiTestPanel
                  method="POST"
                  endpoint="/api/v1/application/line/webhook"
                  title="ทดสอบ: ดึงสถานะ POS"
                  defaultPayload={PAYLOAD_MESSAGE_STATUS}
                />

                <Divider />

                {/* POST Webhook — ค้นหาโรงเรียน */}
                <Title level={5}>
                  <Tag color="cyan">POST</Tag> /webhook —{" "}
                  <Text type="secondary" style={{ fontWeight: 400 }}>
                    ค้นหาโรงเรียน
                  </Text>
                </Title>
                <Paragraph>
                  จำลองผู้ใช้พิมพ์ keyword ค้นหาชื่อโรงเรียน — ระบบจะค้นหาและ
                  reply ผลลัพธ์กลับ
                </Paragraph>
                <ApiTestPanel
                  method="POST"
                  endpoint="/api/v1/application/line/webhook"
                  title="ทดสอบ: ค้นหาโรงเรียน"
                  defaultPayload={PAYLOAD_MESSAGE_SEARCH}
                />
              </Card>

              {/* ส่วนที่ 3: Group Management */}
              <Card
                id="groups"
                title={
                  <Flex align="center" gap={8}>
                    <UsergroupAddOutlined /> Group Management
                  </Flex>
                }
                style={{ marginBottom: 24, borderRadius: 16 }}
              >
                <Title level={5}>
                  <Tag color="blue">GET</Tag> /groups
                </Title>
                <Paragraph>
                  ดึงรายชื่อ LINE Group ที่ Bot เคยเข้าร่วมและถูกบันทึกในระบบ
                  เพื่อนำไปใช้ในตัวเลือกหน้า UI
                </Paragraph>

                <ApiTestPanel
                  method="GET"
                  endpoint="/api/v1/application/line/groups"
                  title="ดึงรายชื่อกลุ่ม LINE"
                />

                <Divider />

                <Title level={5}>
                  <Tag color="orange">PUT</Tag> /groups
                </Title>
                <Paragraph>
                  ตั้งค่ากลุ่มเป้าหมาย (Active Group)
                  สำหรับการส่งรายงานสถานะอุปกรณ์ (Monitoring)
                </Paragraph>

                <ApiTestPanel
                  method="PUT"
                  endpoint="/api/v1/application/line/groups"
                  title="ตั้งค่ากลุ่มเป้าหมาย"
                  defaultPayload='{ "group_id": "C..." }'
                />
              </Card>

              {/* ส่วนที่ 4: Notifications / Reports */}
              <Card
                id="notifications"
                title={
                  <Flex align="center" gap={8}>
                    <BellOutlined /> Notifications & Reports
                  </Flex>
                }
                style={{ marginBottom: 24, borderRadius: 16 }}
              >
                <Title level={5}>
                  <Tag color="blue">GET</Tag>{" "}
                  /api/v1/hardware/machine-monitoring/channel/line
                </Title>
                <Paragraph>
                  สั่งให้ระบบดึงสถานะเครื่อง POS ล่าสุด แล้วสร้างรายงานเป็น Flex
                  Message ส่งไปยังกลุ่มที่ตั้งค่าไว้
                </Paragraph>
                <Badge
                  status="processing"
                  text="รองรับการเรียกผ่าน Cron Job (ต้องส่ง Bearer Token)"
                />

                <ApiTestPanel
                  method="GET"
                  endpoint="/api/v1/hardware/machine-monitoring/channel/line"
                  title="ส่งรายงานไปยัง LINE"
                />
              </Card>

              {/* ส่วนที่ 5: คำสั่งบิลต์อิน */}
              <Card
                id="commands"
                title={
                  <Flex align="center" gap={8}>
                    <CodeOutlined /> Built-in Commands (Webhook)
                  </Flex>
                }
                style={{ borderRadius: 16 }}
              >
                <List
                  itemLayout="horizontal"
                  dataSource={[
                    {
                      title: "/luid",
                      desc: "ขอดู LINE User ID ของผู้ใช้ปัจจุบัน",
                    },
                    {
                      title: "สถานะ",
                      desc: "ดึงรายงานสถานะเครื่อง POS แบบ real-time",
                    },
                    {
                      title: "<keyword>",
                      desc: "ค้นหาข้อมูลโรงเรียนด้วยชื่อ (ต้องมีความยาว 2 ตัวอักษรขึ้นไป)",
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Tag color="purple">{item.title}</Tag>}
                        description={item.desc}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>

            {/* ฝั่งขวา: สารบัญ (Anchor) */}
            <div style={{ flex: "0 0 250px" }}>
              <Card
                title="สารบัญเนื้อหา"
                style={{ position: "sticky", top: 24, borderRadius: 16 }}
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
                    {
                      key: "groups",
                      href: "#groups",
                      title: "การจัดการกลุ่ม",
                    },
                    {
                      key: "notifications",
                      href: "#notifications",
                      title: "การแจ้งเตือน",
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
                    <SafetyCertificateOutlined /> ความปลอดภัย
                  </Flex>
                }
                style={{
                  marginTop: 24,
                  borderRadius: 16,
                  background: "#fffbe6",
                  border: "1px solid #ffe58f",
                }}
              >
                <Text type="secondary" style={{ fontSize: 13 }}>
                  ห้ามเปิดเผย <strong>Channel Secret</strong> และ{" "}
                  <strong>Access Token</strong> ในฝั่ง Client เด็ดขาด การตรวจสอบ
                  Signature ต้องทำที่ฝั่ง Server เท่านั้น
                </Text>
              </Card>
            </div>
          </Flex>
        </div>
      </div>
    </DashboardLayout>
  );
}
