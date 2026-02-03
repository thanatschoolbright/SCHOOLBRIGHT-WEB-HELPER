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
import React from "react";
import type { SchoolDetail } from "../types/bypass.types";
import { compareValues } from "./bypass.helpers";

const { Text } = Typography;

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
  let calculatedHash = 0;
  for (
    let characterIndex = 0;
    characterIndex < name.length;
    characterIndex++
  ) {
    calculatedHash = name.charCodeAt(characterIndex) + ((calculatedHash << 5) - calculatedHash);
  }
  return colors[Math.abs(calculatedHash) % colors.length];
};

const addAlphaToHex = (hexColor: string, alphaValue: number) => {
  if (!hexColor) return "rgba(0,0,0,0)";
  if (hexColor.startsWith("#")) {
    let hex = hexColor.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    const red = parseInt(hex.substring(0, 2), 16);
    const green = parseInt(hex.substring(2, 4), 16);
    const blue = parseInt(hex.substring(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alphaValue})`;
  }
  return hexColor;
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
  onOpenBypassModal: (record: SchoolDetail) => void,
): ColumnsType<SchoolDetail> => [
  {
    title: "#",
    key: "index",
    width: 60,
    align: "center",
    fixed: "left",
    render: (_value, _record, index) => (
      <Typography.Text strong style={{ opacity: 0.3, fontSize: 12 }}>
        {(index + 1).toString().padStart(2, "0")}
      </Typography.Text>
    ),
  },
  {
    title: "CODE",
    dataIndex: "school_id",
    key: "school_id",
    width: 100,
    sorter: (firstSchool, secondSchool) =>
      compareValues(firstSchool.school_id, secondSchool.school_id),
    render: (value) => (
      <Text
        code
        style={{
          borderRadius: 4,
          fontWeight: 600,
          fontSize: 11,
          opacity: 0.8,
        }}
      >
        {value ?? "-"}
      </Text>
    ),
  },
  {
    title: "INSTITUTION NAME",
    key: "company_name",
    width: 400,
    fixed: "left",
    sorter: (firstSchool, secondSchool) =>
      compareValues(firstSchool.company_name, secondSchool.company_name),
    render: (_value, record) => (
      <Flex align="center" gap={12}>
        <Avatar
          size={40}
          style={{
            background: getAvatarColor(record.company_name || ""),
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 12,
            flexShrink: 0,
          }}
        >
          {record.company_name?.charAt(0)}
        </Avatar>
        <Flex vertical gap={0}>
          <Typography.Text strong style={{ fontSize: 15, lineHeight: 1.2 }}>
            {record.company_name || "-"}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {record.school_group || "General"}
          </Typography.Text>
        </Flex>
      </Flex>
    ),
  },
  {
    title: "PROVINCE",
    dataIndex: "province",
    key: "province",
    width: 140,
    sorter: (firstSchool, secondSchool) =>
      compareValues(firstSchool.province, secondSchool.province),
    render: (value) => <Text style={{ fontSize: 13 }}>{value || "-"}</Text>,
  },
  {
    title: "TYPE",
    dataIndex: "school_type",
    key: "school_type",
    width: 130,
    sorter: (firstSchool, secondSchool) =>
      compareValues(firstSchool.school_type, secondSchool.school_type),
    render: (value) => {
      if (!value) return "-";
      const isSoftware = value === "Software";
      const color = isSoftware ? "success" : "processing";
      return (
        <Tag
          bordered={false}
          color={color}
          style={{ borderRadius: 6, fontWeight: 600 }}
        >
          {value}
        </Tag>
      );
    },
  },
  {
    title: "STUDENTS",
    dataIndex: "student_count",
    key: "student_count",
    width: 120,
    align: "right",
    sorter: (firstSchool, secondSchool) => {
      const parseValue = (valueToParse: unknown): number => {
        const numericValue =
          typeof valueToParse === "string"
            ? Number(valueToParse.replace(/[^0-9.-]/g, ""))
            : Number(valueToParse);
        return Number.isFinite(numericValue) ? numericValue : 0;
      };
      return (
        parseValue(firstSchool.student_count) -
        parseValue(secondSchool.student_count)
      );
    },
    render: (value) => {
      const numericValue =
        typeof value === "string"
          ? Number(value.replace(/[^0-9.-]/g, ""))
          : Number(value);
      const safeNumericValue = Number.isFinite(numericValue) ? numericValue : 0;
      return (
        <Text strong style={{ fontSize: 13 }}>
          {safeNumericValue.toLocaleString()}
        </Text>
      );
    },
  },
  {
    title: "RANK / GRADE",
    dataIndex: "school_grade",
    key: "school_grade",
    width: 140,
    align: "center",
    sorter: (firstSchool, secondSchool) =>
      compareValues(firstSchool.school_grade, secondSchool.school_grade),
    render: (value) => {
      const normalizedValue = (value ?? "-").trim().toUpperCase();
      const gradeConfiguration =
        GRADE_CONFIG[normalizedValue] ?? GRADE_CONFIG["-"];
      return (
        <Tag
          bordered={false}
          icon={gradeConfiguration.icon}
          style={{
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 12,
            background: addAlphaToHex(gradeConfiguration.color, 0.12),
            color: gradeConfiguration.color,
            padding: "4px 12px",
            minWidth: 60,
          }}
        >
          {normalizedValue}
        </Tag>
      );
    },
  },
  {
    title: "STATUS",
    dataIndex: "isActive",
    key: "isActive",
    width: 120,
    align: "center",
    sorter: (firstSchool, secondSchool) =>
      compareValues(firstSchool.isActive, secondSchool.isActive),
    render: (value) => {
      if (!value) return <Tag>-</Tag>;
      const lowerValue = value.toLowerCase();
      const isActiveStatus = lowerValue === "active";
      const statusColor = isActiveStatus ? "#52c41a" : "#ff4d4f";
      const statusIcon = isActiveStatus ? (
        <CheckCircleOutlined />
      ) : (
        <CloseCircleOutlined />
      );
      const statusLabel = isActiveStatus ? "ACTIVE" : "INACTIVE";
      return (
        <Tag
          bordered={false}
          icon={statusIcon}
          style={{
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 10,
            background: addAlphaToHex(statusColor, 0.1),
            color: statusColor,
            padding: "2px 8px",
          }}
        >
          {statusLabel}
        </Tag>
      );
    },
  },
];
  {
    title: "ACTIONS",
    key: "actions",
    fixed: "right",
    width: 180,
    align: "center",
    render: (_value, record) => (
      <Button
        type="primary"
        icon={<LoginOutlined />}
        iconPosition="end"
        shape="round"
        onClick={() => onOpenBypassModal(record)}
        style={{
          fontWeight: 700,
          background: "linear-gradient(135deg, #1677ff 0%, #003eb3 100%)",
          border: "none",
          height: 38,
          boxShadow: "0 4px 12px rgba(22, 119, 255, 0.25)",
        }}
      >
        ACCESS SYSTEM
      </Button>
    ),
  },
];
