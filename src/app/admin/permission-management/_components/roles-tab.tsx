"use client";

import {
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  Input,
  Progress,
  Row,
  Space,
  Table,
  Tooltip,
  Typography,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import SummaryCard from "@/components/card/summary-card";
import {
  Role,
  usePermissionManagementStore,
} from "../_state/permission-management-store";

const { Text } = Typography;

/**
 * Tab 1: จัดการบทบาท (Roles)
 * แสดง Summary Cards + Search + ตาราง Roles
 */
export const RolesTab = () => {
  const { token } = theme.useToken();
  // สีม่วง: Ant Design ไม่มี token.colorPurple โดยตรง ใช้ค่าคงที่
  const PURPLE = "#722ed1";
  const {
    roles,
    permissions,
    isLoading,
    search,
    setSearch,
    setModalMode,
    setSelectedRole,
    setDeleteModalOpen,
  } = usePermissionManagementStore();

  // คำนวณ Summary Stats
  const totalRoles = roles.length;
  const activeRoles = roles.filter((r) => r.is_active).length;
  const totalPermissions = permissions.length;
  const totalUsers = roles.reduce(
    (acc, r) => acc + (r._count?.users || 0),
    0
  );

  // จำนวน permissions สูงสุด (สำหรับ progress bar)
  const maxPermCount = Math.max(...roles.map((r) => r.permissions.length), 1);

  const columns: ColumnsType<Role> = [
    {
      title: "บทบาท",
      dataIndex: "role_name",
      render: (text, r) => (
        <Space align="center" size={12}>
          {/* Icon กลม */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${token.colorPrimary}20, ${token.colorPrimary}40)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LockOutlined
              style={{ color: token.colorPrimary, fontSize: 16 }}
            />
          </div>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 15, lineHeight: "20px" }}>
              {text}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.description || "ไม่มีคำอธิบาย"}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "สิทธิ์",
      dataIndex: "permissions",
      align: "center",
      width: 200,
      render: (perms: Role["permissions"]) => {
        const count = perms?.length || 0;
        const pct = Math.round((count / maxPermCount) * 100);
        return (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Progress
              percent={pct}
              showInfo={false}
              strokeColor={PURPLE}
              trailColor={token.colorFillTertiary}
              size="small"
            />
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 20,
                  background: `${PURPLE}15`,
                  color: PURPLE,
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1px solid ${PURPLE}30`,
                }}
              >
                {count} สิทธิ์
              </span>
            </div>
          </Space>
        );
      },
    },
    {
      title: "ผู้ใช้งาน",
      dataIndex: ["_count", "users"],
      align: "center",
      width: 120,
      render: (count: number) => (
        <Space direction="vertical" size={2}>
          <UserOutlined
            style={{ color: token.colorInfo, fontSize: 16 }}
          />
          <span
            style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: 20,
              background: `${token.colorInfo}15`,
              color: token.colorInfo,
              fontSize: 12,
              fontWeight: 600,
              border: `1px solid ${token.colorInfo}30`,
            }}
          >
            {count || 0} คน
          </span>
        </Space>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "is_active",
      align: "center",
      width: 130,
      render: (active: boolean) => (
        <Space size={6}>
          {/* Dot animation ถ้า active */}
          {active && (
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: token.colorSuccess,
                animation: "pulse-dot 1.5s ease-in-out infinite",
              }}
            />
          )}
          <Badge
            status={active ? "success" : "error"}
            text={
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: active ? token.colorSuccess : token.colorError,
                }}
              >
                {active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
              </Text>
            }
          />
        </Space>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      width: 120,
      render: (_, r) => (
        <Space>
          <Tooltip title="แก้ไขบทบาท">
            <Button
              type="text"
              icon={
                <EditOutlined style={{ color: token.colorWarning }} />
              }
              style={{
                background: `${token.colorWarning}10`,
                borderRadius: 8,
              }}
              onClick={() => {
                setSelectedRole(r);
                setModalMode("edit");
              }}
            />
          </Tooltip>
          <Tooltip
            title={
              r._count?.users && r._count.users > 0
                ? "ไม่สามารถลบได้ (มีผู้ใช้งาน)"
                : r.role_name === "ADMIN"
                  ? "ไม่สามารถลบ ADMIN ได้"
                  : "ลบบทบาท"
            }
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={
                (r._count?.users != null && r._count.users > 0) ||
                r.role_name === "ADMIN"
              }
              style={{
                background:
                  (r._count?.users != null && r._count.users > 0) ||
                  r.role_name === "ADMIN"
                    ? "transparent"
                    : `${token.colorError}10`,
                borderRadius: 8,
              }}
              onClick={() => {
                setSelectedRole(r);
                setDeleteModalOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* pulse animation style */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>

      {/* Summary Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <SummaryCard
            title="บทบาททั้งหมด"
            value={totalRoles}
            unit="บทบาท"
            icon={<LockOutlined />}
            color={token.colorPrimary}
            isLoading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <SummaryCard
            title="บทบาทที่เปิดใช้"
            value={activeRoles}
            unit="บทบาท"
            icon={<SafetyCertificateOutlined />}
            color={token.colorSuccess}
            isLoading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <SummaryCard
            title="สิทธิ์ทั้งหมด"
            value={totalPermissions}
            unit="สิทธิ์"
            icon={<LockOutlined />}
            color={PURPLE}
            isLoading={isLoading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <SummaryCard
            title="ผู้ใช้งานรวม"
            value={totalUsers}
            unit="คน"
            icon={<TeamOutlined />}
            color={token.colorInfo}
            isLoading={isLoading}
          />
        </Col>
      </Row>

      {/* ตาราง Roles */}
      <Card
        style={{
          borderRadius: 16,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
        styles={{ body: { padding: 24 } }}
      >
        {/* Search + ปุ่มสร้าง */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Input
            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
            placeholder="ค้นหาบทบาท..."
            style={{ width: 300, borderRadius: 8 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ borderRadius: 10 }}
            onClick={() => {
              setSelectedRole(null);
              setModalMode("create");
            }}
          >
            สร้าง Role ใหม่
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={roles}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} บทบาท`,
          }}
          onRow={() => ({
            style: { cursor: "default" },
            onMouseEnter: (e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                token.colorPrimaryBg;
            },
            onMouseLeave: (e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "";
            },
          })}
        />
      </Card>
    </>
  );
};
