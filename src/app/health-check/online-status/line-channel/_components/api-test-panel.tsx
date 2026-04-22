"use client";

import { PlayCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Flex, Input, Tag, theme, Typography } from "antd";
import axios, { AxiosError } from "axios";
import { useState } from "react";

const { Text } = Typography;
const { TextArea } = Input;

interface ApiTestPanelProps {
  method: "GET" | "POST" | "PUT";
  endpoint: string;
  title: string;
  defaultPayload?: string;
}

// สีพื้นหลังของแต่ละ HTTP Method
const METHOD_BG: Record<string, string> = {
  GET: "#1677ff",
  POST: "#52c41a",
  PUT: "#fa8c16",
};

// คืนค่าสีของ status code
function resolveStatusColor(status: number): string {
  if (status >= 500) return "#ff4d4f";
  if (status >= 400) return "#fa8c16";
  if (status >= 300) return "#1677ff";
  return "#52c41a";
}

// Component สำหรับทดสอบ API Endpoint ผ่านหน้าเว็บ
export function ApiTestPanel({
  method,
  endpoint,
  title,
  defaultPayload,
}: ApiTestPanelProps) {
  const { token } = theme.useToken();
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
        validateStatus: () => true,
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

  // รีเซ็ตผลลัพธ์ทั้งหมด
  function handleReset() {
    setResponseStatus(null);
    setResponseBody(null);
    setDurationMs(null);
    setError(null);
    setPayload(defaultPayload ?? "");
  }

  const hasResult = responseBody !== null || error !== null;
  const methodColor = METHOD_BG[method] ?? "#8c8c8c";

  return (
    <Card
      size="small"
      style={{
        marginTop: 12,
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
        overflow: "hidden",
      }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Header แถบแสดง method + endpoint */}
      <Flex
        align="center"
        justify="space-between"
        style={{
          padding: "10px 16px",
          background: token.colorFillQuaternary,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Flex align="center" gap={10}>
          <Tag
            style={{
              background: methodColor,
              color: "#fff",
              border: "none",
              fontWeight: 600,
              letterSpacing: "0.05em",
              margin: 0,
              fontSize: 11,
            }}
          >
            {method}
          </Tag>
          <Text
            code
            style={{
              fontSize: 12,
              background: "transparent",
              border: "none",
              padding: 0,
              color: token.colorText,
            }}
          >
            {endpoint}
          </Text>
        </Flex>
        <Text
          type="secondary"
          style={{ fontSize: 11, whiteSpace: "nowrap", marginLeft: 8 }}
        >
          {title}
        </Text>
      </Flex>

      <div style={{ padding: "14px 16px" }}>
        {/* พื้นที่กรอก Payload สำหรับ POST/PUT */}
        {(method === "POST" || method === "PUT") && (
          <TextArea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder='{ "key": "value" }'
            autoSize={{ minRows: 4, maxRows: 12 }}
            style={{
              marginBottom: 12,
              fontFamily: "monospace",
              fontSize: 12,
              background: token.colorFillTertiary,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 8,
            }}
          />
        )}

        {/* ปุ่มควบคุม */}
        <Flex align="center" gap={10} wrap="wrap">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={loading}
            onClick={handleSend}
            size="small"
            style={{ fontWeight: 600 }}
          >
            ส่งคำขอ
          </Button>

          {hasResult && (
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={handleReset}
              type="text"
            >
              รีเซ็ต
            </Button>
          )}

          {/* แสดง status code พร้อมสี */}
          {responseStatus !== null && (
            <Flex align="center" gap={6}>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: resolveStatusColor(responseStatus),
                  flexShrink: 0,
                }}
              />
              <Text
                strong
                style={{
                  fontSize: 12,
                  color: resolveStatusColor(responseStatus),
                }}
              >
                {responseStatus}
              </Text>
            </Flex>
          )}

          {durationMs !== null && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {durationMs} ms
            </Text>
          )}
        </Flex>

        {/* แสดง error ถ้า payload ผิดรูปแบบ */}
        {error && (
          <Alert
            type="error"
            message={error}
            style={{ marginTop: 12, borderRadius: 8 }}
            showIcon
          />
        )}

        {/* แสดงผล Response */}
        {responseBody !== null && (
          <div style={{ marginTop: 12 }}>
            <Text
              type="secondary"
              style={{ fontSize: 11, display: "block", marginBottom: 4 }}
            >
              ผลลัพธ์
            </Text>
            <pre
              style={{
                margin: 0,
                background: "#0d1117",
                color: "#7ee787",
                padding: "12px 14px",
                borderRadius: 8,
                fontSize: 11,
                overflow: "auto",
                maxHeight: 300,
                fontFamily: "monospace",
                lineHeight: 1.6,
              }}
            >
              {responseBody}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}
