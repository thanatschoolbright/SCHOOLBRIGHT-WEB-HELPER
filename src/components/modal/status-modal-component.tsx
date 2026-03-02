"use client";

import {
  CheckCircleFilled,
  CloseCircleFilled,
  DeleteFilled,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import { Button, Flex, Input, Modal, Result, theme, Typography } from "antd";
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
  errorDetails?: unknown;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * StatusModalComponent
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

  const handleClose = () => {
    setConfirmInput("");
    onClose();
  };

  const handleConfirm = () => {
    if (isDelete && confirmInput !== "Delete") return;
    if (onConfirm) {
      onConfirm();
    } else {
      handleClose();
    }
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
      destroyOnHidden
      width={isError ? 600 : 420}
      styles={{ body: { padding: token.paddingLG } }}
    >
      {/* ใช้ Flex คุมการจัดวางแนวตั้งให้กึ่งกลาง (https://ant.design/components/flex/) */}
      <Flex vertical align="center" gap="large">
        {/* ส่วนแสดงสถานะ (Icon & Title) */}
        {isSuccess || isError ? (
          <Result
            status={isSuccess ? "success" : "error"}
            title={title ?? (isSuccess ? "ดำเนินการสำเร็จ" : "เกิดข้อผิดพลาด")}
            subTitle={message}
            // จัดการ Action Buttons ภายใน Result
            extra={
              !isError && (
                <Button
                  type="primary"
                  onClick={handleClose}
                  size="large"
                  block
                  style={{ height: 48, fontWeight: 600 }}
                >
                  {confirmLabel ?? "ตกลง"}
                </Button>
              )
            }
          />
        ) : (
          <Flex vertical align="center" gap="middle" style={{ width: "100%" }}>
            {/* ไอคอนสถานะ */}
            {renderIcon()}
            {/* หัวข้อโมดอล */}
            <Title level={4} style={{ margin: 0 }}>
              {title ?? (isDelete ? "ยืนยันการลบ" : "ยืนยันรายการ")}
            </Title>
            {/* ส่วนข้อความรายละเอียด จัดกึ่งกลางด้วย Flex */}
            <div style={{ textAlign: "center", width: "100%" }}>
              <Text type="secondary">{message}</Text>
            </div>
          </Flex>
        )}

        {/* ส่วนยืนยันการลบ (เฉพาะ Delete Mode) */}
        {isDelete && (
          <Flex
            vertical
            gap="x-small"
            style={{ width: "100%", marginBottom: token.marginSM }}
          >
            <Text type="danger" strong>
              โปรดพิมพ์คำว่า <Text code>Delete</Text> เพื่อยืนยัน
            </Text>
            <Input
              placeholder="Delete"
              size="large"
              value={confirmInput}
              onChange={(e) => {
                setConfirmInput(e.target.value);
              }}
              onPressEnter={handleConfirm}
              style={{ height: 40 }}
            />
          </Flex>
        )}

        {/* ปุ่มควบคุม (ยกเว้นโหมด Success ที่ใช้ Button ใน Result ไปแล้ว) */}
        {!isSuccess && (
          <Flex vertical gap="small" style={{ width: "100%" }}>
            {/* ปุ่มยืนยัน/ลบ - อยู่ด้านบนเพื่อความเด่นชัด */}
            <Button
              type="primary"
              danger={isDelete}
              onClick={handleConfirm}
              size="large"
              loading={loading}
              disabled={isDelete && confirmInput !== "Delete"}
              block
              style={{ height: 48, fontWeight: 600 }}
            >
              {confirmLabel ?? (isDelete ? "ลบรายการ" : "ยืนยัน")}
            </Button>

            {/* ปุ่มยกเลิก - อยู่ด้านล่าง */}
            <Button
              onClick={handleClose}
              size="large"
              block
              style={{ height: 48 }}
            >
              {cancelLabel ?? "ยกเลิก"}
            </Button>
          </Flex>
        )}

        {/* ส่วนแสดงรายละเอียด Error (แสดง Debug Info ในบรรทัดเดียวกับ Label) */}
        {isError && errorDetails && (
          <Flex
            gap="small"
            style={{
              width: "100%",
              background: token.colorFillAlter,
              padding: token.padding,
              borderRadius: token.borderRadiusLG,
              marginTop: token.marginXS,
            }}
          >
            <Text strong type="danger" style={{ whiteSpace: "nowrap" }}>
              Debug Information:
            </Text>
            <Paragraph
              code
              ellipsis={{ rows: 2, expandable: true, symbol: "ดูเพิ่มเติม" }}
              style={{ margin: 0, whiteSpace: "pre-wrap", flex: 1 }}
            >
              {typeof errorDetails === "string"
                ? errorDetails
                : JSON.stringify(errorDetails, null, 2)}
            </Paragraph>
          </Flex>
        )}
      </Flex>
    </Modal>
  );
};
