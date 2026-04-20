import React from "react";
import { Card, Table, Tag, Space, Button, Tooltip, Typography, theme, Flex } from "antd";
import { 
  UnorderedListOutlined, 
  EditOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  MailOutlined,
  DiscordOutlined
} from "@ant-design/icons";
import { ServerStatus, useServerStatusStore } from "../_state/server-status.state";

interface ServerTableProps {
  data: ServerStatus[];
  onViewDetails: (server: ServerStatus) => void;
  onEditDescription: (server: ServerStatus) => void;
}

/**
 * ตารางแสดงรายการเซิร์ฟเวอร์ (Server Table)
 * ออกแบบตามมาตรฐาน Modular UI พร้อมปุ่มดำเนินการทางด้านขวาบน
 */
const ServerTable: React.FC<ServerTableProps> = ({ data, onViewDetails, onEditDescription }) => {
  const { token } = theme.useToken();
  const { isLoading, isSendingEmail, isNotifyingDiscord, sendEmailReport, notifyDiscord } = useServerStatusStore();

  const columns = [
    {
      title: "ชื่อเซิร์ฟเวอร์ / ระบบ",
      key: "name",
      render: (_: any, record: ServerStatus) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong style={{ fontWeight: 600 }}>
            {record.server_name_th || record.server_name || "-"}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
            {record.endpoint || "-"}
          </Typography.Text>
        </Space>
      ),
      sorter: (a: ServerStatus, b: ServerStatus) =>
        (a.server_name_th || a.server_name || "").localeCompare(
          b.server_name_th || b.server_name || ""
        ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 150,
      render: (_: any, record: ServerStatus) => {
        const isOnline = record.status === "Online";
        return (
          <Tag
            color={isOnline ? "success" : "error"}
            icon={isOnline ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            style={{ borderRadius: 12, padding: "2px 10px" }}
          >
            {isOnline ? "ทำงานปกติ" : "หยุดทำงาน"}
          </Tag>
        );
      },
      sorter: (a: ServerStatus, b: ServerStatus) => a.status.localeCompare(b.status),
    },
    {
      title: "ความเร็วตอบสนอง",
      dataIndex: "response_time",
      key: "response_time",
      width: 180,
      render: (time: number) => {
        const color = time < 1 ? "success" : time < 2 ? "warning" : "error";
        return (
          <Tag color={color} icon={<ClockCircleOutlined />}>
            {time.toFixed(3)} ms
          </Tag>
        );
      },
      sorter: (a: ServerStatus, b: ServerStatus) => (a.response_time || 0) - (b.response_time || 0),
    },
    {
      title: "ตรวจสอบล่าสุด",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 200,
      sorter: (a: ServerStatus, b: ServerStatus) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "จัดการ",
      key: "actions",
      align: "right" as const,
      width: 150,
      render: (_: any, record: ServerStatus) => (
        <Space>
          <Tooltip title="แก้ไขหมายเหตุ">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEditDescription(record)}
            />
          </Tooltip>
          <Button
            size="small"
            type="primary"
            ghost
            icon={<EyeOutlined />}
            onClick={() => onViewDetails(record)}
          >
            ดูข้อมูลลึก
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
      title={
        <Space>
          <UnorderedListOutlined style={{ color: token.colorPrimary, fontSize: "1rem" }} />
          <Typography.Text style={{ fontSize: "1rem", fontWeight: 600 }}>
            รายการเซิร์ฟเวอร์
          </Typography.Text>
        </Space>
      }
      extra={
        <Flex gap="middle" wrap="wrap">
          <Button
            type="primary"
            icon={<MailOutlined />}
            onClick={sendEmailReport}
            loading={isSendingEmail}
            style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}
          >
            ส่งรายงานทาง Email
          </Button>
          <Button
            type="primary"
            style={{ backgroundColor: "#5865F2", borderColor: "#5865F2" }}
            icon={<DiscordOutlined />}
            onClick={notifyDiscord}
            loading={isNotifyingDiscord}
          >
            แจ้งเตือนผ่าน Discord
          </Button>
        </Flex>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={isLoading}
        rowKey={(record) => `${record.server_name_th}-${record.timestamp}`}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />
    </Card>
  );
};

export default ServerTable;
