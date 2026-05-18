"use client";

import {
  ApiOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CopyOutlined,
  EyeOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
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

// ✨ แปลง group key เป็น label ภาษาไทยที่อ่านง่าย
const GROUP_LABEL: Record<string, string> = {
  "login-system": "ระบบเข้าสู่ระบบ",
  "user-system": "ระบบผู้ใช้",
  "notification-system": "ระบบแจ้งเตือน",
  "attendance-system": "ระบบเช็คชื่อ",
  "leave-system": "ระบบลา",
  "school-system": "ระบบโรงเรียน",
  "server-system": "ระบบเซิร์ฟเวอร์",
};

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
        fontWeight: 800,
        padding: "2px 8px",
        borderRadius: 4,
        background: isPost ? token.colorErrorBg : token.colorSuccessBg,
        color: isPost ? token.colorError : token.colorSuccess,
        border: `1px solid ${
          isPost ? token.colorErrorBorder : token.colorSuccessBorder
        }`,
        whiteSpace: "nowrap",
        fontFamily: "monospace",
        textTransform: "uppercase",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      {method}
    </span>
  );
};

// ── Response time cell ────────────────────────────────────────────────────
const ResponseTimeCell: React.FC<{ ms: number }> = ({ ms }) => {
  const { token } = theme.useToken();

  // แบ่ง severity: ดี < 300ms, ปานกลาง < 1000ms, ช้า >= 1000ms
  const color =
    ms < 300 ? token.colorSuccess : ms < 1000 ? token.colorWarning : token.colorError;
  const bg =
    ms < 300 ? token.colorSuccessBg : ms < 1000 ? token.colorWarningBg : token.colorErrorBg;
  const border =
    ms < 300 ? token.colorSuccessBorder : ms < 1000 ? token.colorWarningBorder : token.colorErrorBorder;
  const label = ms < 300 ? "เร็ว" : ms < 1000 ? "ปานกลาง" : "ช้า";

  return (
    <Flex align="center" gap={8}>
      <ThunderboltOutlined style={{ color, fontSize: 13 }} />
      <Flex vertical gap={1}>
        <Text style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 13 }}>
          {ms.toLocaleString()} ms
        </Text>
        <span
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 700,
            padding: "1px 7px",
            borderRadius: 10,
            background: bg,
            color,
            border: `1px solid ${border}`,
            lineHeight: "16px",
          }}
        >
          {label}
        </span>
      </Flex>
    </Flex>
  );
};

