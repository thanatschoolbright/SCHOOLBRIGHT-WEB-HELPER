"use client";

import React from "react";
import { Card, Table, Tag, Progress, Space, Typography, theme } from "antd";
import {
  BarChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useServerStatusStore, ServerLogSummary } from "../_state/server-status.state";
import dayjs from "dayjs";
import "dayjs/locale/th";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

/**
 * ตารางสรุป Uptime/Downtime แยกตาม Server แต่ละตัว (Per-Server Uptime Table)
 * แสดง uptime %, จำนวนครั้ง offline, response time เฉลี่ย
 */
const LogServerUptimeTable: React.FC = () => {
  const { token } = theme.useToken();
  const { logSummary, isLoadingSummary } = useServerStatusStore();

  type ServerRow = NonNullable<ServerLogSummary["servers"]>[number];

  const columns = [
    {
      title: "ชื่อ Server",
      dataIndex: "server_name_th",
      key: "server_name_th",
      render: (name: string, record: ServerRow) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong style={{ fontWeight: 600 }}>
            {name}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: "11px" }}>
            {record.server_key}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Uptime",
      dataIndex: "uptime_percent",
      key: "uptime_percent",
      width: 200,
      sorter: (a: ServerRow, b: ServerRow) => a.uptime_percent - b.uptime_percent,
      render: (percent: number) => {
        const color =
          percent >= 99
            ? token.colorSuccess
            : percent >= 95
              ? token.colorWarning
              : token.colorError;
        return (
          <Space>
            <Progress
              percent={percent}
              size="small"
              strokeColor={color}
              format={(p) => `${p?.toFixed(1)}%`}
              style={{ width: 120 }}
            />
          </Space>
        );
      },
    },
    {
      title: "Online / Offline",
      key: "counts",
      width: 180,
      render: (_: any, record: ServerRow) => (
        <Space>
          <Tag color="success" icon={<CheckCircleOutlined />}>
            {record.online_count}
          </Tag>
          <Tag color={record.offline_count > 0 ? "error" : "default"} icon={<CloseCircleOutlined />}>
            {record.offline_count}
          </Tag>
        </Space>
      ),
      sorter: (a: ServerRow, b: ServerRow) => b.offline_count - a.offline_count,
    },
    {
      title: "Response Time เฉลี่ย",
      dataIndex: "avg_response_time_ms",
      key: "avg_response_time_ms",
      width: 180,
      render: (ms: number) => {
        const color = ms < 500 ? "success" : ms < 2000 ? "warning" : "error";
        return (
          <Tag color={color} icon={<ClockCircleOutlined />}>
            {ms.toLocaleString()} ms
          </Tag>
        );
      },
      sorter: (a: ServerRow, b: ServerRow) => a.avg_response_time_ms - b.avg_response_time_ms,
    },
    {
      title: "ตรวจสอบล่าสุด",
      dataIndex: "last_checked",
      key: "last_checked",
      width: 180,
      render: (date: string) =>
        dayjs(date).tz("Asia/Bangkok").format("DD/MM/YYYY HH:mm"),
      sorter: (a: ServerRow, b: ServerRow) =>
        new Date(a.last_checked).getTime() - new Date(b.last_checked).getTime(),
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
          <BarChartOutlined style={{ color: token.colorPrimary, fontSize: "1rem" }} />
          <Typography.Text style={{ fontSize: "1rem", fontWeight: 600 }}>
            สรุป Uptime/Downtime แต่ละ Server
          </Typography.Text>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={logSummary?.servers ?? []}
        loading={isLoadingSummary}
        rowKey="server_key"
        pagination={false}
        rowClassName={(record: ServerRow) =>
          record.offline_count > 0 ? "ant-table-row-warning" : ""
        }
      />
    </Card>
  );
};

export default LogServerUptimeTable;
