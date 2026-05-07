"use client";

import { ApiOutlined, DownloadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Input,
  Modal,
  Result,
  Row,
  Space,
  Spin,
  Typography,
  theme,
} from "antd";

interface SubmissionStatusModalProps {
  submissionStatus: "idle" | "loading" | "success" | "error";
  submissionMessage: string;
  debugData: any;
  onClose: () => void;
}

// ✨ Modal แสดงสถานะการบันทึกข้อมูลเวอร์ชัน (loading / success / error)
export const SubmissionStatusModal = ({
  submissionStatus,
  submissionMessage,
  debugData,
  onClose,
}: SubmissionStatusModalProps) => {
  const { token } = theme.useToken();

  return (
    <Modal
      open={submissionStatus !== "idle"}
      footer={null}
      onCancel={onClose}
      centered
      closable={submissionStatus !== "loading"}
      width={850}
    >
      {submissionStatus === "loading" && (
        <Flex vertical align="center" style={{ padding: "48px 0" }}>
          <Spin size="large" />
          <Typography.Text style={{ marginTop: 24, fontSize: 16 }}>
            กำลังดำเนินการบันทึกข้อมูล กรุณารอสักครู่...
          </Typography.Text>
        </Flex>
      )}

      {submissionStatus === "success" && (
        <Result
          status="success"
          title="บันทึกข้อมูลเวอร์ชันสำเร็จ"
          subTitle="ข้อมูลเวอร์ชันใหม่ถูกอัปเดตเข้าสู่ระบบเรียบร้อยแล้ว"
          extra={
            <Button type="primary" onClick={onClose}>
              ตกลง
            </Button>
          }
        />
      )}

      {submissionStatus === "error" && (
        <Result
          status="error"
          title="ไม่สามารถบันทึกข้อมูลได้"
          subTitle={submissionMessage}
          extra={[
            <Button type="primary" key="close" onClick={onClose}>
              ตกลง
            </Button>,
          ]}
        >
          {debugData && (
            <div
              style={{
                marginTop: 24,
                padding: 16,
                backgroundColor: token.colorFillAlter,
                borderRadius: 8,
              }}
            >
              <Typography.Title level={5}>
                <Space>
                  <ApiOutlined /> Debug Information
                </Space>
              </Typography.Title>

              {debugData._curl && (
                <div style={{ marginBottom: 12 }}>
                  <Typography.Text
                    strong
                    style={{ display: "block", marginBottom: 4 }}
                  >
                    CURL Command:
                  </Typography.Text>
                  <Input.TextArea
                    rows={4}
                    readOnly
                    value={debugData._curl}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      background: token.colorBgContainer,
                      color: token.colorInfoText,
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: 4,
                    }}
                  />
                </div>
              )}

              {debugData.debug && (
                <Descriptions
                  column={1}
                  bordered
                  size="small"
                  layout="horizontal"
                  style={{ marginBottom: 12 }}
                >
                  <Descriptions.Item label="API URL">
                    {debugData.debug.url}
                  </Descriptions.Item>
                  {debugData.debug.status && (
                    <Descriptions.Item label="HTTP Status">
                      {debugData.debug.status}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Error Type">
                    {debugData.debug.type}
                  </Descriptions.Item>
                </Descriptions>
              )}

              {(debugData.raw || debugData.status === "failed") && (
                <div>
                  <Typography.Text strong>Server Response:</Typography.Text>
                  <pre
                    style={{
                      margin: "8px 0 0",
                      padding: 12,
                      background: token.colorBgContainer,
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: 4,
                      maxHeight: 200,
                      overflow: "auto",
                      fontSize: 11,
                      color: token.colorText,
                    }}
                  >
                    {JSON.stringify(debugData.raw ?? debugData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Result>
      )}
    </Modal>
  );
};
