"use client";

import React, { useMemo } from "react";
import { Card, Table, Tag, Space, Typography, theme, Flex, Tooltip, Badge } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ExpandableConfig } from "antd/es/table/interface";
import {
  UnorderedListOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useServerStatusStore, ServerLogEntry } from "../_state/server-status.state";
import dayjs from "dayjs";
import "dayjs/locale/th";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

type LogRow = Omit<ServerLogEntry, "id"> & { id: string };

// แต่ละรอบ batch check (จัดกลุ่ม logs ที่ request_time ห่างกันไม่เกิน 30 วินาที)
interface BatchRow {
  batch_key: string;
  batch_time: string;
  total: number;
  online_count: number;
  offline_count: number;
  avg_duration_ms: number;
  entries: LogRow[];
}

// ✨ จัดกลุ่ม logs ตามรอบ batch (request_time ห่างกันไม่เกิน 30 วินาทีถือเป็น batch เดียว)
function groupIntoBatches(logs: LogRow[]): BatchRow[] {
  if (logs.length === 0) return [];

  const sorted = [...logs].sort(
    (a, b) => new Date(b.request_time).getTime() - new Date(a.request_time).getTime()
  );

  const batches: BatchRow[] = [];
  let currentBatch: LogRow[] = [sorted[0]!];
  let batchAnchor = new Date(sorted[0]!.request_time).getTime();

  for (let i = 1; i < sorted.length; i++) {
    const row = sorted[i]!;
    const t = new Date(row.request_time).getTime();
    if (Math.abs(batchAnchor - t) <= 30_000) {
      currentBatch.push(row);
    } else {
      batches.push(buildBatch(currentBatch));
      currentBatch = [row];
      batchAnchor = t;
    }
  }
  batches.push(buildBatch(currentBatch));

  return batches;
}

// ✨ สร้าง BatchRow จาก log หลายรายการใน batch เดียว
function buildBatch(entries: LogRow[]): BatchRow {
  const online = entries.filter((e) => e.called_by === "Online");
  const offline = entries.filter((e) => e.called_by === "Offline");
  const durations = entries.map((e) => e.duration_ms ?? 0).filter((d) => d > 0);
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
      : 0;
  const firstEntry = entries[0]!;
  const batchTime = entries.reduce(
    (earliest, e) =>
      new Date(e.request_time) < new Date(earliest) ? e.request_time : earliest,
    firstEntry.request_time
  );

  return {
    batch_key: batchTime,
    batch_time: batchTime,
    total: entries.length,
    online_count: online.length,
    offline_count: offline.length,
    avg_duration_ms: avgDuration,
    entries,
  };
}

/**
 * ตารางแสดงรายการ Log แบบจัดกลุ่มตามรอบ batch (Grouped Log Entries Table)
 * รองรับ pagination จาก server + expandable rows แสดงรายละเอียดแต่ละ server ใน batch
 */
