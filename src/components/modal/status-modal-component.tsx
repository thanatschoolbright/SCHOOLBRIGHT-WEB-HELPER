"use client";

import {
  CheckCircleFilled,
  CloseCircleFilled,
  DeleteFilled,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import {
  Button,
  Flex,
  Input,
  Modal,
  Result,
  Space,
  theme,
  Typography,
} from "antd";
import React, { useState } from "react";

const { Title, Text, Paragraph } = Typography;

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
 * อ้างอิงเอกสาร: https://ant.design/components/modal/
 * และ https://ant.design/components/result/
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

  // ดึง Icon และข้อความเริ่มต้นตามประเภท (ใช้ Filled Icon เพื่อความ Modern ตาม AntD v5)
  const renderIcon = () => {
    switch (type) {
      case "success":
        return (
          <CheckCircleFilled
            style={{ color: token.colorSuccess, fontSize: 64 }}
          />
        );
      case "error":
        return (
          <CloseCircleFilled
            style={{ color: token.colorError, fontSize: 64 }}
          />
        );
      case "delete":
        return (
          <DeleteFilled style={{ color: token.colorError, fontSize: 64 }} />
        );
      default:
        return (
          <ExclamationCircleFilled
            style={{ color: token.colorWarning, fontSize: 64 }}
          />
        );
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      destroyOnClose
      width={isError ? 600 : 420}
      styles={{ body: { paddingBlock: token.paddingLG } }}
    >
      {/* ใช้ Flex คุมการจัดวางแนวตั้งให้กึ่งกลาง (https://ant.design/components/flex/) */}
      <Flex vertical align="center" gap="middle">
        {/* ส่วนแสดงสถานะ (Icon & Title) */}
        {isSuccess || isError ? (
          <Result
            status={type as "success" | "error"}
            title={title || (isSuccess ? "ดำเนินการสำเร็จ" : "เกิดข้อผิดพลาด")}
            subTitle={message}
            // จัดการ Action Buttons ภายใน Result
            extra={
              !isError && (
                <Button type="primary" onClick={handleClose} size="large" block>
                  {confirmLabel || "ตกลง"}
                </Button>
              )
            }
          />
        ) : (
          <Flex vertical align="center" gap="small">
            {/* ไอคอนสถานะ */}
            {renderIcon()}
            {/* หัวข้อโมดอล */}
            <Title level={4}>
              {title || (isDelete ? "ยืนยันการลบ" : "ยืนยันรายการ")}
            </Title>
            {/* ส่วนข้อความรายละเอียด จัดกึ่งกลางด้วย Flex */}
            <Flex justify="center" style={{ width: "100%" }}>
              <Text type="secondary">{message}</Text>
            </Flex>
          </Flex>
        )}

        {/* ส่วนยืนยันการลบ (เฉพาะ Delete Mode) */}
        {isDelete && (
          <Flex vertical gap="x-small" style={{ width: "100%" }}>
            <Text type="danger" strong className="mb-3">
              โปรดพิมพ์คำว่า <Text code>Delete</Text> เพื่อยืนยัน
            </Text>
            <Input
              placeholder="Delete"
              size="large"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onPressEnter={handleConfirm}
              autoFocus
            />
          </Flex>
        )}

        {/* ปุ่มควบคุม (ยกเว้นโหมด Success ที่ใช้ Button ใน Result ไปแล้ว) */}
        {!isSuccess && (
          <Space
            size="middle"
            style={{ width: "100%", justifyContent: "center" }}
          >
            {/* ปุ่มยกเลิก */}
            <Button
              onClick={handleClose}
              size="large"
              style={{ minWidth: 120 }}
            >
              {cancelLabel || "ยกเลิก"}
            </Button>
            {/* ปุ่มยืนยัน/ลบ */}
            <Button
              type="primary"
              danger={isDelete}
              onClick={handleConfirm}
              size="large"
              loading={loading}
              disabled={isDelete && confirmInput !== "Delete"}
              style={{ minWidth: 120 }}
            >
              {confirmLabel || (isDelete ? "ลบรายการ" : "ยืนยัน")}
            </Button>
          </Space>
        )}

        {/* ส่วนแสดงรายละเอียด Error (Truncate & Scroll ภายใน Typography) */}
        {isError && errorDetails && (
          <Flex
            vertical
            style={{
              width: "100%",
              background: token.colorFillAlter,
              padding: token.padding,
              borderRadius: token.borderRadiusLG,
            }}
          >
            <Text strong type="danger">
              Debug Information:
            </Text>
            <Paragraph
              code
              ellipsis={{ rows: 5, expandable: true, symbol: "ดูเพิ่มเติม" }}
              style={{ marginBlock: token.marginXS, whiteSpace: "pre-wrap" }}
            >
              {typeof errorDetails === "object"
                ? JSON.stringify(errorDetails, null, 2)
                : String(errorDetails)}
            </Paragraph>
          </Flex>
        )}
      </Flex>
    </Modal>
  );
};
