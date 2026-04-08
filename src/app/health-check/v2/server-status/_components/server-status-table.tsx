"use client";

import {
  ApiOutlined,
  BellOutlined,
  BugOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CloudServerOutlined,
  CopyOutlined,
  EyeOutlined,
  FileExcelOutlined,
  IdcardOutlined,
  LoginOutlined,
  ReloadOutlined,
  ScanOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Empty,
  Flex,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useMemo } from "react";
import { toast } from "sonner";
import { ServerStatusData } from "../_services/server-status-service";
import { useServerStatusStore } from "../_state/server-status-store";

const { Text } = Typography;

// ── Module meta: icon + color per group ───────────────────────────────────
const MODULE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  "login-system": { icon: <LoginOutlined />, color: "#6366f1" },
  "user-system": { icon: <IdcardOutlined />, color: "#0ea5e9" },
  "notification-system": { icon: <BellOutlined />, color: "#f59e0b" },
  "attendance-system": { icon: <ScanOutlined />, color: "#10b981" },
  "leave-system": { icon: <BugOutlined />, color: "#ef4444" },
  "school-system": { icon: <CloudServerOutlined />, color: "#8b5cf6" },
  "server-system": { icon: <CloudServerOutlined />, color: "#64748b" },
};

const getModuleMeta = (group: string) =>
  MODULE_META[group] ?? { icon: <ApiOutlined />, color: "#64748b" };

// ── HTTP Method badge ─────────────────────────────────────────────────────
const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const { token } = theme.useToken();
  const isPost = method === "POST";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        padding: "2px 7px",
        borderRadius: 4,
        background: isPost ? token.colorErrorBg : token.colorSuccessBg,
        color: isPost ? token.colorError : token.colorSuccess,
        border: `1px solid ${isPost ? token.colorErrorBorder : token.colorSuccessBorder}`,
        whiteSpace: "nowrap",
      }}
    >
      {method}
    </span>
  );
};

// ── Status indicator ──────────────────────────────────────────────────────
const StatusCell: React.FC<{ code: string }> = ({ code }) => {
  const isOk = ["200", "404"].includes(code);
  return (
    <Flex align="center" gap={8}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: isOk ? "#22c55e" : "#ef4444",
          flexShrink: 0,
          boxShadow: isOk ? "0 0 0 3px #bbf7d0" : "0 0 0 3px #fecaca",
        }}
      />
      <Tag
        icon={isOk ? <CheckCircleFilled /> : <CloseCircleFilled />}
        color={isOk ? "success" : "error"}
        style={{
          borderRadius: 20,
          paddingInline: 10,
          fontWeight: 600,
          margin: 0,
        }}
      >
        {isOk ? "ONLINE" : `ERROR · ${code}`}
      </Tag>
    </Flex>
  );
};

