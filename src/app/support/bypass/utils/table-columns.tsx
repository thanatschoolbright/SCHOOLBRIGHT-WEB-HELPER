import React from "react";
import { Badge, Tag, Button, Dropdown } from "antd";
import {
  LoginOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  StarOutlined,
  RocketOutlined,
  ToolOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { TFunction } from "i18next";
import type { SchoolDetail } from "../types/bypass.types";
import { compareValues } from "./bypass.helpers";
import { buildBypassMenuItems } from "./bypass-targets";

const STATUS_COLOR_MAP: Record<string, string> = {
  active: "success",
  inactive: "error",
};

const GRADE_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  A: { color: "gold", icon: <CrownOutlined /> },
  B: { color: "green", icon: <StarOutlined /> },
  C: { color: "blue", icon: <RocketOutlined /> },
  D: { color: "orange", icon: <ToolOutlined /> },
  E: { color: "red", icon: <AlertOutlined /> },
  F: { color: "purple", icon: <ThunderboltOutlined /> },
  "-": { color: "default", icon: <SafetyCertificateOutlined /> },
};

export const buildTableColumns = (
  TRANSLATION: TFunction,
  openDropdownFor: string | null,
  onBypassClick: (compositeKey: string, record: SchoolDetail) => Promise<void>,
  onDropdownOpenChange: (open: boolean, schoolId: string) => void
): ColumnsType<SchoolDetail> => [
  {
    title: TRANSLATION("bypass_page.col_index"),
    key: "index",
    width: 80,
    align: "center",
    fixed: "left",
    render: (_value, _record, index) => (
      <Badge count={index + 1} showZero color="blue" />
    ),
  },
  {
    title: TRANSLATION("bypass_page.col_school_id"),
    dataIndex: "school_id",
    key: "school_id",
    width: 140,
    sorter: (a, b) => compareValues(a.school_id, b.school_id),
    render: (value) => (
      <Tag color="blue" style={{ fontFamily: "monospace" }}>
        {value ?? "-"}
      </Tag>
    ),
  },
  {
    title: TRANSLATION("bypass_page.col_school_name"),
    dataIndex: "company_name",
    key: "company_name",
    width: 300,
    sorter: (a, b) => compareValues(a.company_name, b.company_name),
    render: (value) => <span style={{ fontWeight: 500 }}>{value || "-"}</span>,
  },
  {
    title: TRANSLATION("bypass_page.col_province"),
    dataIndex: "province",
    key: "province",
    width: 150,
    sorter: (a, b) => compareValues(a.province, b.province),
    render: (value) => value || "-",
  },
  {
    title: TRANSLATION("bypass_page.col_school_type"),
    dataIndex: "school_type",
    key: "school_type",
    width: 150,
    sorter: (a, b) => compareValues(a.school_type, b.school_type),
    render: (value) => {
      if (!value) return "-";
      const color = value === "Software" ? "green" : "blue";
      return <Tag color={color}>{value}</Tag>;
    },
  },
  {
    title: TRANSLATION("bypass_page.col_student_count"),
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
    title: TRANSLATION("bypass_page.col_school_group"),
    dataIndex: "school_group",
    key: "school_group",
    width: 180,
    sorter: (a, b) => compareValues(a.school_group, b.school_group),
    render: (value) => value || "-",
  },
  {
    title: TRANSLATION("bypass_page.col_grade"),
    dataIndex: "school_grade",
    key: "school_grade",
    width: 100,
    align: "center",
    sorter: (a, b) => compareValues(a.school_grade, b.school_grade),
    render: (value) => {
      const normalized = (value ?? "-").trim().toUpperCase();
      const config = GRADE_CONFIG[normalized] ?? GRADE_CONFIG["-"];
      return (
        <Tag color={config.color} icon={config.icon}>
          {normalized}
        </Tag>
      );
    },
  },
  {
    title: TRANSLATION("bypass_page.col_status"),
    dataIndex: "isActive",
    key: "isActive",
    width: 120,
    align: "center",
    sorter: (a, b) => compareValues(a.isActive, b.isActive),
    render: (value) => {
      if (!value) return <Tag>-</Tag>;
      const color = STATUS_COLOR_MAP[value.toLowerCase()] ?? "default";
      const icon =
        value.toLowerCase() === "active" ? (
          <CheckCircleOutlined />
        ) : (
          <CloseCircleOutlined />
        );
      return (
        <Tag color={color} icon={icon}>
          {value}
        </Tag>
      );
    },
  },
  {
    title: TRANSLATION("bypass_page.col_actions"),
    key: "actions",
    fixed: "right",
    width: 160,
    align: "center",
    render: (_value, record) => {
      const schoolId = String(record.school_id ?? "");
      const isOpen = openDropdownFor === schoolId;

      return (
        <Dropdown
          menu={{
            items: buildBypassMenuItems(),
            onClick: ({ key }) => void onBypassClick(String(key), record),
          }}
          trigger={["click"]}
          placement="bottomRight"
          open={isOpen}
          onOpenChange={(open) => onDropdownOpenChange(open, schoolId)}
        >
          <Button type="primary" icon={<LoginOutlined />} iconPosition="end">
            {TRANSLATION("bypass_page.select_system")}
          </Button>
        </Dropdown>
      );
    },
  },
];
