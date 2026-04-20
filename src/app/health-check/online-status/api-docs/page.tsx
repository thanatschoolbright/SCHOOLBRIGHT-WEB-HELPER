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

const { Title, Text, Paragraph } = Typography;

/**
 * หน้าเอกสาร LINE API Documentation สำหรับนักพัฒนา
 */
export default function LineApiDocsPage() {
  const webhookColumns = [
    {
      title: "ฟิลด์",
      dataIndex: "field",
      key: "field",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    { title: "ประเภท", dataIndex: "type", key: "type" },
    { title: "คำอธิบาย", dataIndex: "desc", key: "desc" },
  ];

  const webhookData = [
    {
      key: "1",
      field: "destination",
      type: "string",
      desc: "User ID ของ Chat Bot",
    },
    {
      key: "2",
      field: "events",
      type: "array",
      desc: "รายการของ Webhook Event (message, join, leave ฯลฯ)",
    },
  ];

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
                <Title level={5}>
                  <Tag color="cyan">POST</Tag> /webhook
                </Title>
                <Paragraph>
                  รับ Events ต่างๆ จาก LINE Platform เช่น ข้อความเข้า,
                  คนเข้ากลุ่ม, หรือ Unblock
                </Paragraph>

                <Card
                  type="inner"
                  title="Security Header"
                  style={{ marginBottom: 16 }}
                >
                  <Text strong>x-line-signature:</Text> Base64-encoded
                  HMAC-SHA256 signature
                </Card>

                <Title level={5}>Request Example</Title>
                <pre
                  style={{
                    background: "#001529",
                    color: "#fff",
                    padding: 16,
                    borderRadius: 8,
                    overflow: "auto",
                  }}
                >
                  {`{
  "destination": "U...",
  "events": [
    {
      "type": "message",
      "replyToken": "...",
      "source": { "userId": "...", "type": "user" },
      "message": { "type": "text", "text": "/luid" }
    }
  ]
}`}
                </pre>

                <Divider />

                <Title level={5}>
                  <Tag color="blue">GET</Tag> /webhook
                </Title>
                <Paragraph>
                  ใช้สำหรับตรวจสอบสถานะความพร้อมของ Webhook
                  และดึงข้อมูลเบื้องต้นของ Channel โดยไม่ต้องส่ง Signature
                </Paragraph>
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

                <Title level={5}>
                  <Tag color="orange">PUT</Tag> /groups
                </Title>
                <Paragraph>
                  ตั้งค่ากลุ่มเป้าหมาย (Active Group)
                  สำหรับการส่งรายงานสถานะอุปกรณ์ (Monitoring)
                </Paragraph>
                <pre
                  style={{
                    background: "#001529",
                    color: "#fff",
                    padding: 16,
                    borderRadius: 8,
                  }}
                >
                  {`{ "group_id": "C..." }`}
                </pre>
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
                      title: "/lgid",
                      desc: "ขอดู LINE Group ID (ใช้เมื่อพิมพ์ในห้องแชทกลุ่ม)",
                    },
                    {
                      title: "/status",
                      desc: "ตรวจสอบสถานะระบบเบื้องต้นจาก LINE",
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
                      title: "Group Management",
                    },
                    {
                      key: "notifications",
                      href: "#notifications",
                      title: "Notifications & Reports",
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