// ── Main component ────────────────────────────────────────────────────────
const ServerStatusTable: React.FC = () => {
  const { token } = theme.useToken();
  const {
    serverHealthData,
    searchQuery,
    statusFilter,
    groupFilter,
    methodFilter,
    isFetchingStatus,
    fetchServerStatus,
    openDetailModal,
    openExportModal,
  } = useServerStatusStore();

  // คำนวณ filtered data
  const filteredData = useMemo(() => {
    return serverHealthData.filter((item) => {
      // 1. Search filter (Null-safe)
      const q = (searchQuery || "").toLowerCase();
      const nTh = (item.name_th || "").toLowerCase();
      const nEn = (item.name_en || "").toLowerCase();
      const serv = (item.service || "").toLowerCase();
      const mod = (item.module || "").toLowerCase();
      const ep = (item.request?.url || "").toLowerCase();

      const matchSearch =
        nTh.includes(q) ||
        nEn.includes(q) ||
        serv.includes(q) ||
        mod.includes(q) ||
        ep.includes(q);

      // 2. Status filter
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ONLINE" && ["200", "404"].includes(item.status)) ||
        (statusFilter === "ERROR" && !["200", "404"].includes(item.status));

      // 3. Group filter (Handle null group from API)
      const gF = (groupFilter || "ALL").toUpperCase();
      const itemG = (item.group || "other").toUpperCase();
      const matchGroup = gF === "ALL" || itemG === gF;

      // 4. Method filter (Handle null request from API)
      const mF = (methodFilter || "ALL").toUpperCase();
      const itemM = (item.request?.method || "GET").toUpperCase();
      const matchMethod = mF === "ALL" || itemM === mF;

      return matchSearch && matchStatus && matchGroup && matchMethod;
    });
  }, [serverHealthData, searchQuery, statusFilter, groupFilter, methodFilter]);

  // สถิติสรุปด้านบน
  const stats = useMemo(() => {
    const total = filteredData.length;
    const online = filteredData.filter((r) =>
      ["200", "404"].includes(r.status),
    ).length;
    return { total, online, error: total - online };
  }, [filteredData]);

  const columns: ColumnsType<ServerStatusData> = [
    {
      title: "กลุ่มระบบ",
      dataIndex: "group",
      width: 160,
      sorter: (a, b) => (a.group || "").localeCompare(b.group || ""),
      render: (group: string) => {
        const meta = getModuleMeta(group);
        return (
          <Flex align="center" gap={8}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: `${meta.color}1a`,
                color: meta.color,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {meta.icon}
            </span>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: meta.color,
                textTransform: "uppercase",
              }}
            >
              {(group || "other").replace(/-/g, " ")}
            </Text>
          </Flex>
        );
      },
    },
    {
      title: "ชื่อระบบ",
      key: "name",
      sorter: (a, b) => (a.name_th || "").localeCompare(b.name_th || ""),
      render: (_, record) => {
        const isOnline = ["200", "404"].includes(record.status);
        return (
          <Flex vertical gap={2}>
            <Text strong style={{ fontSize: 13, fontWeight: 600 }}>
              {record.name_th}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: isOnline ? token.colorTextDescription : token.colorError,
              }}
            >
              {record.name_en}
            </Text>
          </Flex>
        );
      },
    },
    {
      title: "Endpoint",
      key: "endpoint",
      sorter: (a, b) =>
        (a.request?.url ?? a.service).localeCompare(
          b.request?.url ?? b.service,
        ),
      render: (_: unknown, record) => {
        const method = record.request?.method || "GET";
        const endpointUrl = record.request?.url ?? record.service;
        return (
          <Flex align="center" gap={8}>
            <MethodBadge method={method} />
            <Tooltip title={endpointUrl}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: token.colorPrimary,
                  cursor: "pointer",
                  maxWidth: 300,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "block",
                }}
                onClick={() => {
                  navigator.clipboard.writeText(endpointUrl);
                  toast.success("คัดลอก Endpoint เรียบร้อย");
                }}
              >
                {endpointUrl}
              </Text>
            </Tooltip>
            <Tooltip title="คัดลอก">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined style={{ fontSize: 11 }} />}
                style={{
                  padding: "0 4px",
                  height: 20,
                  color: token.colorTextDescription,
                }}
                onClick={() => {
                  navigator.clipboard.writeText(endpointUrl);
                  toast.success("คัดลอก Endpoint เรียบร้อย");
                }}
              />
            </Tooltip>
          </Flex>
        );
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 170,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (code: string) => <StatusCell code={code} />,
    },
    {
      title: "ตรวจสอบ",
      key: "action",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Tooltip title="ดูรายละเอียดทางเทคนิค">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetailModal(record)}
            style={{ borderRadius: 20, fontWeight: 600, fontSize: 12 }}
          >
            Debug
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      variant="outlined"
      styles={{ body: { padding: 0 } }}
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorderSecondary}`,
        overflow: "hidden",
      }}
    >
      {/* Card Header */}
      <Flex
        justify="space-between"
        align="center"
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Flex align="center" gap={12}>
          <UnorderedListOutlined
            style={{ fontSize: "1rem", color: token.colorPrimary }}
          />
          <Text strong style={{ fontSize: "1rem", fontWeight: 600 }}>
            รายการประเมินสถานะระบบ
          </Text>
          {/* Live stats pills */}
          <Flex gap={6}>
            <Badge
              count={stats.online}
              style={{
                backgroundColor: "#22c55e",
                fontSize: 11,
                fontWeight: 700,
                boxShadow: "none",
              }}
              overflowCount={999}
            />
            {stats.error > 0 && (
              <Badge
                count={stats.error}
                style={{
                  backgroundColor: "#ef4444",
                  fontSize: 11,
                  fontWeight: 700,
                  boxShadow: "none",
                }}
                overflowCount={999}
              />
            )}
          </Flex>
        </Flex>

        <Space size={8}>
          <Tooltip title="ส่งรายงานสถานะเข้า Discord ทันที"></Tooltip>
          <Tooltip title="ส่งออกรายงาน Excel">
            <Button
              icon={<FileExcelOutlined />}
              onClick={openExportModal}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Excel
            </Button>
          </Tooltip>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => fetchServerStatus("normal")}
            loading={isFetchingStatus}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            รีเฟรช
          </Button>
        </Space>
      </Flex>

      {/* Status summary bar */}
      {!isFetchingStatus && stats.total > 0 && (
        <Flex
          style={{
            padding: "10px 20px",
            background: stats.error > 0
              ? token.colorErrorBg
              : token.colorSuccessBg,
            borderBottom: `1px solid ${
              stats.error > 0 ? token.colorErrorBorder : token.colorSuccessBorder
            }`,
          }}
          align="center"
          gap={16}
        >
          <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 15 }} />
          <Text style={{ fontSize: 12, color: token.colorSuccess, fontWeight: 600 }}>
            ออนไลน์ {stats.online} รายการ
          </Text>
          {stats.error > 0 && (
            <>
              <CloseCircleFilled style={{ color: token.colorError, fontSize: 15 }} />
              <Text style={{ fontSize: 12, color: token.colorError, fontWeight: 600 }}>
                พบปัญหา {stats.error} รายการ — กรุณาแจ้ง Developer ทันที
              </Text>
            </>
          )}
          <Text
            style={{
              fontSize: 12,
              color: token.colorTextDescription,
              marginLeft: "auto",
            }}
          >
            แสดง {stats.total} / {serverHealthData.length} รายการ
          </Text>
        </Flex>
      )}

      {/* Table */}
      <div style={{ padding: "0 0 4px" }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) =>
            `${record.group}-${record.module}-${record.service}`
          }
          loading={isFetchingStatus}
          size="middle"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ["10", "15", "25", "50"],
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            style: { padding: "12px 20px", margin: 0 },
          }}
          rowClassName={(record) =>
            !["200", "404"].includes(record.status) ? "row-error" : ""
          }
          locale={{
            emptyText: (
              <Empty
                description="ไม่พบข้อมูลสถานะระบบในขณะนี้"
                style={{ padding: 48 }}
              />
            ),
          }}
          scroll={{ x: "max-content" }}
          style={{ borderRadius: 0 }}
        />
      </div>

      {/* Row error highlight */}
      <style>{`
        .row-error > td {
          background: #fff5f5 !important;
        }
        .dark .row-error > td {
          background: rgba(239,68,68,0.08) !important;
        }
      `}</style>
    </Card>
  );
};

export default ServerStatusTable;
