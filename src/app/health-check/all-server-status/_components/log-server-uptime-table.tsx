"use client";

import {
  BarChartOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  Card,
  Flex,
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import React from "react";
import {
  ServerLogSummary,
  useServerStatusStore,
} from "../_state/server-status.state";

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
      title: "เซิร์ฟเวอร์",
      dataIndex: "server_name_th",
      key: "server_name_th",
      render: (name: string, record: ServerRow) => (
        <Flex align="center" gap={12}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: token.colorPrimaryBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorPrimary,
              fontSize: 14,
            }}
          >
            <DatabaseOutlined />
          </div>
          <Space direction="vertical" size={0}>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {name}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 11, fontFamily: "monospace" }}
            >
              {record.server_key}
            </Typography.Text>
          </Space>
        </Flex>
      ),
    },
    {
      title: "ความพร้อมใช้งาน (Uptime)",
      dataIndex: "uptime_percent",
      key: "uptime_percent",
      width: 200,
      sorter: (a: ServerRow, b: ServerRow) =>
        a.uptime_percent - b.uptime_percent,
      render: (percent: number) => {
        const color =
          percent >= 99 ? "#16a34a" : percent >= 95 ? "#d97706" : "#dc2626";
        return (
          <Flex vertical gap={4} style={{ width: 140 }}>
            <Flex justify="space-between" align="end">
              <Typography.Text style={{ fontSize: 13, fontWeight: 700, color }}>
                {percent.toFixed(2)}%
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                เสถียรภาพ
              </Typography.Text>
            </Flex>
            <Progress
              percent={percent}
              size={[140, 6]}
              showInfo={false}
              strokeColor={color}
              trailColor="rgba(128,128,128,0.1)"
            />
          </Flex>
        );
      },
    },
    {
      title: "ประวัติการเชื่อมต่อ",
      key: "counts",
      width: 220,
      render: (_: unknown, record: ServerRow) => (
        <Flex gap={8}>
          <Tooltip title={`รวมออนไลน์ทั้งหมด ${record.online_count} ครั้ง`}>
            <Flex
              align="center"
              gap={6}
              style={{
                background: "rgba(22, 163, 74, 0.05)",
                padding: "2px 10px",
                borderRadius: 20,
                border: "1px solid rgba(22, 163, 74, 0.1)",
              }}
            >
              <CheckOutlined style={{ color: "#16a34a", fontSize: 10 }} />
              <Typography.Text
                style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}
              >
                {record.online_count.toLocaleString()}
              </Typography.Text>
            </Flex>
          </Tooltip>

          <Tooltip title={`รวมออฟไลน์ทั้งหมด ${record.offline_count} ครั้ง`}>
            <Flex
              align="center"
              gap={6}
              style={{
                background:
                  record.offline_count > 0
                    ? "rgba(220, 38, 38, 0.05)"
                    : "transparent",
                padding: "2px 10px",
                borderRadius: 20,
                border:
                  record.offline_count > 0
                    ? "1px solid rgba(220, 38, 38, 0.1)"
                    : "1px solid rgba(128,128,128,0.1)",
              }}
            >
              <CloseOutlined
                style={{
                  color: record.offline_count > 0 ? "#dc2626" : "#94a3b8",
                  fontSize: 10,
                }}
              />
              <Typography.Text
                style={{
                  fontSize: 12,
                  color: record.offline_count > 0 ? "#dc2626" : "#94a3b8",
                  fontWeight: record.offline_count > 0 ? 600 : 400,
                }}
              >
                {record.offline_count.toLocaleString()}
              </Typography.Text>
            </Flex>
          </Tooltip>
        </Flex>
      ),
      sorter: (a: ServerRow, b: ServerRow) => b.offline_count - a.offline_count,
    },
    {
      title: "การตอบสนองเฉลี่ย",
      dataIndex: "avg_response_time_ms",
      key: "avg_response_time_ms",
      width: 160,
      render: (ms: number) => {
        const color = ms < 500 ? "success" : ms < 2000 ? "warning" : "error";
        return (
          <Flex vertical gap={2}>
            <Tag
              color={color}
              icon={<ThunderboltOutlined />}
              style={{
                margin: 0,
                borderRadius: 6,
                fontWeight: 600,
                border: "none",
              }}
            >
              {ms.toLocaleString()} ms
            </Tag>
            <Typography.Text type="secondary" style={{ fontSize: 10 }}>
              ความหน่วงเฉลี่ย
            </Typography.Text>
          </Flex>
        );
      },
      sorter: (a: ServerRow, b: ServerRow) =>
        a.avg_response_time_ms - b.avg_response_time_ms,
    },
    {
      title: "ตรวจสอบล่าสุด",
      dataIndex: "last_checked",
      key: "last_checked",
      width: 180,
      render: (date: string) => (
        <Tooltip
          title={dayjs(date).tz("Asia/Bangkok").format("DD/MM/YYYY HH:mm:ss")}
        >
          <Flex align="center" gap={6}>
            <ClockCircleOutlined style={{ fontSize: 12, color: "#94a3b8" }} />
            <Typography.Text style={{ fontSize: 12 }}>
              {dayjs(date).tz("Asia/Bangkok").fromNow()}
            </Typography.Text>
          </Flex>
        </Tooltip>
      ),
      sorter: (a: ServerRow, b: ServerRow) =>
        new Date(a.last_checked).getTime() - new Date(b.last_checked).getTime(),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 0 } }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      }}
      title={
        <Flex align="center" gap={12} style={{ padding: "8px 0" }}>
          <div
            style={{
              background: token.colorPrimary,
              padding: 8,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 2px 8px ${token.colorPrimary}40`,
            }}
          >
            <BarChartOutlined style={{ fontSize: "1.2rem", color: "#fff" }} />
          </div>
          <Flex vertical>
            <Typography.Text
              strong
              style={{ fontSize: "1rem", lineHeight: 1.2 }}
            >
              สรุป Uptime/Downtime แต่ละ Server
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              วิเคราะห์ความเสถียรและช่วงเวลาที่เกิดปัญหาของเซิร์ฟเวอร์
            </Typography.Text>
          </Flex>
        </Flex>
      }
    >
      <Table
        columns={columns}
        dataSource={logSummary?.servers ?? []}
        loading={isLoadingSummary}
        rowKey="server_key"
        pagination={false}
        size="middle"
        scroll={{ x: 800 }}
        rowClassName={(record: ServerRow) =>
          record.offline_count > 0 ? "ant-table-row-warning" : ""
        }
      />
    </Card>
  );
};

export default LogServerUptimeTable;
