"use client";

import { Button, Card, Popconfirm, Space, Tag, theme, Typography } from "antd";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { useMemo } from "react";

import type { Milestone } from "@components/backlog/issue-drawer/types";

export type MilestoneCardProps = {
  actionExtras?: ReactNode;
  deleting?: boolean;
  milestone: Milestone;
  onDelete: (milestoneId: number) => void;
  onEdit: (milestone: any) => void;
};

//** การ์ดแสดงรายละเอียดไมล์สโตนแต่ละตัว พร้อมปุ่มแก้ไข/ลบ **
export default function MilestoneCard({
  actionExtras,
  deleting = false,
  milestone,
  onDelete,
  onEdit,
}: MilestoneCardProps) {
  const { token } = theme.useToken();
  const {
    colorBgContainer,
    colorBorderSecondary,
    colorTextSecondary,
    colorSuccess,
    colorWarning,
    colorBgBase,
  } = token;
  const status = useMemo(() => deriveMilestoneStatus(milestone), [milestone]);
  //** สร้างสไตล์การ์ดตามธีม Ant Design เพื่อรองรับ Dark Mode และสถานะไมล์สโตน **
  const isDarkMode = colorBgBase?.toLowerCase() === "#141414";
  const borderColor = useMemo(() => {
    if (status === "in-progress") return colorWarning;
    if (status === "completed") return colorSuccess;
    return colorBorderSecondary;
  }, [colorBorderSecondary, colorSuccess, colorWarning, status]);
  const boxShadow = "none";
  const cardStyle = useMemo(
    () => ({
      background: colorBgContainer,
      border: `1px solid ${borderColor}`,
      borderRadius: 18,
      boxShadow: "none",
      transition: "border-color 0.3s ease",
    }),
    [borderColor, colorBgContainer],
  );

  return (
    <Card
      styles={{
        body: {
          padding: 20,
        },
      }}
      style={cardStyle}
      title={
        <Space size={12} wrap>
          <Typography.Text strong>{milestone.name}</Typography.Text>
          <MilestoneStatusTag status={status} />
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
        <Typography.Text style={{ color: colorTextSecondary }}>
          เริ่ม: {formatDate(milestone.startDate)} • กำหนดส่ง:{" "}
          {formatDate(milestone.releaseDueDate)}
        </Typography.Text>
      </Space>
    </Card>
  );
}

function formatDate(value?: string | null) {
  //** แปลงวันที่เป็นรูปแบบ DD/MM/YYYY **
  if (!value) return "-";
  return dayjs(value).format("DD/MM/YYYY");
}

function deriveMilestoneStatus(milestone: Milestone) {
  //** คืนสถานะไมล์สโตนตามช่วงวันที่เริ่ม-สิ้นสุด **
  const start = milestone.startDate ? new Date(milestone.startDate) : null;
  const end = milestone.releaseDueDate
    ? new Date(milestone.releaseDueDate)
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (end) {
    end.setHours(23, 59, 59, 999);
  }
  if (start) {
    start.setHours(0, 0, 0, 0);
  }

  if (end && today > end) return "completed" as const;
  if (start && end && today >= start && today <= end)
    return "in-progress" as const;
  return "upcoming" as const;
}

type MilestoneStatus = ReturnType<typeof deriveMilestoneStatus>;

//** ป้ายสถานะแสดงผลแบบเรียบง่ายตามสถานะไมล์สโตน **
function MilestoneStatusTag({ status }: { status: MilestoneStatus }) {
  const { token } = theme.useToken();
  if (status === "completed") {
    return <Tag color={token.colorSuccess}>เสร็จสิ้น</Tag>;
  }
  if (status === "in-progress") {
    return <Tag color={token.colorWarning}>กำลังทำ</Tag>;
  }
  return <Tag color={token.colorInfo}>กำลังจะเริ่ม</Tag>;
}
