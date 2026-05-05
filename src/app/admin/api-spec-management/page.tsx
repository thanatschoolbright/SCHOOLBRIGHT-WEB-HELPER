"use client";

import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import {
  ApiOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  KeyOutlined,
  LoginOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import {
  Badge,
  Button,
  Card,
  Col,
  Flex,
  Input,
  Row,
  Space,
  Tabs,
  Tag,
  theme,
  Typography,
} from "antd";
import { useState } from "react";
import { toast } from "sonner";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

interface ApiField {
  name: string;
  type: string;
  required: boolean;
  description: string;
  location?: "body" | "header";
}

interface ApiEndpointCardProps {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  title: string;
  description: string;
  requestFields?: ApiField[];
  responseExample: string;
  errorList?: { status: number; message: string }[];
}

const METHOD_COLOR: Record<string, string> = {
  GET: "green",
  POST: "blue",
  PUT: "orange",
  DELETE: "red",
  PATCH: "purple",
};

// คัดลอกข้อความไปยัง clipboard
function useCopyText() {
  return (text: string, label?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`คัดลอก${label ? ` ${label}` : ""}แล้ว`);
    });
  };
}

// การ์ดแสดงรายละเอียด API endpoint
function ApiEndpointCard({
  method,
  path,
  title,
  description,
  requestFields,
  responseExample,
  errorList,
}: ApiEndpointCardProps) {
  const { token } = theme.useToken();
  const copyText = useCopyText();
  const fullUrl = `${BASE_URL}${path}`;

  return (
    <Card
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorderSecondary}`,
        marginBottom: 24,
      }}
      styles={{ body: { padding: 24 } }}
    >
      <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
        <UnorderedListOutlined style={{ fontSize: "1rem", color: token.colorPrimary }} />
        <Typography.Text strong style={{ fontSize: "1.05rem" }}>
          {title}
        </Typography.Text>
      </Flex>

      <Flex align="center" gap={12} style={{ marginBottom: 12 }}>
        <Tag color={METHOD_COLOR[method]} style={{ fontWeight: 600, fontSize: 13, padding: "2px 10px" }}>
          {method}
        </Tag>
        <Flex flex={1} align="center" gap={8}>
          <Input
            value={fullUrl}
            readOnly
            size="middle"
            style={{ fontFamily: "monospace", fontSize: 13 }}
          />
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyText(fullUrl, "URL")}
          />
        </Flex>
      </Flex>

      <Typography.Paragraph type="secondary" style={{ marginBottom: 20 }}>
        {description}
      </Typography.Paragraph>

      {requestFields && requestFields.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Typography.Text strong style={{ display: "block", marginBottom: 10 }}>
            {requestFields.every((f) => f.location === "header") ? "Headers" : "Request Body (JSON)"}
          </Typography.Text>
          <div
            style={{
              background: token.colorFillAlter,
              borderRadius: 10,
              padding: 16,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            {requestFields.map((field) => (
              <Flex key={field.name} align="baseline" gap={10} style={{ marginBottom: 8 }}>
                <code
                  style={{
                    color: token.colorPrimary,
                    fontWeight: 600,
                    minWidth: 130,
                    fontSize: 13,
                  }}
                >
                  {field.name}
                </code>
                <Tag color="default" style={{ fontSize: 11 }}>
                  {field.type}
                </Tag>
                <Badge
                  status={field.required ? "error" : "default"}
                  text={
                    <Typography.Text type={field.required ? "danger" : "secondary"} style={{ fontSize: 11 }}>
                      {field.required ? "บังคับ" : "ไม่บังคับ"}
                    </Typography.Text>
                  }
                />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {field.description}
                </Typography.Text>
              </Flex>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: errorList ? 20 : 0 }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
          <Typography.Text strong>ตัวอย่าง Response (200 OK)</Typography.Text>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyText(responseExample, "Response")}
          >
            คัดลอก
          </Button>
        </Flex>
        <pre
          style={{
            background: token.colorFillAlter,
            borderRadius: 10,
            padding: 16,
            fontSize: 12,
            overflowX: "auto",
            border: `1px solid ${token.colorBorderSecondary}`,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {responseExample}
        </pre>
      </div>

      {errorList && errorList.length > 0 && (
        <div>
          <Typography.Text strong style={{ display: "block", marginBottom: 10 }}>
            Error Responses
          </Typography.Text>
          <Flex gap={8} wrap="wrap">
            {errorList.map((err) => (
              <Tag
                key={err.status}
                color={err.status >= 500 ? "red" : err.status >= 400 ? "orange" : "default"}
                style={{ marginBottom: 4 }}
              >
                {err.status} — {err.message}
              </Tag>
            ))}
          </Flex>
        </div>
      )}
    </Card>
  );
}

const SIGN_IN_RESPONSE = JSON.stringify(
  {
    status: 200,
    message_th: "เข้าสู่ระบบสำเร็จ",
    message_en: "Sign in successful",
    data: {
      token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwidXNlcl9pZCI6MSwidXNlcm5hbWUiOiJqb2huLmRvZSIsImlzcyI6InNjaG9vbGJyaWdodC1zaGFyZWQtYXV0aCIsImlhdCI6MTc0NjAwMDAwMCwiZXhwIjoxNzQ2MDI4ODAwfQ.signature",
      token_type: "Bearer",
      expires_in: 28800,
      user: {
        id: 1,
        admin_id: null,
        username: "john.doe",
        employee_code: "EMP001",
        email: "john@schoolbright.co",
        firstname_th: "จอห์น",
        lastname_th: "โด",
        role_id: 2,
        role_name: "Developer",
        permissions: ["timesheet.entry.read"],
        status: "ACTIVE",
        last_login: "2026-05-05T10:00:00.000Z",
      },
    },
  },
  null,
  2,
);

const SESSION_RESPONSE = JSON.stringify(
  {
    status: 200,
    message_th: "ดึงข้อมูล session สำเร็จ",
    message_en: "Session retrieved successfully",
    data: {
      user: {
        id: 1,
        username: "john.doe",
        email: "john@schoolbright.co",
        firstname_th: "จอห์น",
        lastname_th: "โด",
        role_name: "Developer",
        permissions: ["timesheet.entry.read"],
        department_name: "เทคโนโลยีสารสนเทศ",
        status: "ACTIVE",
        last_login: "2026-05-05T10:00:00.000Z",
      },
      expires: "2026-05-05T18:00:00.000Z",
    },
  },
  null,
  2,
);

// แท็บ Login API
function LoginApiTab() {
  const [copied, setCopied] = useState(false);
  const copyText = useCopyText();

  const curlExample = `curl -X POST ${BASE_URL}/api/v3/authentication/shared/sign-in \\
  -H "Content-Type: application/json" \\
  -d '{"username": "john@schoolbright.co", "password": "yourpassword"}'`;

  return (
    <div>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card
            style={{ borderRadius: 12, textAlign: "center" }}
            styles={{ body: { padding: 20 } }}
          >
            <LoginOutlined style={{ fontSize: 28, color: "#1677ff", marginBottom: 8 }} />
            <Typography.Title level={5} style={{ marginBottom: 4 }}>
              Shared Login
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ใช้ DB ผู้ใช้เดียวกัน
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            style={{ borderRadius: 12, textAlign: "center" }}
            styles={{ body: { padding: 20 } }}
          >
            <CheckCircleOutlined style={{ fontSize: 28, color: "#52c41a", marginBottom: 8 }} />
            <Typography.Title level={5} style={{ marginBottom: 4 }}>
              Stateless
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ไม่สร้าง NextAuth session
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            style={{ borderRadius: 12, textAlign: "center" }}
            styles={{ body: { padding: 20 } }}
          >
            <KeyOutlined style={{ fontSize: 28, color: "#fa8c16", marginBottom: 8 }} />
            <Typography.Title level={5} style={{ marginBottom: 4 }}>
              Lock Protection
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              5 ครั้ง / ล็อก 15 นาที
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <ApiEndpointCard
        method="POST"
        path="/api/v3/authentication/shared/sign-in"
        title="เข้าสู่ระบบ (Shared Login)"
        description="Login ด้วย email, employee_code หรือ username — รองรับ case-insensitive ส่งคืน JWT token (HS256, อายุ 8 ชั่วโมง) สำหรับนำไปใช้กับเส้น /session"
        requestFields={[
          { name: "username", type: "string", required: true, description: "email / employee_code / username" },
          { name: "password", type: "string", required: true, description: "รหัสผ่าน" },
        ]}
        responseExample={SIGN_IN_RESPONSE}
        errorList={[
          { status: 400, message: "Username and password are required" },
          { status: 401, message: "Invalid credentials / Invalid password" },
          { status: 403, message: "Account is locked or inactive" },
          { status: 429, message: "Account temporarily locked (15 min)" },
          { status: 500, message: "Internal Server Error" },
        ]}
      />

      <Card
        style={{ borderRadius: 16, marginBottom: 24 }}
        styles={{ body: { padding: 24 } }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Typography.Text strong>ตัวอย่าง cURL</Typography.Text>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              copyText(curlExample, "cURL");
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "คัดลอกแล้ว" : "คัดลอก"}
          </Button>
        </Flex>
        <pre
          style={{
            background: "#1a1a2e",
            color: "#e2e2e2",
            borderRadius: 10,
            padding: 16,
            fontSize: 12,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {curlExample}
        </pre>
      </Card>
    </div>
  );
}

// แท็บ Session API
function SessionApiTab() {
  const copyText = useCopyText();

  const curlExample = `curl --location '${BASE_URL}/api/v3/authentication/shared/session' \\
  --header 'Authorization: Bearer <JWT token จากเส้น /sign-in>'`;

  return (
    <div>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card
            style={{ borderRadius: 12, textAlign: "center" }}
            styles={{ body: { padding: 20 } }}
          >
            <UserOutlined style={{ fontSize: 28, color: "#722ed1", marginBottom: 8 }} />
            <Typography.Title level={5} style={{ marginBottom: 4 }}>
              แลก Token เป็น Session
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ส่ง JWT token เพื่อดึงข้อมูลพนักงานล่าสุด
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            style={{ borderRadius: 12, textAlign: "center" }}
            styles={{ body: { padding: 20 } }}
          >
            <KeyOutlined style={{ fontSize: 28, color: "#13c2c2", marginBottom: 8 }} />
            <Typography.Title level={5} style={{ marginBottom: 4 }}>
              Token-Protected
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Verify HS256 + ตรวจสอบ issuer ก่อนอนุญาต
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <ApiEndpointCard
        method="GET"
        path="/api/v3/authentication/shared/session"
        title="ดึงข้อมูล Session ด้วย Bearer Token"
        description="ส่ง JWT token ผ่าน Authorization header เพื่อ verify และดึงข้อมูลพนักงานล่าสุดจาก DB (real-time)"
        requestFields={[
          { name: "Authorization", type: "string", required: true, description: "Bearer <JWT token จากเส้น /sign-in>", location: "header" },
        ]}
        responseExample={SESSION_RESPONSE}
        errorList={[
          { status: 401, message: "Missing or invalid Authorization header" },
          { status: 401, message: "Invalid or expired token" },
          { status: 403, message: "Account is locked or inactive" },
          { status: 404, message: "User not found" },
          { status: 500, message: "Internal Server Error" },
        ]}
      />

      <Card
        style={{ borderRadius: 16, marginBottom: 24 }}
        styles={{ body: { padding: 24 } }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Typography.Text strong>ตัวอย่าง cURL</Typography.Text>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyText(curlExample, "cURL")}
          >
            คัดลอก
          </Button>
        </Flex>
        <pre
          style={{
            background: "#1a1a2e",
            color: "#e2e2e2",
            borderRadius: 10,
            padding: 16,
            fontSize: 12,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {curlExample}
        </pre>
      </Card>
    </div>
  );
}

export default function ApiSpecManagementPage() {
  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <HeaderBar
          icon={<ApiOutlined />}
          title="API Spec"
          subTitle="รายละเอียด API สำหรับแชร์ให้เว็บอื่นใช้งานระบบ Login เดียวกัน"
          extra={
            <Space>
              <Tag color="blue" style={{ padding: "4px 10px" }}>
                v3
              </Tag>
              <Tag color="green" style={{ padding: "4px 10px" }}>
                Shared Auth
              </Tag>
            </Space>
          }
        />

        <Card
          style={{ borderRadius: 16, marginBottom: 8 }}
          styles={{ body: { padding: 0 } }}
        >
          <Tabs
            defaultActiveKey="login"
            size="large"
            style={{ padding: "0 24px" }}
            items={[
              {
                key: "login",
                label: (
                  <Space>
                    <LoginOutlined />
                    เส้น Login
                  </Space>
                ),
                children: (
                  <div style={{ padding: "16px 0 24px" }}>
                    <LoginApiTab />
                  </div>
                ),
              },
              {
                key: "session",
                label: (
                  <Space>
                    <UserOutlined />
                    เส้น Session
                  </Space>
                ),
                children: (
                  <div style={{ padding: "16px 0 24px" }}>
                    <SessionApiTab />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </DashboardLayout>
    </PermissionLayout>
  );
}
