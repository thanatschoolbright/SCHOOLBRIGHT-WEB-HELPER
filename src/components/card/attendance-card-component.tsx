"use client";

import React from "react";
import { Card, Avatar, Typography, Tag, Badge, List, Space } from "antd";

export type AttendanceStudent = {
  user_id?: number;
  student_id?: string;
  student_name?: string;
  pic?: string | null;
  n_student_number?: number;
  scan_status?: string | null;
  status_check?: boolean;
};

type Props = {
  student: AttendanceStudent;
  index: number;
  isDuplicate?: boolean;
};

export default function AttendanceCard({ student, index, isDuplicate }: Props) {
  const id = student.user_id ?? student.student_id ?? index;
  const title = `${student.student_name || "-"} (${student.student_id || "-"})`;
  const orderNumber = student.n_student_number || index + 1;

  const card = (
    <List.Item key={id}>
      <Card
        size="small"
        type="inner"
        style={{
          background: "var(--ant-bg-container, #fafafa)",
          borderRadius: 12,
          position: "relative",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ position: "absolute", top: 6, right: 10, color: "var(--ant-text-disabled, #999)", fontSize: 14, fontWeight: 600 }}>
          #{orderNumber}
        </div>

        <Card.Meta
          avatar={
            student.pic ? (
              <Avatar src={student.pic} size={56} shape="square" style={{ borderRadius: 8 }} />
            ) : (
              <Avatar size={56} shape="square" style={{ borderRadius: 8 }}>
                {student.student_name?.slice(0, 1) || "-"}
              </Avatar>
            )
          }
          title={<Typography.Text strong style={{ fontSize: 15 }}>{title}</Typography.Text>}
          description={
            <div style={{ marginTop: 6 }}>
              <Space size="small">
                <Typography.Text>สถานะการเข้าเรียน</Typography.Text>
                <Tag color={student.scan_status === "ไม่เช็กชื่อ" ? "red" : student.scan_status ? "green" : "default"}>
                  {String(student.scan_status || "-")}
                </Tag>
              </Space>
            </div>
          }
        />
      </Card>
    </List.Item>
  );

  if (isDuplicate) {
    return (
      <List.Item key={id}>
        <Badge.Ribbon text="นักเรียนซ้ำ" color="red">
          {card}
        </Badge.Ribbon>
      </List.Item>
    );
  }

  return card;
}
