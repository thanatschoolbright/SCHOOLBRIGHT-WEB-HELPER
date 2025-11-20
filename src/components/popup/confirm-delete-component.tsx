"use client";

import React from "react";
import { Popconfirm, PopconfirmProps } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

interface ConfirmDeleteProps {
  id?: string | number;
  onConfirm: (id?: string | number) => Promise<void> | void;
  title?: React.ReactNode;
  placement?: PopconfirmProps["placement"];
  children: React.ReactNode;
  okText?: string;
  cancelText?: string;
}

export default function ConfirmDelete({
  id,
  onConfirm,
  title = "ต้องการลบรายการนี้หรือไม่?",
  placement = "left",
  children,
  okText = "ลบ",
  cancelText = "ยกเลิก",
}: ConfirmDeleteProps) {
  const handleConfirm = async () => {
    await onConfirm(id);
  };

  return (
    <Popconfirm
      title={title}
      description="การดำเนินการนี้ไม่สามารถย้อนกลับได้"
      placement={placement}
      onConfirm={handleConfirm}
      okText={okText}
      cancelText={cancelText}
      icon={<ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />}
      okButtonProps={{ 
        danger: true,
        size: "middle"
      }}
      cancelButtonProps={{
        size: "middle"
      }}
    >
      {children}
    </Popconfirm>
  );
}