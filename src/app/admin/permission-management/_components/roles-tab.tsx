"use client";

import SummaryCard from "@/components/card/summary-card";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Flex,
  Input,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import { useEffect } from "react";
import {
  Role,
  usePermissionManagementStore,
} from "../_state/permission-management-store";
import { RoleFormModal } from "./role-form-modal";

const { Text, Title } = Typography;

/**
 * Tab 1: กลุ่มบทบาท (Roles) - แสดงรายการและจัดการสรุป
 */
export const RolesTab = () => {
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const {
    roles,
    permissions,
    isLoading,
    search,
    setSearch,
    setModalMode,
    setSelectedRole,
    handleDeleteRole,
    fetchData,
  } = usePermissionManagementStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // สรุปข้อมูลสำหรับ Summary Cards
  const totalRoles = roles.length;
  const totalPermissions = permissions.length;
  const adminRolesCount = roles.filter((r) =>
    r.role_name.toLowerCase().includes("admin"),
  ).length;

  const columns = [
    {
      title: "ชื่อบทบาท (Role Name)",
      dataIndex: "role_name",
      key: "role_name",
      render: (text: string, record: Role) => (
        <Space size={12}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${token.colorPrimary}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorPrimary,
            }}
          >
            <TeamOutlined style={{ fontSize: 18 }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 15 }}>
              {text}
            </Text>
            <div style={{ fontSize: 12, color: token.colorTextDescription }}>
              Role ID: {record.id}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "สิทธิ์ที่ได้รับ (Permissions)",
      key: "permissions",
      render: (_: any, record: Role) => {
        const count = record.permissions?.length || 0;
        return (
          <Space size={8}>
            <UnlockOutlined
              style={{
                color:
                  count > 0 ? token.colorSuccess : token.colorTextQuaternary,
              }}
            />
            <Text strong={count > 0} type={count > 0 ? undefined : "secondary"}>
              {count} รายการ
            </Text>
          </Space>
        );
      },
      sorter: (a: Role, b: Role) =>
        (a.permissions?.length || 0) - (b.permissions?.length || 0),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 120,
      render: (_: any, record: Role) => (
        <Tag
          color={
            record.role_name.toLowerCase().includes("admin") ? "gold" : "blue"
          }
          style={{ borderRadius: 6, paddingInline: 10 }}
        >
          {record.role_name.toLowerCase().includes("admin")
            ? "System"
            : "Custom"}
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      width: 150,
      align: "right" as const,
      render: (_: any, record: Role) => (
        <Space size={4}>
          <Tooltip title="แก้ไขสิทธิ์">
            <Button
              type="text"
              icon={<UnlockOutlined />}
              onClick={() => {
                setSelectedRole(record);
                setModalMode("edit");
              }}
              style={{ color: token.colorSuccess }}
            />
          </Tooltip>
          <Tooltip title="แก้ไขข้อมูลพื้นฐาน">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedRole(record);
                setModalMode("edit");
              }}
              style={{ color: token.colorPrimary }}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                setSelectedRole(record);
                handleDeleteRole();
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Space direction="vertical" style={{ width: "100%" }} size={32}>
        {/* Summary Section */}
        <Flex gap={24} wrap="wrap">
          <div style={{ flex: "1 1 300px" }}>
            <SummaryCard
              title="บทบาททั้งหมด"
              value={totalRoles}
              unit="กลุ่ม"
              icon={
                <TeamOutlined
                  style={{
                    fontSize: 24,
                    color: token.colorPrimary,
                    background: `${token.colorPrimary}15`,
                    padding: 12,
                    borderRadius: 14,
                  }}
                />
              }
            />
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <SummaryCard
              title="บทบาทควบคุม (Admin)"
              value={adminRolesCount}
              unit="กลุ่ม"
              icon={
                <UnlockOutlined
                  style={{
                    fontSize: 24,
                    color: token.colorWarning,
                    background: `${token.colorWarning}15`,
                    padding: 12,
                    borderRadius: 14,
                  }}
                />
              }
            />
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <SummaryCard
              title="สิทธิ์ในระบบทั้งหมด"
              value={totalPermissions}
              unit="รายการ"
              icon={
                <UnlockOutlined
                  style={{
                    fontSize: 24,
                    color: token.colorSuccess,
                    background: `${token.colorSuccess}15`,
                    padding: 12,
                    borderRadius: 14,
                  }}
                />
              }
            />
          </div>
        </Flex>

        {/* Table Section */}
        <Card
          style={{
            borderRadius: 20,
            overflow: "hidden",
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          }}
          styles={{ body: { padding: "1rem" } }}
        >
          <Flex
            justify="space-between"
            align="center"
            style={{ padding: "24px 32px" }}
          >
            <Input
              placeholder="ค้นหาชื่อบทบาท..."
              prefix={
                <SearchOutlined style={{ color: token.colorTextQuaternary }} />
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 340, borderRadius: 12, height: 44 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedRole(null);
                setModalMode("create");
              }}
              style={{
                height: 44,
                borderRadius: 12,
                fontWeight: 700,
                paddingInline: 24,
                boxShadow: `0 4px 12px ${token.colorPrimary}30`,
              }}
            >
              เพิ่มกลุ่มบทบาทใหม่
            </Button>
          </Flex>

          <Table
            columns={columns}
            dataSource={roles.filter((r) =>
              r.role_name.toLowerCase().includes(search.toLowerCase()),
            )}
            loading={isLoading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            scroll={{ x: 1000 }}
            style={{ borderRadius: 0 }}
          />
        </Card>
      </Space>

      <RoleFormModal />

      <style jsx global>{`
        @keyframes pulse-dot {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.4);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