// ── Status cell ───────────────────────────────────────────────────────────
const StatusCell: React.FC<{ code: string }> = ({ code }) => {
  const { token } = theme.useToken();
  const isOk = ["200", "404"].includes(code);
  return (
    <Flex align="center" gap={10}>
      {/* Pulse dot */}
      <span style={{ position: "relative", flexShrink: 0 }}>
        <span
          style={{
            display: "block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: isOk ? "#22c55e" : "#ef4444",
            boxShadow: isOk
              ? "0 0 0 3px rgba(34,197,94,0.25)"
              : "0 0 0 3px rgba(239,68,68,0.25)",
          }}
        />
      </span>
      <Tag
        icon={isOk ? <CheckCircleFilled /> : <CloseCircleFilled />}
        color={isOk ? "success" : "error"}
        style={{
          borderRadius: 20,
          paddingInline: 12,
          paddingBlock: 3,
          fontWeight: 700,
          fontSize: 13,
          margin: 0,
          lineHeight: "22px",
        }}
      >
        {isOk ? "ONLINE" : `ERROR · ${code}`}
      </Tag>
      {!isOk && (
        <Text style={{ fontSize: 11, color: token.colorTextQuaternary }}>
          {code}
        </Text>
      )}
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

  const filteredData = useMemo(() => {
    return serverHealthData.filter((item) => {
      const q = (searchQuery || "").toLowerCase();
      const matchSearch =
        (item.name_th || "").toLowerCase().includes(q) ||
        (item.name_en || "").toLowerCase().includes(q) ||
        (item.service || "").toLowerCase().includes(q) ||
        (item.module || "").toLowerCase().includes(q) ||
        (item.request?.url || "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ONLINE" && ["200", "404"].includes(item.status)) ||
        (statusFilter === "ERROR" && !["200", "404"].includes(item.status));

      const gF = (groupFilter || "ALL").toUpperCase();
      const matchGroup =
        gF === "ALL" || (item.group || "other").toUpperCase() === gF;

      const mF = (methodFilter || "ALL").toUpperCase();
      const matchMethod =
        mF === "ALL" || (item.request?.method || "GET").toUpperCase() === mF;

      return matchSearch && matchStatus && matchGroup && matchMethod;
    });
  }, [serverHealthData, searchQuery, statusFilter, groupFilter, methodFilter]);

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
      width: 200,
      sorter: (a, b) => (a.group || "").localeCompare(b.group || ""),
      render: (group: string) => {
        const label = GROUP_LABEL[group] ?? group ?? "อื่นๆ";
        return (
          <Flex align="center" gap={8}>
            <ApiOutlined style={{ fontSize: 13, color: token.colorTextTertiary }} />
            <Flex vertical gap={1}>
              <Text style={{ fontSize: 13, fontWeight: 600 }}>{label}</Text>
              <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
                {group || "other"}
              </Text>
            </Flex>
          </Flex>
        );
      },
    },
    {
      title: "ชื่อระบบ",
      key: "name",
      width: 330,
      sorter: (a, b) => (a.name_th || "").localeCompare(b.name_th || ""),
      render: (_, record) => {
        const isOnline = ["200", "404"].includes(record.status);
        return (
          <Flex vertical gap={4}>
            <Text
              strong
              style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}
            >
              {record.name_th}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isOnline ? token.colorTextTertiary : token.colorError,
                fontStyle: "italic",
              }}
            >
              {record.name_en}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: token.colorTextQuaternary,
                fontFamily: "monospace",
              }}
            >
              {record.module}
            </Text>
          </Flex>
        );
      },
    },
    {
      title: "Endpoint",
      key: "endpoint",
      width: 200,
      sorter: (a, b) =>
        (a.request?.url ?? a.service).localeCompare(
          b.request?.url ?? b.service,
        ),
      render: (_: unknown, record) => {
        const method = record.request?.method || "GET";
        const endpointUrl = record.request?.url ?? record.service;
        return (
          <Flex align="center" gap={12}>
            <MethodBadge method={method} />
            <Flex align="center" gap={8} className="flex-1 min-w-0">
              <Tooltip title={endpointUrl}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "monospace",
                    color: token.colorPrimary,
                    cursor: "pointer",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                    fontWeight: 500,
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
                  icon={<CopyOutlined style={{ fontSize: 13 }} />}
                  style={{
                    padding: "0 4px",
                    height: 24,
                    color: token.colorTextQuaternary,
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(endpointUrl);
                    toast.success("คัดลอก Endpoint เรียบร้อย");
                  }}
                />
              </Tooltip>
            </Flex>
          </Flex>
        );
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 200,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (code: string) => <StatusCell code={code} />,
    },
    {
      title: "Response Time",
      dataIndex: "response_time_ms",
      width: 160,
      sorter: (a, b) => (a.response_time_ms ?? 0) - (b.response_time_ms ?? 0),
      render: (ms: number) => <ResponseTimeCell ms={ms ?? 0} />,
    },
    {
      title: "ตรวจสอบ",
      key: "action",
      width: 130,
      align: "center",
      render: (_, record) => (
        <Tooltip title="ดูรายละเอียดทางเทคนิค">
          <Button
            type="primary"
            ghost
            icon={<EyeOutlined />}
            onClick={() => openDetailModal(record)}
            style={{
              borderRadius: 20,
              fontWeight: 700,
              fontSize: 13,
              height: 38,
              paddingInline: 16,
            }}
          >
            Debug
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      title={
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={14}>
            <Flex gap={"middle"} align="center">
              <UnorderedListOutlined />
              <Text
                strong
                style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}
              >
                รายการประเมินสถานะระบบ
              </Text>
            </Flex>
          </Flex>

          <Flex>
            <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
              แสดง {stats.total} / {serverHealthData.length} รายการ
            </Text>
          </Flex>
        </Flex>
      }
      variant="outlined"
      styles={{ body: { padding: 0 } }}
    >
      {/* Card Header */}
      <Flex
        justify="flex-end"
        align="center"
        style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Space size={10} align="center">
          <Tooltip title="ส่งออกรายงาน Excel">
            <Button
              icon={<FileExcelOutlined />}
              onClick={openExportModal}
              style={{ borderRadius: 10, fontWeight: 600, height: 40 }}
            >
              Excel
            </Button>
          </Tooltip>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => fetchServerStatus("normal")}
            loading={isFetchingStatus}
            style={{ borderRadius: 10, fontWeight: 600, height: 40 }}
          >
            รีเฟรช
          </Button>
        </Space>
      </Flex>

      {/* Status alert bar */}
      {!isFetchingStatus && stats.error > 0 && (
        <Flex
          align="center"
          gap={10}
          style={{
            padding: "12px 24px",
            background: token.colorErrorBg,
            borderBottom: `1px solid ${token.colorErrorBorder}`,
          }}
        >
          <CloseCircleFilled
            style={{ color: token.colorError, fontSize: 16 }}
          />
          <Text
            style={{ fontSize: 13, color: token.colorError, fontWeight: 700 }}
          >
            พบปัญหา {stats.error} รายการ — กรุณาแจ้ง Developer ทันที
          </Text>
        </Flex>
      )}

      {/* Table */}
      <div className="mx-5">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) =>
            `${record.group}-${record.module}-${record.service}`
          }
          loading={isFetchingStatus}
          size="large"
          pagination={{
            defaultPageSize: 50,
            showSizeChanger: true,
            pageSizeOptions: ["15", "25", "50", "100"],
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            style: { padding: "16px 24px", margin: 0 },
          }}
          rowClassName={(record) =>
            !["200", "404"].includes(record.status) ? "row-error" : ""
          }
          locale={{
            emptyText: (
              <Empty
                description="ไม่พบข้อมูลสถานะระบบในขณะนี้"
                style={{ padding: 64 }}
              />
            ),
          }}
          scroll={{ x: "max-content" }}
          style={{ borderRadius: 0 }}
          components={{
            body: {
              row: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
                <tr {...props} style={{ ...props.style, height: 72 }} />
              ),
            },
          }}
        />
      </div>

      {/* Row error highlight */}
      <style>{`
        .row-error > td {
          background: #fff5f5 !important;
        }
        .dark .row-error > td {
          background: rgba(239,68,68,0.07) !important;
        }
      `}</style>
    </Card>
  );
};

export default ServerStatusTable;
