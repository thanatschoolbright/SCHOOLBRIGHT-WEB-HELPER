"use client";

import React from "react";
import { Card, Table, Tag, Space, Typography, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  UnorderedListOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useServerStatusStore, ServerLogEntry } from "../_state/server-status.state";

type LogRow = Omit<ServerLogEntry, "id"> & { id: string };
import dayjs from "dayjs";
import "dayjs/locale/th";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

/**
 * ตารางแสดงรายการ Log ทั้งหมด (Raw Log Entries Table)
 * รองรับ pagination จาก server
 */
const LogEntriesTable: React.FC = () => {
  const { token } = theme.useToken();
  const { logs, logPagination, isLoadingLogs, fetchLogs } = useServerStatusStore();

  // ✨ แปลง BigInt id เป็น string เพื่อใช้เป็น rowKey ได้
  const dataSource: LogRow[] = logs.map((log) => ({
    ...log,
    id: String(log.id),
  }));

  const columns: ColumnsType<LogRow> = [
    {
      title: "เวลาตรวจสอบ",
      dataIndex: "request_time",
      key: "request_time",
      width: 180,
      render: (date: string) =>
        dayjs(date).tz("Asia/Bangkok").format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Server",
      key: "server",
      render: (_: any, record: LogRow) => {
        const body = record.response_body as { server_name_th?: string } | null;
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text strong style={{ fontWeight: 600, fontSize: "13px" }}>
              {body?.server_name_th ?? record.trace_id ?? "-"}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: "11px" }}>
              {record.endpoint ?? "-"}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: "สถานะ",
      dataIndex: "called_by",
      key: "called_by",
      width: 150,
      render: (status: string) => {
        const isOnline = status === "Online";
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
    },
    {
      title: "Response Time",
      dataIndex: "duration_ms",
      key: "duration_ms",
      width: 160,
      render: (ms: number | null) => {
        if (ms === null || ms === undefined) return <Typography.Text type="secondary">-</Typography.Text>;
        const color = ms < 500 ? "success" : ms < 2000 ? "warning" : "error";
        return (
          <Tag color={color} icon={<ClockCircleOutlined />}>
            {ms.toLocaleString()} ms
          </Tag>
        );
      },
      sorter: (a: any, b: any) => (a.duration_ms ?? 0) - (b.duration_ms ?? 0),
    },
    {
      title: "HTTP Status",
      dataIndex: "status_code",
      key: "status_code",
      width: 130,
      render: (code: number | null) => {
        if (!code) return <Typography.Text type="secondary">-</Typography.Text>;
        const color = code === 200 || code === 404 ? "success" : "error";
        return <Tag color={color}>{code}</Tag>;
      },
    },
    {
      title: "ข้อผิดพลาด",
      dataIndex: "error_message",
      key: "error_message",
      render: (msg: string | null) =>
        msg ? (
          <Typography.Text type="danger" style={{ fontSize: "12px" }}>
            {msg}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
      title={
        <Space>
          <UnorderedListOutlined style={{ color: token.colorPrimary, fontSize: "1rem" }} />
          <Typography.Text style={{ fontSize: "1rem", fontWeight: 600 }}>
            รายการ Log ทั้งหมด
          </Typography.Text>
          {logPagination && (
            <Typography.Text type="secondary" style={{ fontSize: "13px", fontWeight: 400 }}>
              ({logPagination.total.toLocaleString()} รายการ)
            </Typography.Text>
          )}
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={isLoadingLogs}
        rowKey="id"
        pagination={{
          current: logPagination?.page ?? 1,
          pageSize: logPagination?.page_size ?? 20,
          total: logPagination?.total ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `ทั้งหมด ${total.toLocaleString()} รายการ`,
          onChange: (page) => fetchLogs(page),
        }}
        scroll={{ x: 900 }}
      />
    </Card>
  );
};

export default LogEntriesTable;
