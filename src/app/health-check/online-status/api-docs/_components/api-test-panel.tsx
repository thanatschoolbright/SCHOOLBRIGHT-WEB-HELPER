"use client";

import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import { PlayCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Card, Input, Space, Tag, Typography, message } from "antd";
import { useState } from "react";

const { Text, Paragraph } = Typography;

interface ApiTestPanelProps {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  defaultPayload?: string;
  title: string;
}

/**
 * Component สำหรับทดสอบเรียกใช้งาน API สำหรับ Developer
 */
export const ApiTestPanel = ({
  method,
  endpoint,
  defaultPayload,
  title,
}: ApiTestPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [payload, setPayload] = useState(defaultPayload || "");

  const handleTest = async () => {
    setLoading(true);
    try {
      let res;
      if (method === "GET") {
        res = await callApiService.get(endpoint);
      } else if (method === "POST") {
        res = await callApiService.post(
          endpoint,
          payload ? JSON.parse(payload) : {},
        );
      } else if (method === "PUT") {
        res = await callApiService.put(
          endpoint,
          payload ? JSON.parse(payload) : {},
        );
      }

      setResponse(res?.data);
      message.success("เรียกใช้งาน API สำเร็จ");
    } catch (error: any) {
      setResponse(error.response?.data || { error: error.message });
      message.error("การเรียกใช้งาน API ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      type="inner"
      title={
        <Space>
          <PlayCircleOutlined /> ทดลองใช้งาน: {title}
        </Space>
      }
      style={{ marginTop: 16, borderLeft: "4px solid #1890ff" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={12}>
        <Flex align="center" gap={8}>
          <Tag
            color={
              method === "GET" ? "blue" : method === "POST" ? "green" : "orange"
            }
          >
            {method}
          </Tag>
          <Text code>{endpoint}</Text>
        </Flex>

        {method !== "GET" && (
          <div>
            <Text strong>Request Body (JSON):</Text>
            <Input.TextArea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={4}
              style={{ marginTop: 8, fontFamily: "monospace" }}
              placeholder='{ "key": "value" }'
            />
          </div>
        )}

        <Button
          type="primary"
          icon={loading ? <SyncOutlined spin /> : <PlayCircleOutlined />}
          onClick={handleTest}
          loading={loading}
        >
          ส่งคำขอทดสอบ
        </Button>

        {response && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Response:</Text>
            <pre
              style={{
                background: "#1e1e1e",
                color: "#d4d4d4",
                padding: 12,
                borderRadius: 8,
                marginTop: 8,
                fontSize: "12px",
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </Space>
    </Card>
  );
};

import { Flex } from "antd";
