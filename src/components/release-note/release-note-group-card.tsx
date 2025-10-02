"use client";
//** การ์ดแสดง Release Notes แบบกลุ่ม (Minimal โทนขาว ใช้ Ant Design ทั้งหมด)
import React from "react";
import { Card, Space, Typography, Tag, theme, Divider } from "antd";
import type { ReleaseNoteGroup, ReleaseNoteItem } from "@components/release-note/types";

//** map สีของ Tag ตามประเภทการเปลี่ยนแปลง
const typeColor: Record<ReleaseNoteItem["type"], string> = {
  add: "green",
  update: "blue",
  remove: "red",
};

type Props = {
  group: ReleaseNoteGroup;
};

export default function ReleaseNoteGroupCard({ group }: Props) {
  const { token } = theme.useToken();

  return (
    <Card
      size="small"
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: 12,
      }}
      styles={{ header: { padding: "12px 16px" }, body: { padding: 16 } }}
      title={
        //** ส่วนหัวการ์ด: วันที่ของ Release Note
        <Space direction="vertical" size={0}>
          <Typography.Text strong>Release Notes</Typography.Text>
          <Typography.Text type="secondary">{group.date}</Typography.Text>
        </Space>
      }
    >
      {/* รายการ Release Notes */}
      <Space direction="vertical" style={{ width: "100%" }} size={10}>
        {group.release_note.map((item, idx) => (
          <div key={`${group.date}-${idx}`}>
            <Space align="start" style={{ width: "100%" }}>
              {/* แท็กประเภท + emoji แบบ Minimal */}
              <Tag color={typeColor[item.type]}>{item.emoji}</Tag>
              {/* ข้อความอธิบายการเปลี่ยนแปลง */}
              <Typography.Text style={{ color: token.colorText }}>
                {item.message}
              </Typography.Text>
            </Space>
            {idx < group.release_note.length - 1 ? (
              <Divider style={{ margin: "10px 0" }} />
            ) : null}
          </div>
        ))}
      </Space>
    </Card>
  );
}