const LogEntriesTable: React.FC = () => {
  const { token } = theme.useToken();
  const { logs, logPagination, isLoadingLogs, fetchLogs } = useServerStatusStore();

  // ✨ แปลง BigInt id เป็น string
  const normalizedLogs: LogRow[] = useMemo(
    () => logs.map((log) => ({ ...log, id: String(log.id) })),
    [logs]
  );

  // ✨ จัดกลุ่มตาม batch
  const batches = useMemo(() => groupIntoBatches(normalizedLogs), [normalizedLogs]);

  // คอลัมน์หลัก (แต่ละแถว = 1 batch / 1 รอบ check)
  const batchColumns: ColumnsType<BatchRow> = [
    {
      title: "เวลาตรวจสอบ",
      dataIndex: "batch_time",
      key: "batch_time",
      width: 190,
      render: (date: string) => (
        <Flex align="center" gap={6}>
          <ClockCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
          <Space direction="vertical" size={0}>
            <Typography.Text style={{ fontSize: 13, fontWeight: 600 }}>
              {dayjs(date).tz("Asia/Bangkok").format("DD/MM/YYYY HH:mm:ss")}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(date).tz("Asia/Bangkok").fromNow()}
            </Typography.Text>
          </Space>
        </Flex>
      ),
    },
    {
      title: "ผลรวม",
      key: "summary",
      width: 200,
      render: (_: unknown, record: BatchRow) => (
        <Flex gap={8} align="center">
          <Tooltip title={`${record.online_count} servers ทำงานปกติ`}>
            <Tag
              color="success"
              icon={<CheckCircleOutlined />}
              style={{ borderRadius: 12, margin: 0 }}
            >
              {record.online_count} Online
            </Tag>
          </Tooltip>
          {record.offline_count > 0 && (
            <Tooltip title={`${record.offline_count} servers หยุดทำงาน`}>
              <Tag
                color="error"
                icon={<CloseCircleOutlined />}
                style={{ borderRadius: 12, margin: 0 }}
              >
                {record.offline_count} Offline
              </Tag>
            </Tooltip>
          )}
        </Flex>
      ),
    },
    {
      title: "Response เฉลี่ย",
      dataIndex: "avg_duration_ms",
      key: "avg_duration_ms",
      width: 150,
      render: (ms: number) => {
        const color = ms < 500 ? "success" : ms < 2000 ? "warning" : "error";
        return (
          <Tag color={color} style={{ borderRadius: 6, margin: 0 }}>
            {ms.toLocaleString()} ms
          </Tag>
        );
      },
    },
    {
      title: "Server ที่ตรวจสอบ",
      dataIndex: "total",
      key: "total",
      width: 140,
      render: (total: number, record: BatchRow) => (
        <Flex align="center" gap={6}>
          <Badge
            count={total}
            style={{ backgroundColor: token.colorPrimary }}
            overflowCount={99}
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            ระบบ
          </Typography.Text>
          {record.offline_count === 0 && (
            <Tag color="green" style={{ margin: 0, fontSize: 11, borderRadius: 10 }}>
              ปกติทั้งหมด
            </Tag>
          )}
        </Flex>
      ),
    },
  ];

  // คอลัมน์ sub-table (แต่ละแถวใน batch = 1 server)
  const entryColumns: ColumnsType<LogRow> = [
    {
      title: "Server",
      key: "server",
      render: (_: unknown, record: LogRow) => {
        const body = record.response_body as { server_name_th?: string } | null;
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {body?.server_name_th ?? record.trace_id ?? "-"}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
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
      width: 140,
      render: (status: string) => {
        const isOnline = status === "Online";
        return (
          <Tag
            color={isOnline ? "success" : "error"}
            icon={isOnline ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            style={{ borderRadius: 12 }}
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
      width: 150,
      render: (ms: number | null) => {
        if (ms === null || ms === undefined)
          return <Typography.Text type="secondary">-</Typography.Text>;
        const color = ms < 500 ? "success" : ms < 2000 ? "warning" : "error";
        return (
          <Tag color={color} icon={<ClockCircleOutlined />}>
            {ms.toLocaleString()} ms
          </Tag>
        );
      },
    },
    {
      title: "HTTP Status",
      dataIndex: "status_code",
      key: "status_code",
      width: 120,
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
          <Typography.Text type="danger" style={{ fontSize: 12 }}>
            {msg}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
  ];

  // ✨ กำหนด expandable rows แสดง sub-table ของแต่ละ batch
  const expandable: ExpandableConfig<BatchRow> = {
    expandedRowRender: (record: BatchRow) => (
      <div style={{ margin: "8px 0 8px 48px" }}>
        <Table
          columns={entryColumns}
          dataSource={record.entries}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 700 }}
          style={{ borderRadius: 8 }}
        />
      </div>
    ),
    expandIcon: ({ expanded, onExpand, record }: import("rc-table/lib/interface").RenderExpandIconProps<BatchRow>) => (
      <RightOutlined
        rotate={expanded ? 90 : 0}
        style={{
          fontSize: 11,
          color: token.colorTextTertiary,
          cursor: "pointer",
          transition: "transform 0.2s",
        }}
        onClick={(e) => onExpand(record, e)}
      />
    ),
  };

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
              ({batches.length} รอบ จาก {logPagination.total.toLocaleString()} รายการ)
            </Typography.Text>
          )}
        </Space>
      }
    >
      <Table
        columns={batchColumns}
        dataSource={batches}
        loading={isLoadingLogs}
        rowKey="batch_key"
        expandable={expandable}
        pagination={{
          current: logPagination?.page ?? 1,
          pageSize: logPagination?.page_size ?? 20,
          total: logPagination?.total ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `ทั้งหมด ${total.toLocaleString()} รายการ (${batches.length} รอบ)`,
          onChange: (page) => fetchLogs(page),
        }}
        scroll={{ x: 700 }}
      />
    </Card>
  );
};

export default LogEntriesTable;
