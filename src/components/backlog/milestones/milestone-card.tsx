"use client";

import { Button, Card, Popconfirm, Space, Tag, Typography } from "antd";
import type { ReactNode } from "react";

import type { Milestone } from "@components/backlog/issue-drawer/types";

export type MilestoneCardProps = {
  actionExtras?: ReactNode;
  deleting?: boolean;
  milestone: Milestone;
  onDelete: (milestoneId: number) => void;
  onEdit: (milestone: Milestone) => void;
};

//** การ์ดแสดงรายละเอียดไมล์สโตนแต่ละตัว พร้อมปุ่มแก้ไข/ลบ **
export default function MilestoneCard({
  actionExtras,
  deleting = false,
  milestone,
  onDelete,
  onEdit,
}: MilestoneCardProps) {
  return (
    <Card
      bodyStyle={{ padding: 20 }}
      style={{
        background: "#ffffff",
        border: "1px solid #eef0f4",
        borderRadius: 18,
        boxShadow: "0 16px 32px rgba(15, 23, 42, 0.05)",
      }}
      title={
        <Space size={12} wrap>
          <Typography.Text strong>{milestone.name}</Typography.Text>
          {milestone.archived ? (
            <Tag color="default">ปิดใช้งาน</Tag>
          ) : (
            <Tag color="processing">ใช้งาน</Tag>
          )}
        </Space>
      }
      extra={
        <Space size={8}>
          {actionExtras}
          <Button onClick={() => onEdit(milestone)} type="link">
            แก้ไข
          </Button>
          <Popconfirm
            cancelText="ยกเลิก"
            okText="ลบ"
            title="ยืนยันการลบไมล์สโตน"
            onConfirm={() => onDelete(milestone.id)}
          >
            <Button danger loading={deleting} type="link">
              ลบ
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          {milestone.description || "-"}
        </Typography.Paragraph>
        <Typography.Text type="secondary">
          เริ่ม: {formatDate(milestone.startDate)} • กำหนดส่ง: {formatDate(milestone.releaseDueDate)}
        </Typography.Text>
      </Space>
    </Card>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}
