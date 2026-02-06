"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Result, Space, theme, Typography } from "antd";
import React, { useState } from "react";

const { Paragraph, Text, Title } = Typography;

export type StatusModalType = "success" | "error" | "confirm" | "delete";

interface StatusModalComponentProps {
  open: boolean;
  type: StatusModalType;
  title?: string;
  message?: string;
  onClose: () => void;
  onConfirm?: () => void;
  loading?: boolean;
  errorDetails?: any;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * 🎨 StatusModalComponent
 * คอมโพเนนต์กลางสำหรับแสดงผล Success, Error, และ Confirmation
 */
export const StatusModalComponent: React.FC<StatusModalComponentProps> = ({
  open,
  type,
  title,
  message,
  onClose,
  onConfirm,
  loading = false,
  errorDetails,
  confirmLabel,
  cancelLabel,
}) => {
  const { token } = theme.useToken();
  const [confirmInput, setConfirmInput] = useState("");

  const isSuccess = type === "success";
  const isError = type === "error";
  const isDelete = type === "delete";
  const isConfirm = type === "confirm";

  const handleClose = () => {
    setConfirmInput("");
    onClose();
  };

  const handleConfirm = () => {
    if (isDelete && confirmInput !== "Delete") return;
    onConfirm?.();
    setConfirmInput("");
  };

  // กรองสีไอคอนและหัวข้อตามประเภท
  const getModalConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircleOutlined style={{ color: token.colorSuccess }} />,
          title: title || "ดำเนินการสำเร็จ",
          color: token.colorSuccess,
        };
      case "error":
        return {
          icon: <CloseCircleOutlined style={{ color: token.colorError }} />,
          title: title || "เกิดข้อผิดพลาด",
          color: token.colorError,
        };
      case "delete":
        return {
          icon: <DeleteOutlined style={{ color: token.colorError }} />,
          title: title || "ยืนยันการลบ",
          color: token.colorError,
        };
      default:
        return {
          icon: (
            <ExclamationCircleOutlined style={{ color: token.colorWarning }} />
          ),
          title: title || "ยืนยันการทำรายการ",
          color: token.colorWarning,
        };
    }
  };

  const config = getModalConfig();

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      destroyOnHidden
      width={isSuccess || isConfirm || isDelete ? 480 : 640}
    >
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        {/* แสดง Result หรือ Custom UI ตามประเภท */}
        {isSuccess || isError ? (
          <Result
            status={type as "success" | "error"}
            title={config.title}
            subTitle={message}
            extra={[
              <Button
                type="primary"
                key="close"
                onClick={handleClose}
                size="large"
                style={{ minWidth: 120, borderRadius: 8 }}
                loading={loading}
              >
                {confirmLabel || "ตกลง"}
              </Button>,
            ]}
          />
        ) : (
          <div style={{ padding: "0 20px" }}>
            <div style={{ fontSize: 54, marginBottom: 16 }}>{config.icon}</div>
            <Title level={4}>{config.title}</Title>
            <Paragraph type="secondary" style={{ fontSize: 16 }}>
              {message}
            </Paragraph>

            {isDelete && (
              <div style={{ marginTop: 24, textAlign: "left" }}>
                <Text type="danger" strong>
                  โปรดพิมพ์คำว่า <Text code>Delete</Text> เพื่อยืนยันการลบ
                </Text>
                <Input
                  placeholder="Delete"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  style={{ marginTop: 8, height: 45, borderRadius: 8 }}
                  onPressEnter={handleConfirm}
                  autoFocus
                />
              </div>
            )}

            <Space
              size="middle"
              style={{ marginTop: 32, width: "100%", justifyContent: "center" }}
            >
              <Button
                onClick={handleClose}
                size="large"
                style={{ minWidth: 120, borderRadius: 8 }}
                disabled={loading}
              >
                {cancelLabel || "ยกเลิก"}
              </Button>
              <Button
                type="primary"
                danger={isDelete}
                onClick={handleConfirm}
                size="large"
                style={{ minWidth: 120, borderRadius: 8 }}
                loading={loading}
                disabled={isDelete && confirmInput !== "Delete"}
              >
                {confirmLabel || (isDelete ? "ใช่, ลบรายการ" : "ยืนยัน")}
              </Button>
            </Space>
          </div>
        )}

        {/* รายละเอียดข้อผิดพลาดเฉพาะโหมด Error */}
        {isError && errorDetails && (
          <div
            style={{
              marginTop: 24,
              background: token.colorFillAlter,
              padding: "16px",
              borderRadius: "12px",
              border: `1px solid ${token.colorBorderSecondary}`,
              textAlign: "left",
            }}
          >
            <Text strong style={{ color: token.colorError }}>
              Debug Information:
            </Text>
            <pre
              style={{
                marginTop: 8,
                fontSize: "12px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: "200px",
                overflowY: "auto",
                fontFamily: "monospace",
                color: token.colorTextSecondary,
              }}
            >
              {typeof errorDetails === "object"
                ? JSON.stringify(errorDetails, null, 2)
                : String(errorDetails)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};
