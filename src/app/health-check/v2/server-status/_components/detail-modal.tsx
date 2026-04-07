"use client";

import {
  ApiOutlined,
  BugOutlined,
  CloudServerOutlined,
  CopyOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import {
  Button,
  Descriptions,
  Flex,
  Modal,
  Tabs,
  Tag,
  theme,
  Typography,
} from "antd";
import React from "react";
import { toast } from "sonner";
import { useServerStatusStore } from "../_state/server-status-store";

const { Text } = Typography;

// คอมโพเนนต์ Modal สำหรับแสดงรายละเอียดทางเทคนิคของ API แต่ละรายการ
export const DetailModal: React.FC = () => {
  const { token } = theme.useToken();
  const { isDetailModalOpen, selectedItem, closeDetailModal } =
    useServerStatusStore();

  if (!selectedItem) return null;

  return (
    <Modal
      title={
        <Flex align="center" gap={16} style={{ paddingBottom: 16 }}>
          <Flex
            align="center"
            justify="center"
            style={{
              background: token.colorFillSecondary,
              padding: 8,
              borderRadius: 12,
              flexShrink: 0,
            }}
          >
            <BugOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
          </Flex>
          <Flex vertical gap={0} style={{ minWidth: 0 }}>
            <Text
              strong
              style={{ fontSize: 16, fontWeight: 600 }}
              ellipsis={{ tooltip: "Developer Debug Console" }}
            >
              Developer Debug Console
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ตรวจสอบรายละเอียดการทำงานของ API อย่างละเอียด
            </Text>
          </Flex>
        </Flex>
      }
      open={isDetailModalOpen}
      onCancel={closeDetailModal}
      footer={[
        <Button
          key="curl"
          icon={<CopyOutlined />}
          onClick={() => {
            navigator.clipboard.writeText(selectedItem.curl || "");
            toast.success("คัดลอก cURL เรียบร้อย");
          }}
        >
          คัดลอก cURL
        </Button>,
        <Button
          key="json"
          icon={<CopyOutlined />}
          onClick={() => {
            navigator.clipboard.writeText(
              JSON.stringify(selectedItem, null, 2),
            );
            toast.success("คัดลอก JSON ทั้งหมดเรียบร้อย");
          }}
        >
          คัดลอก JSON
        </Button>,
        <Button
          key="close"
          type="primary"
          onClick={closeDetailModal}
          style={{ fontWeight: 600 }}
        >
          ปิดหน้าต่าง
        </Button>,
      ]}
      width={900}
      centered
      styles={{ body: { padding: "0 24px 24px 24px" } }}
    >
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: (
              <Flex align="center" gap={6}>
                <ApiOutlined />
                <span>ภาพรวม</span>
              </Flex>
            ),
            children: (
              <Flex vertical gap={20} style={{ paddingTop: 16 }}>
                <Descriptions
                  bordered
                  column={2}
                  size="small"
                  styles={{ label: { fontWeight: 600, width: 150 } }}
                >
                  <Descriptions.Item label="ชื่อระบบ (TH)" span={2}>
                    {selectedItem.name_th}
                  </Descriptions.Item>
                  <Descriptions.Item label="ชื่อระบบ (EN)" span={2}>
                    {selectedItem.name_en}
                  </Descriptions.Item>
                  <Descriptions.Item label="โมดูล">
                    <Tag color="processing">{selectedItem.module}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="กลุ่มระบบ">
                    <Tag color="cyan">{selectedItem.group}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="สถานะ HTTP">
                    <Tag
                      color={
                        ["200", "404"].includes(selectedItem.status)
                          ? "success"
                          : "error"
                      }
                    >
                      {selectedItem.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="โดเมน">
                    {selectedItem.service}
                  </Descriptions.Item>
                </Descriptions>

                <Flex vertical gap={8}>
                  <Flex justify="space-between" align="center">
                    <Text strong>cURL Command:</Text>
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText(selectedItem.curl || "");
                        toast.success("คัดลอก cURL เรียบร้อย");
                      }}
                    >
                      Copy
                    </Button>
                  </Flex>
                  <pre
                    style={{
                      background: token.colorFillQuaternary,
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 12,
                      border: `1px solid ${token.colorBorder}`,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {selectedItem.curl}
                  </pre>
                </Flex>
              </Flex>
            ),
          },
          {
            key: "2",
            label: (
              <Flex align="center" gap={6}>
                <CloudServerOutlined />
                <span>ข้อมูล Request</span>
              </Flex>
            ),
            children: (
              <Flex vertical gap={20} style={{ paddingTop: 16 }}>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  styles={{ label: { fontWeight: 600, width: 120 } }}
                >
                  <Descriptions.Item label="URL">
                    <Text copyable>{selectedItem.request.url}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Method">
                    <Tag
                      color={
                        selectedItem.request.method === "POST" ? "red" : "green"
                      }
                    >
                      {selectedItem.request.method}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>

                {selectedItem.request.headers && (
                  <Flex vertical gap={8}>
                    <Flex justify="space-between" align="center">
                      <Text strong>Headers:</Text>
                      <Button
                        size="small"
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(
                              selectedItem.request.headers,
                              null,
                              2,
                            ),
                          );
                          toast.success("คัดลอก Headers เรียบร้อย");
                        }}
                      >
                        Copy
                      </Button>
                    </Flex>
                    <pre
                      style={{
                        background: token.colorFillQuaternary,
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 12,
                        border: `1px solid ${token.colorBorder}`,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {JSON.stringify(selectedItem.request.headers, null, 2)}
                    </pre>
                  </Flex>
                )}

                {(selectedItem.request.params ||
                  selectedItem.request.body ||
                  selectedItem.request.data) && (
                  <Flex vertical gap={8}>
                    <Flex justify="space-between" align="center">
                      <Text strong>Payload (Params / Body):</Text>
                      <Button
                        size="small"
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(
                              selectedItem.request.params ||
                                selectedItem.request.body ||
                                selectedItem.request.data,
                              null,
                              2,
                            ),
                          );
                          toast.success("คัดลอก Payload เรียบร้อย");
                        }}
                      >
                        Copy
                      </Button>
                    </Flex>
                    <pre
                      style={{
                        background: token.colorFillQuaternary,
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 12,
                        border: `1px solid ${token.colorBorder}`,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {JSON.stringify(
                        selectedItem.request.params ||
                          selectedItem.request.body ||
                          selectedItem.request.data,
                        null,
                        2,
                      )}
                    </pre>
                  </Flex>
                )}
              </Flex>
            ),
          },
          {
            key: "3",
            label: (
              <Flex align="center" gap={6}>
                <DatabaseOutlined />
                <span>ข้อมูล Response</span>
              </Flex>
            ),
            children: (
              <Flex vertical gap={8} style={{ paddingTop: 16 }}>
                <Flex justify="space-between" align="center">
                  <Text strong>Response JSON:</Text>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(selectedItem.response, null, 2),
                      );
                      toast.success("คัดลอก Response เรียบร้อย");
                    }}
                  >
                    Copy
                  </Button>
                </Flex>
                <pre
                  style={{
                    background: token.colorFillQuaternary,
                    padding: 16,
                    borderRadius: 12,
                    maxHeight: 500,
                    overflowY: "auto",
                    border: `1px solid ${token.colorBorder}`,
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {JSON.stringify(selectedItem.response, null, 2)}
                </pre>
              </Flex>
            ),
          },
        ]}
      />
    </Modal>
  );
};
