"use client";

import React, { useState } from "react";
import { Modal, Button, Space, Typography, Input } from "antd";
import { FiX } from "react-icons/fi";

interface DeleteConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
  title?: string;
  description?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  onCancel,
  onConfirm,
  isDeleting = false,
  title = "ยืนยันการลบเวอร์ชัน",
  description = "คุณแน่ใจหรือไม่ว่าต้องการลบเวอร์ชันนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
}) => {
  const [confirmText, setConfirmText] = useState("");

  const handleCancel = () => {
    setConfirmText("");
    onCancel();
  };

  const handleConfirm = async () => {
    await onConfirm();
    setConfirmText("");
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      closeIcon={<FiX className="text-gray-500 hover:text-gray-700" />}
      className="rounded-lg overflow-hidden"
      width={400}
    >
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        {title}
      </Typography.Title>
      <Typography.Paragraph style={{ marginBottom: 24 }}>
        {description}
      </Typography.Paragraph>
      <Typography.Text type="secondary">
        โปรดพิมพ์ <b>Delete</b> เพื่อยืนยันการลบ
      </Typography.Text>
      <Input
        style={{ margin: "12px 0 20px 0" }}
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder='พิมพ์ "Delete"'
        disabled={isDeleting}
        autoFocus
      />
      <Space
        style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
      >
        <Button type="default" onClick={handleCancel} disabled={isDeleting}>
          ยกเลิก
        </Button>
        <Button
          type="primary"
          danger
          onClick={handleConfirm}
          disabled={isDeleting || confirmText !== "Delete"}
        >
          {isDeleting ? "กำลังลบ..." : "ยืนยัน"}
        </Button>
      </Space>
    </Modal>
  );
};

export default DeleteConfirmModal;
