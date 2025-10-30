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
  // number of duplicate entries for this student (including the primary one)
  duplicateCount?: number;
};
export default function AttendanceCard({ student, index, duplicateCount }: Props) {
  const id = student.user_id ?? student.student_id ?? index;
  const title = `${student.student_name || "-"} (${student.student_id || "-"})`;
  const orderNumber = student.n_student_number ?? index + 1;

  const hasNotChecked = student.scan_status === "ไม่เช็กชื่อ";

  // Card content
  const innerCard = (
    <Card size="small" type="inner" style={{ ...cardBase }}>
      <div style={orderStyle}>#{orderNumber}</div>

      <Card.Meta
        avatar={
          student.pic ? (
            <Avatar src={student.pic} size={80} shape="square" style={avatarStyle} />
          ) : (
            <Avatar size={80} shape="square" style={avatarStyle}>
              {student.student_name?.slice(0, 1) || "-"}
            </Avatar>
          )
        }
        title={<Typography.Text strong style={titleStyle}>{title}</Typography.Text>}
        description={
          <div style={descriptionStyle}>
            <Space size="small">
              <Typography.Text>สถานะการเข้าเรียน</Typography.Text>
              <Tag color={hasNotChecked ? "red" : student.scan_status ? "green" : "default"}>
                {String(student.scan_status || "-")}
              </Tag>
            </Space>
          </div>
        }
      />
    </Card>
  );

  // If duplicateCount > 1, wrap with ribbon and add a red border accent via style override
  if (duplicateCount && duplicateCount > 1) {
    return (
      <List.Item key={id}>
        <Badge.Ribbon text={`นักเรียนซ้ำ x${duplicateCount}`} color="red">
          <div style={{ ...cardWrapper, border: "1px solid #ff7875" }}>{innerCard}</div>
        </Badge.Ribbon>
      </List.Item>
    );
  }

  return <List.Item key={id}>{innerCard}</List.Item>;
}

// ----- Styles (bottom of file) -----
const cardBase: React.CSSProperties = {
  borderRadius: 12,
  position: "relative",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  padding: 0,
};

const cardWrapper: React.CSSProperties = {
  borderRadius: 12,
  overflow: "hidden",
};

const orderStyle: React.CSSProperties = {
  position: "absolute",
  top: 6,
  right: 10,
  color: "var(--ant-text-disabled, #999)",
  fontSize: 14,
  fontWeight: 600,
};

const avatarStyle: React.CSSProperties = {
  borderRadius: 8,
};

const titleStyle: React.CSSProperties = {
  fontSize: 15,
};

const descriptionStyle: React.CSSProperties = {
  marginTop: 6,
};

