"use client";

import {
  AndroidOutlined,
  AppleOutlined,
  CodeOutlined,
  EyeOutlined,
  GlobalOutlined,
  WindowsOutlined,
} from "@ant-design/icons";
import { Button, Card, Space, Table, Tag, Typography, theme } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { ApplicationRecord } from "@/types/canteen.type";

interface ApplicationTableProps {
  applicationList: ApplicationRecord[];
  isLoading: boolean;
  onViewVersions: (record: ApplicationRecord) => void;
}

// ✨ แสดง Icon ตามประเภทแพลตฟอร์มของแอปพลิเคชัน
const getPlatformIcon = (platformType: string) => {
  const lowercaseType = platformType?.toLowerCase() ?? "";
  if (lowercaseType.includes("android"))
    return <AndroidOutlined style={{ color: "#3DDC84", fontSize: 18 }} />;
  if (lowercaseType.includes("ios") || lowercaseType.includes("apple"))
    return <AppleOutlined style={{ fontSize: 18 }} />;
  if (lowercaseType.includes("windows"))
    return <WindowsOutlined style={{ color: "#0078D7", fontSize: 18 }} />;
  if (lowercaseType.includes("web"))
    return <GlobalOutlined style={{ color: "#1890ff", fontSize: 18 }} />;
  return <CodeOutlined style={{ fontSize: 18 }} />;
};

// ✨ ตารางแสดงรายการแอปพลิเคชันทั้งหมด
export const ApplicationTable = ({
  applicationList,
  isLoading,
  onViewVersions,
}: ApplicationTableProps) => {
  const { token } = theme.useToken();

  const columns: ColumnsType<ApplicationRecord> = [
    {
      title: "ชื่อแอปพลิเคชัน",
      dataIndex: "app_name",
      sorter: (a, b) => a.app_name.localeCompare(b.app_name),
      render: (applicationName: string, record) => (
        <Space>
          <div
            style={{
              background: token.colorFillSecondary,
              padding: 8,
              borderRadius: 8,
            }}
          >
            {getPlatformIcon(record.app_type)}
          </div>
          <Typography.Text strong>{applicationName}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "App ID",
      dataIndex: "app_id",
      width: 360,
      render: (appId: string) => <Typography.Text code>{appId}</Typography.Text>,
    },
    {
      title: "แพลตฟอร์ม",
      dataIndex: "app_type",
      align: "center",
      sorter: (a, b) => a.app_type.localeCompare(b.app_type),
      render: (platformType: string) => <Tag>{platformType}</Tag>,
    },
    {
      title: "ดำเนินการ",
      align: "center",
      render: (_, record) => (
        <Button icon={<EyeOutlined />} onClick={() => onViewVersions(record)}>
          ดูประวัติเวอร์ชัน
        </Button>
      ),
    },
  ];

  return (
    <Card
      variant="borderless"
      className="shadow-sm"
      style={{ borderRadius: 16 }}
    >
      <Table
        columns={columns}
        dataSource={applicationList}
        loading={isLoading}
        rowKey="app_id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};
