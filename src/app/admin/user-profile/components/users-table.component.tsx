"use client";

import React from "react";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  IdcardOutlined,
  FileTextOutlined, // เพิ่ม Icon สำหรับการ Copy ข้อมูลทั้งหมด
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
  Flex,
  Badge,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { toast } from "sonner";
import { UserProfile } from "../types/user-profile.types";

const { Text } = Typography;

interface UsersTableProps {
  data: UserProfile[];
  loading: boolean;
  pageSize: number;
  titles: {
    index: string;
    email: string;
    fullname: string;
    nickname: string;
    position: string;
    phone: string;
    actions: string;
    employeeCode: string;
    empty: string;
    edit: string;
    delete: string;
    copy: string;
  };
  onPageSizeChange: (size: number) => void;
  onEdit: (user: UserProfile) => void;
  onDelete: (id: number) => void;
  onCopy: (user: UserProfile) => void;
}

export const UsersTable = ({
  data,
  loading,
  pageSize,
  titles,
  onPageSizeChange,
  onEdit,
  onDelete,
  onCopy, // เรียกใช้งานจาก Props
}: UsersTableProps) => {
  const { token } = theme.useToken();

  // ฟังก์ชันช่วยคัดลอกเฉพาะข้อความ (ชื่อ หรือ อีเมล)
  const handleDirectCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก ${label} เรียบร้อยแล้ว`);
  };

  const columns: ColumnsType<UserProfile> = [
    {
      title: titles.index,
      key: "index",
      align: "center",
      width: 70,
      fixed: "left",
      render: (_v, _r, idx) => <Text type="secondary">{idx + 1}</Text>,
    },
    {
      title: titles.fullname,
      dataIndex: "fullname",
      fixed: "left",
      width: 250,
      render: (_value, record) => (
        <Space size="middle">
          <Badge
            dot
            status={record.status === "ACTIVE" ? "success" : "default"}
            offset={[-4, 32]}
          >
            <Avatar
              src={record.image_profile}
              style={{
                backgroundColor: token.colorPrimaryBg,
                color: token.colorPrimary,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
              icon={<UserOutlined />}
            >
              {record.firstname?.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
          <Flex vertical gap={0}>
            <Space size={4}>
              <Text strong className="text-sm">
                {record.firstname} {record.lastname}
              </Text>
              <Tooltip title="คัดลอกชื่อ-สกุล">
                <Button
                  type="text"
                  size="small"
                  icon={
                    <CopyOutlined
                      style={{ fontSize: 11, color: token.colorTextQuaternary }}
                    />
                  }
                  onClick={() =>
                    handleDirectCopy(
                      `${record.firstname} ${record.lastname}`,
                      "ชื่อ-สกุล"
                    )
                  }
                  className="!flex !items-center !justify-center"
                />
              </Tooltip>
            </Space>
            <Text type="secondary" className="text-[11px]">
              {titles.nickname}: {record.nickname || "-"}
            </Text>
          </Flex>
        </Space>
      ),
      sorter: (a, b) =>
        `${a.firstname} ${a.lastname}`.localeCompare(
          `${b.firstname} ${b.lastname}`
        ),
    },
    {
      title: "ข้อมูลติดต่อ",
      key: "contact",
      width: 280,
      render: (_value, record) => (
        <Flex vertical gap={4}>
          <Space size={8}>
            <MailOutlined
              style={{ color: token.colorTextTertiary, fontSize: 12 }}
            />
            <Text className="text-xs">{record.email}</Text>
            <Tooltip title="คัดลอกอีเมล">
              <Button
                type="text"
                size="small"
                className="!p-0 !h-auto"
                icon={
                  <CopyOutlined
                    style={{ fontSize: 10, color: token.colorPrimary }}
                  />
                }
                onClick={() => handleDirectCopy(record.email || "", "อีเมล")}
              />
            </Tooltip>
          </Space>
          <Space size={8}>
            <PhoneOutlined
              style={{ color: token.colorTextTertiary, fontSize: 12 }}
            />
            <Text type="secondary" className="text-xs">
              {record.tel || "-"}
            </Text>
          </Space>
        </Flex>
      ),
    },
    {
      title: titles.position,
      dataIndex: "position",
      width: 150,
      render: (value: string) => (
        <Tag
          bordered={false}
          style={{
            backgroundColor: token.colorPrimaryBg,
            color: token.colorPrimary,
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          {value || "-"}
        </Tag>
      ),
      sorter: (a, b) => (a.position ?? "").localeCompare(b.position ?? ""),
    },
    {
      title: titles.employeeCode,
      dataIndex: "employee_code",
      width: 140,
      render: (value: string) => (
        <Space size={4}>
          <IdcardOutlined style={{ color: token.colorTextQuaternary }} />
          <Text code className="text-[12px]">
            {value || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: titles.actions,
      key: "actions",
      align: "center",
      width: 160, // ขยายความกว้างเพื่อรองรับ 3 ปุ่ม
      fixed: "right",
      render: (_value, record) => (
        <Space size="small">
          <Tooltip title={titles.copy}>
            <Button
              type="text"
              shape="circle"
              icon={<FileTextOutlined style={{ color: token.colorInfo }} />}
              onClick={() => onCopy(record)}
            />
          </Tooltip>
          <Tooltip title={titles.edit}>
            <Button
              type="text"
              shape="circle"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title={titles.delete}>
            <Button
              type="text"
              shape="circle"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
      }}
    >
      <Table<UserProfile>
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey={(record) =>
          record.id || record.email || Math.random().toString()
        }
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          onShowSizeChange: (_current, size) => onPageSizeChange(size),
          position: ["bottomRight"],
          className: "pr-4 pb-4",
        }}
        locale={{ emptyText: titles.empty }}
        scroll={{ x: 1100 }}
        style={{ borderRadius: token.borderRadiusLG }}
      />
    </div>
  );
};
