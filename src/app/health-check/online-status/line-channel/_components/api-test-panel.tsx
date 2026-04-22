"use client";

import { PlayCircleOutlined } from "@ant-design/icons";
import { Alert, Badge, Button, Card, Flex, Input, Tag, Typography } from "antd";
import axios, { AxiosError } from "axios";
import { useState } from "react";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ApiTestPanelProps {
  method: "GET" | "POST" | "PUT";
  endpoint: string;
  title: string;
  defaultPayload?: string;
}

// สีของ HTTP Method
const METHOD_COLOR: Record<string, string> = {
  GET: "blue",
  POST: "green",
  PUT: "orange",
};

// แสดงผล status code ด้วยสี
function getStatusBadge(status: number | null): React.ReactNode {
  if (status === null) return null;
  const type = status >= 500 ? "error" : status >= 400 ? "warning" : "success";
  return <Badge status={type} text={<Text strong>{status}</Text>} />;
}

// Component สำหรับทดสอบ API Endpoint ผ่านหน้าเว็บ
export function ApiTestPanel({
  method,
  endpoint,
  title,
  defaultPayload,
}: ApiTestPanelProps) {
  const [payload, setPayload] = useState<string>(defaultPayload ?? "");
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ส่งคำขอ API และแสดงผลลัพธ์
  async function handleSend() {
    setLoading(true);
    setResponseStatus(null);
    setResponseBody(null);
    setDurationMs(null);
    setError(null);

    const startTime = Date.now();

    try {
      let parsedPayload: unknown = undefined;

      if ((method === "POST" || method === "PUT") && payload.trim()) {
        try {
          parsedPayload = JSON.parse(payload);
        } catch {
          setError("JSON ใน Payload ไม่ถูกต้อง กรุณาตรวจสอบรูปแบบอีกครั้ง");
          setLoading(false);
          return;
        }
      }

      const response = await axios({
        method,
        url: endpoint,
        data: parsedPayload,
        validateStatus: () => true, // รับทุก status code เพื่อแสดงผลได้ครบ
      });

      const elapsed = Date.now() - startTime;
      setResponseStatus(response.status);
      setDurationMs(elapsed);
      setResponseBody(JSON.stringify(response.data, null, 2));
    } catch (err) {
      const elapsed = Date.now() - startTime;
      setDurationMs(elapsed);

      if (err instanceof AxiosError) {
        setResponseStatus(err.response?.status ?? null);
        setResponseBody(
          JSON.stringify(err.response?.data ?? err.message, null, 2),
        );
      } else {
        setError(
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      size="small"
      style={{ marginTop: 16, borderRadius: 12, background: "#fafafa" }}
      styles={{ body: { padding: 16 } }}
    >
      <Flex align="center" justify="space-between" style={{ marginBottom: 12 }}>
        <Flex align="center" gap={8}>
          <Tag color={METHOD_COLOR[method] ?? "default"}>{method}</Tag>
          <Text code style={{ fontSize: 13 }}>
            {endpoint}
          </Text>
        </Flex>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {title}
        </Text>
      </Flex>

      {/* พื้นที่กรอก Payload สำหรับ POST/PUT */}
      {(method === "POST" || method === "PUT") && (
        <TextArea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder='{ "key": "value" }'
          autoSize={{ minRows: 3, maxRows: 10 }}
          style={{ marginBottom: 12, fontFamily: "monospace", fontSize: 13 }}
        />
      )}

      <Flex align="center" gap={12}>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={loading}
          onClick={handleSend}
        >
          ส่งคำขอ
        </Button>

        {responseStatus !== null && getStatusBadge(responseStatus)}
        {durationMs !== null && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {durationMs} ms
          </Text>
        )}
      </Flex>

      {/* แสดง error ถ้า payload ผิดรูปแบบ */}
      {error && (
        <Alert
          type="error"
          message={error}
          style={{ marginTop: 12 }}
          showIcon
        />
      )}

      {/* แสดงผล Response */}
      {responseBody !== null && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Response
          </Text>
          <pre
            style={{
              marginTop: 4,
              background: "#001529",
              color: "#52c41a",
              padding: "12px 16px",
              borderRadius: 8,
              fontSize: 12,
              overflow: "auto",
              maxHeight: 320,
              fontFamily: "monospace",
            }}
          >
            {responseBody}
          </pre>
        </div>
      )}
    </Card>
  );
}
