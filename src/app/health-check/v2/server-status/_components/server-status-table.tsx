"use client";

import {
  ApiOutlined,
  BellOutlined,
  BugOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CloudServerOutlined,
  DiscordOutlined,
  EyeOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  ScanOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Flex,
  Space,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useMemo } from "react";
import { toast } from "sonner";
import { ServerStatusData } from "../_services/server-status-service";
import { useServerStatusStore } from "../_state/server-status-store";

const { Text } = Typography;

/**
 * คอมโพเนนต์แสดงตารางข้อมูลสถานะเซิร์ฟเวอร์
 */
const ServerStatusTable: React.FC<{
  onDetailClick: (item: ServerStatusData) => void;
  onExportClick: () => void;
}> = ({ onDetailClick, onExportClick }) => {
  const { token } = theme.useToken();
  const {
    serverHealthData,
    searchQuery,
    statusFilter,
    groupFilter,
    methodFilter,
    isFetchingStatus,
    fetchServerStatus,
    isSendingDiscord,
  } = useServerStatusStore();

  /**
   * กรองข้อมูลตาม State ใน Store
   */
  const filteredData = useMemo(() => {
    return serverHealthData.filter((item) => {
      const lowerSearch = searchQuery.toLowerCase();
      const matchesSearch =
        item.name_th.toLowerCase().includes(lowerSearch) ||
        item.service.toLowerCase().includes(lowerSearch) ||
        item.module.toLowerCase().includes(lowerSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ONLINE" && ["200", "404"].includes(item.status)) ||
        (statusFilter === "ERROR" && !["200", "404"].includes(item.status));

      const matchesGroup = groupFilter === "ALL" || item.group === groupFilter;
      const matchesMethod =
        methodFilter === "ALL" ||
        (item.request?.method || "GET") === methodFilter;

      return matchesSearch && matchesStatus && matchesGroup && matchesMethod;
    });
  }, [serverHealthData, searchQuery, statusFilter, groupFilter, methodFilter]);

  /**
   * ฟังก์ชันดึง Icon ตาม Module
   */
  const getModuleIcon = (moduleName: string) => {
    const iconStyle = { fontSize: 20 };
    if (moduleName.includes("login")) return <UserOutlined style={iconStyle} />;
    if (moduleName.includes("notification"))
      return <BellOutlined style={iconStyle} />;
    if (moduleName.includes("scan")) return <ScanOutlined style={iconStyle} />;
    if (moduleName.includes("school"))
      return <CloudServerOutlined style={iconStyle} />;
    if (moduleName.includes("verification"))
      return <BugOutlined style={iconStyle} />;
    if (moduleName.includes("server")) return <ApiOutlined style={iconStyle} />;
    return <ApiOutlined style={iconStyle} />;
  };

  const columns: ColumnsType<ServerStatusData> = [
    {
      title: "กลุ่มระบบ",
      dataIndex: "group",
      width: 150,
      sorter: (a, b) => (a.group || "").localeCompare(b.group || ""),
      render: (group) => (
        <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600 }}>
          {group?.toUpperCase() || "OTHER"}
        </Tag>
      ),
    },
    {
      title: "ชื่อระบบ (System Module)",
      key: "name",
      sorter: (a, b) => (a.name_th || "").localeCompare(b.name_th || ""),
      render: (_, record) => {
        const isOnline = ["200", "404"].includes(record.status);
        return (
          <Space>
            <Avatar
              icon={getModuleIcon(record.module)}
              style={{
                backgroundColor: isOnline ? "#e6f7ff" : "#fff1f0",
                color: isOnline ? "#1890ff" : "#ff4d4f",
                borderRadius: "10px",
              }}
            />
            <Flex vertical>
              <Text strong style={{ fontSize: "14px", fontWeight: 600 }}>
                {record.name_th}
              </Text>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {record.module.toUpperCase()}
              </Text>
            </Flex>
          </Space>
        );
      },
    },
    {
      title: "จุดเชื่อมต่อ (Endpoint)",
      dataIndex: "service",
      sorter: (a, b) => (a.service || "").localeCompare(b.service || ""),
      render: (serviceName, record) => {
        const method = record.request?.method || "GET";
        const methodColor = method === "POST" ? "#ff4d4f" : "#52c41a";
        return (
          <Flex align="center" gap={8}>
            <Tag
              color={method === "POST" ? "red-inverse" : "green-inverse"}
              style={{
                borderRadius: 4,
                fontSize: "10px",
                minWidth: 45,
                textAlign: "center",
              }}
            >
              {method}
            </Tag>
            <Text
              code
              style={{
                fontSize: "12px",
                maxWidth: "250px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              onClick={() => {
                navigator.clipboard.writeText(serviceName);
                toast.success("คัดลอก Endpoint เรียบร้อย");
              }}
            >
              {serviceName}
            </Text>
          </Flex>
        );
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 140,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (statusCode) => {
        const isSuccess = ["200", "404"].includes(statusCode);
        return (
          <Tag
            icon={isSuccess ? <CheckCircleFilled /> : <CloseCircleFilled />}
            color={isSuccess ? "success" : "error"}
            style={{ borderRadius: 20, padding: "2px 12px", fontWeight: 600 }}
          >
            {isSuccess ? "ONLINE" : `ERROR ${statusCode}`}
          </Tag>
        );
      },
    },
    {
      title: "จัดการ",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => onDetailClick(record)}
          style={{ borderRadius: 8 }}
        >
          รายละเอียด
        </Button>
      ),
    },
  ];

  return (
    <Card
      variant="outlined"
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Space align="center">
          <UnorderedListOutlined style={{ fontSize: "1rem" }} />
          <Text strong style={{ fontSize: "1rem" }}>
            รายการประเมินสถานะระบบ (Active Monitoring)
          </Text>
        </Space>

        <Space gap={10}>
          <Button
            icon={<DiscordOutlined />}
            onClick={() => fetchServerStatus("discord")}
            loading={isSendingDiscord}
            style={{ borderRadius: 8, height: 36 }}
          >
            ส่ง Discord
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={onExportClick}
            style={{ borderRadius: 8, height: 36 }}
          >
            ดาวน์โหลด Excel
          </Button>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => fetchServerStatus("normal")}
            loading={isFetchingStatus}
            style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
          >
            รีเฟรชข้อมูล
          </Button>
        </Space>
      </Flex>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey={(record) => `${record.module}-${record.service}`}
        loading={isFetchingStatus}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          style: { marginTop: 20 },
        }}
        locale={{ emptyText: "ไม่พบข้อมูลสถานะระบบในขณะนี้" }}
        scroll={{ x: "max-content" }}
      />
    </Card>
  );
};

export default ServerStatusTable;
