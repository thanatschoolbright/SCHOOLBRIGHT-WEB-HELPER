import {
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  LoginOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Flex, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TFunction } from "i18next";
import React from "react";
import type { SchoolDetail } from "../types/bypass.types";
import { compareValues } from "./bypass.helpers";

const STATUS_COLOR_MAP: Record<string, string> = {
  active: "success",
  inactive: "error",
};

const getAvatarColor = (name: string) => {
  const colors = [
    "#f5222d",
    "#fa541c",
    "#fa8c16",
    "#faad14",
    "#fadb14",
    "#a0d911",
    "#52c41a",
    "#13c2c2",
    "#1890ff",
    "#2f54eb",
    "#722ed1",
    "#eb2f96",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const addAlpha = (color: string, alpha: number) => {
  if (!color) return "rgba(0,0,0,0)";
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

const GRADE_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  A: { color: "#faad14", icon: <CrownOutlined /> },
  B: { color: "#52c41a", icon: <StarOutlined /> },
  C: { color: "#1890ff", icon: <RocketOutlined /> },
  D: { color: "#fa8c16", icon: <ToolOutlined /> },
  E: { color: "#f5222d", icon: <AlertOutlined /> },
  F: { color: "#722ed1", icon: <ThunderboltOutlined /> },
  "-": { color: "#8c8c8c", icon: <SafetyCertificateOutlined /> },
};

export const buildTableColumns = (
  TRANSLATION: TFunction,
  onOpenBypassModal: (record: SchoolDetail) => void,
): ColumnsType<SchoolDetail> => [
  {
    title: "#",
    key: "index",
    width: 70,
    align: "center",
    fixed: "left",
    render: (_value, _record, index) => (
      <Typography.Text strong style={{ opacity: 0.4, fontSize: 13 }}>
        {(index + 1).toString().padStart(2, "0")}
      </Typography.Text>
    ),
  },
  {
    title: "รหัส",
    dataIndex: "school_id",
    key: "school_id",
    width: 120,
    sorter: (a, b) => compareValues(a.school_id, b.school_id),
    render: (value) => (
      <Tag
        bordered={false}
        style={{
          borderRadius: 6,
          fontWeight: 700,
          fontSize: 11,
          background: "rgba(0,0,0,0.05)",
        }}
      >
        {value ?? "-"}
      </Tag>
    ),
  },
  {
    title: "ชื่อโรงเรียน",
    key: "company_name",
    width: 350,
    fixed: "left",
    sorter: (a, b) => compareValues(a.company_name, b.company_name),
    render: (_value, r) => (
      <Flex align="center" gap={16}>
        <Avatar
          size={48}
          style={{
            background: getAvatarColor(r.company_name || ""),
            color: "#fff",
            fontSize: 20,
            fontWeight: 800,
            borderRadius: 14,
            border: "2px solid rgba(255,255,255,0.1)",
          }}
        >
          {r.company_name?.charAt(0)}
        </Avatar>
        <Flex vertical gap={0}>
          <Typography.Text strong style={{ fontSize: 16, lineHeight: 1.3 }}>
            {r.company_name || "-"}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {r.province || "-"} • {r.school_group || "ทั่วไป"}
          </Typography.Text>
        </Flex>
      </Flex>
    ),
  },
  {
    title: "จังหวัด",
    dataIndex: "province",
    key: "province",
    width: 150,
    sorter: (a, b) => compareValues(a.province, b.province),
    render: (value) => value || "-",
  },
  {
    title: "ประเภท",
    dataIndex: "school_type",
    key: "school_type",
    width: 150,
    sorter: (a, b) => compareValues(a.school_type, b.school_type),
    render: (value) => {
      if (!value) return "-";
      const isSoftware = value === "Software";
      const color = isSoftware ? "green" : "blue";
      const label = isSoftware ? "ซอฟต์แวร์" : value;
      return <Tag color={color}>{label}</Tag>;
    },
  },
  {
    title: "จำนวนนักเรียน",
    dataIndex: "student_count",
    key: "student_count",
    width: 150,
    align: "right",
    sorter: (a, b) => {
      const parse = (v: unknown): number => {
        const num =
          typeof v === "string"
            ? Number(v.replace(/[^0-9.-]/g, ""))
            : Number(v);
        return Number.isFinite(num) ? num : 0;
      };
      return parse(a.student_count) - parse(b.student_count);
    },
    render: (value) => {
      const num =
        typeof value === "string"
          ? Number(value.replace(/[^0-9.-]/g, ""))
          : Number(value);
      const safeValue = Number.isFinite(num) ? num : 0;
      return safeValue.toLocaleString("th-TH");
    },
  },
  {
    title: "สังกัด/กลุ่มพื้นฐาน",
    dataIndex: "school_group",
    key: "school_group",
    width: 180,
    sorter: (a, b) => compareValues(a.school_group, b.school_group),
    render: (value) => value || "-",
  },
  {
    title: "เกรด",
    dataIndex: "school_grade",
    key: "school_grade",
    width: 100,
    align: "center",
    sorter: (a, b) => compareValues(a.school_grade, b.school_grade),
    render: (value) => {
      const normalized = (value ?? "-").trim().toUpperCase();
      const config = GRADE_CONFIG[normalized] ?? GRADE_CONFIG["-"];
      return (
        <Tag
          bordered={false}
          icon={config.icon}
          style={{
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 12,
            background: addAlpha(config.color, 0.1),
            color: config.color,
            padding: "2px 10px",
          }}
        >
          {normalized}
        </Tag>
      );
    },
  },
  {
    title: "สถานะ",
    dataIndex: "isActive",
    key: "isActive",
    width: 130,
    align: "center",
    sorter: (a, b) => compareValues(a.isActive, b.isActive),
    render: (value) => {
      if (!value) return <Tag>-</Tag>;
      const lower = value.toLowerCase();
      const isActive = lower === "active";
      const color = isActive ? "#52c41a" : "#f5222d";
      const icon = isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
      const label = isActive ? "เปิดใช้งาน" : "ปิดใช้งาน";
      return (
        <Tag
          bordered={false}
          icon={icon}
          style={{
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 11,
            background: addAlpha(color, 0.1),
            color: color,
            padding: "2px 10px",
          }}
        >
          {label}
        </Tag>
      );
    },
  },
  {
    title: "ดำเนินการ",
    key: "actions",
    fixed: "right",
    width: 160,
    align: "center",
    render: (_value, record) => (
      <Button
        type="primary"
        icon={<LoginOutlined />}
        iconPosition="end"
        shape="round"
        onClick={() => onOpenBypassModal(record)}
        style={{
          fontWeight: 600,
          background: "linear-gradient(135deg, #1890ff 0%, #1d39c4 100%)",
          border: "none",
          height: 36,
        }}
      >
        เลือกเข้าระบบ
      </Button>
    ),
  },
];
