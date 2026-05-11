"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DashboardOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Line } from "@ant-design/plots";
import {
  Badge,
  Button,
  Card,
  Empty,
  Flex,
  Modal,
  Progress,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
  theme,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import React, { useEffect, useMemo, useState } from "react";
import { useServerStatusStore } from "../_state/server-status.state";

dayjs.locale("th");

// ✨ Graph แสดง Uptime % รายวันของทุก Server และตารางสรุป
const LogDailySummaryChart: React.FC = () => {
  const { token } = theme.useToken();
  const { dailySummary, isLoadingDailySummary, fetchDailySummary } =
    useServerStatusStore();
  const [days, setDays] = useState<number>(30);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // โหลดข้อมูลเมื่อ days เปลี่ยน
  useEffect(() => {
    fetchDailySummary(days);
  }, [days, fetchDailySummary]);

  // แปลงข้อมูลเป็น format ที่ @ant-design/plots ต้องการ
  const chartData = useMemo(
    () =>
      dailySummary.flatMap((server) =>
        server.data.map((point) => ({
          date: dayjs(point.date).format("DD/MM"),
          server: server.server_name_th,
          uptime: parseFloat(point.uptime_percent.toFixed(2)),
          offline_count: point.offline_count,
          date_full: point.date,
          avg_response_time: point.avg_response_time_ms,
        })),
      ),
    [dailySummary],
  );

  // สรุปข้อมูลสำหรับตาราง
  const summaryTableData = useMemo(() => {
    return dailySummary
      .map((server) => {
        const totalUptime = server.data.reduce(
          (acc, curr) => acc + curr.uptime_percent,
          0,
        );
        const avgUptime =
          server.data.length > 0 ? totalUptime / server.data.length : 0;
        const totalOffline = server.data.reduce(
          (acc, curr) => acc + curr.offline_count,
          0,
        );
        const avgResponse =
          server.data.length > 0
            ? server.data.reduce(
                (acc, curr) => acc + curr.avg_response_time_ms,
                0,
              ) / server.data.length
            : 0;

        return {
          key: server.server_key,
          server_name: server.server_name_th,
          avg_uptime: parseFloat(avgUptime.toFixed(2)),
          total_offline: totalOffline,
          avg_response: Math.round(avgResponse),
        };
      })
      .sort((a, b) => a.avg_uptime - b.avg_uptime);
  }, [dailySummary]);

  const config = {
    data: chartData,
    xField: "date",
    yField: "uptime",
    colorField: "server",
    smooth: true,
    point: {
      shapeField: "circle",
      sizeField: 4,
    },
    tooltip: {
      title: (d: any) => `วันที่ ${d.date}`,
      items: [
        {
          field: "uptime",
          name: "Uptime",
          valueFormatter: (v: number) => `${v.toFixed(2)}%`,
        },
        {
          field: "offline_count",
          name: "Offline",
          valueFormatter: (v: number) => `${v} ครั้ง`,
        },
        {
          field: "avg_response_time",
          name: "Avg Response",
          valueFormatter: (v: number) => `${v} ms`,
        },
      ],
    },
    yAxis: {
      min: 0,
      max: 100,
      label: {
        formatter: (v: string) => `${v}%`,
      },
      grid: {
        line: {
          style: { stroke: token.colorBorderSecondary, lineDash: [4, 4] },
        },
      },
    },
    annotations: [
      {
        type: "line",
        xField: "date",
        yField: "uptime",
        style: { stroke: "#16a34a", lineDash: [6, 3], lineWidth: 1 },
        data:
          chartData.length > 0
            ? [
                { date: chartData[0]?.date, uptime: 99 },
                { date: chartData[chartData.length - 1]?.date, uptime: 99 },
              ]
            : [],
      },
    ],
    theme:
      token.mode === "dark" || token.colorBgContainer === "#141414"
        ? "dark"
        : "light",
    legend: {
      color: {
        position: "bottom",
        layout: {
          justifyContent: "center",
          wrap: true,
        },
      },
    },
    label: {
      text: "server",
      selector: "last",
      position: "right",
      style: {
        dx: 10,
        dy: -5,
        fontSize: 10,
        fontWeight: "bold",
        fill: token.colorTextDescription,
      },
    },
    style: {
      lineWidth: 2,
    },
    height: isFullscreen ? 850 : 600,
  };

  const columns = [
    {
      title: "ชื่อ Server",
      dataIndex: "server_name",
      key: "server_name",
      render: (text: string) => (
        <Flex align="center" gap={8}>
          <Badge status="processing" color={token.colorPrimary} />
          <Typography.Text strong>{text}</Typography.Text>
        </Flex>
      ),
    },
    {
      title: "เฉลี่ย Uptime (%)",
      dataIndex: "avg_uptime",
      key: "avg_uptime",
      width: 280,
      render: (v: number) => {
        const isLow = v < 99;
        return (
          <Flex vertical gap={4} style={{ width: "100%" }}>
            <Flex justify="space-between" align="center">
              <Tag
                icon={isLow ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                color={isLow ? "error" : "success"}
                style={{ borderRadius: 10, margin: 0 }}
              >
                {v.toFixed(2)}%
              </Tag>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                Goal: 99%
              </Typography.Text>
            </Flex>
            <Progress
              percent={v}
              size="small"
              status={isLow ? "exception" : "active"}
              showInfo={false}
              strokeColor={isLow ? token.colorError : token.colorSuccess}
              trailColor={token.colorFillAlter}
            />
          </Flex>
        );
      },
      sorter: (a: any, b: any) => a.avg_uptime - b.avg_uptime,
    },
    {
      title: "รวมจำนวน Offline (ครั้ง)",
      dataIndex: "total_offline",
      key: "total_offline",
      align: "center" as const,
      width: 180,
      render: (v: number) => (
        <Tag
          color={v > 0 ? "warning" : "default"}
          bordered={false}
          style={{
            borderRadius: 6,
            minWidth: 40,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          {v.toLocaleString()}
        </Tag>
      ),
      sorter: (a: any, b: any) => a.total_offline - b.total_offline,
    },
    {
      title: "เฉลี่ย Response Time (ms)",
      dataIndex: "avg_response",
      key: "avg_response",
      align: "right" as const,
      width: 220,
      render: (v: number) => {
        let color = token.colorSuccess;
        if (v > 500) color = token.colorWarning;
        if (v > 1000) color = token.colorError;

        return (
          <Flex align="center" justify="end" gap={8}>
            <ThunderboltOutlined style={{ color }} />
            <Typography.Text strong style={{ color }}>
              {v.toLocaleString()}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ms
            </Typography.Text>
          </Flex>
        );
      },
      sorter: (a: any, b: any) => a.avg_response - b.avg_response,
    },
  ];

  const renderContent = () => (
    <Flex vertical gap={24}>
      {isLoadingDailySummary ? (
        <Flex
          justify="center"
          align="center"
          style={{ height: isFullscreen ? 850 : 600 }}
        >
          <Spin size="large" tip="กำลังดึงข้อมูลสรุปรายวัน..." />
        </Flex>
      ) : chartData.length === 0 ? (
        <Flex
          justify="center"
          align="center"
          style={{ height: isFullscreen ? 850 : 600 }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Flex vertical gap={8} align="center">
                <Typography.Text type="secondary">
                  ยังไม่มีข้อมูล Daily Summary
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  กดปุ่ม "สรุปข้อมูล LOG รายวัน" ในแท็บ LOG
                  เพื่อสร้างข้อมูลชุดนี้
                </Typography.Text>
              </Flex>
            }
          />
        </Flex>
      ) : (
        <>
          <Line {...config} />

          <Card
            title={
              <Flex align="center" gap={12}>
                <div
                  style={{
                    background: token.colorInfoBg,
                    color: token.colorInfo,
                    padding: "6px 8px",
                    borderRadius: 8,
                    display: "flex",
                  }}
                >
                  <DashboardOutlined />
                </div>
                <Flex vertical>
                  <Typography.Text strong style={{ fontSize: "0.95rem" }}>
                    สรุปภาพรวมราย Server ({days} วันย้อนหลัง)
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    เรียงลำดับตามความสม่ำเสมอของ Uptime (น้อยไปมาก)
                  </Typography.Text>
                </Flex>
              </Flex>
            }
            styles={{ body: { padding: 0 } }}
            style={{
              borderRadius: 12,
              border: `1px solid ${token.colorBorderSecondary}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <Table
              dataSource={summaryTableData}
              columns={columns}
              pagination={false}
              size="middle"
              className="custom-summary-table"
              rowClassName={() => "row-hover-effect"}
              scroll={{ x: "max-content" }}
            />
          </Card>
        </>
      )}
    </Flex>
  );

  return (
    <>
      <Card
        styles={{ body: { padding: 16 } }}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        }}
        title={
          <Flex
            align="center"
            justify="space-between"
            style={{ padding: "8px 0" }}
          >
            <Flex align="center" gap={12}>
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
                <LineChartOutlined
                  style={{ fontSize: "1.2rem", color: "#fff" }}
                />
              </div>
              <Flex vertical>
                <Typography.Text
                  strong
                  style={{ fontSize: "1rem", lineHeight: 1.2 }}
                >
                  กราฟ Uptime รายวัน
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  เปอร์เซ็นต์ความพร้อมใช้งานของแต่ละ Server แยกตามวัน (เส้นประ =
                  เป้าหมาย 99%)
                </Typography.Text>
              </Flex>
            </Flex>
            <Flex align="center" gap={8}>
              <Select
                value={days}
                onChange={setDays}
                style={{ width: 120 }}
                options={[
                  { value: 7, label: "7 วัน" },
                  { value: 14, label: "14 วัน" },
                  { value: 30, label: "30 วัน" },
                  { value: 60, label: "60 วัน" },
                  { value: 90, label: "90 วัน" },
                ]}
              />
              <Button
                icon={<FullscreenOutlined />}
                onClick={() => setIsFullscreen(true)}
              >
                ขยายเต็มจอ
              </Button>
            </Flex>
          </Flex>
        }
      >
        {renderContent()}
      </Card>

      <Modal
        title={
          <Flex align="center" gap={12}>
            <LineChartOutlined style={{ color: token.colorPrimary }} />
            <Typography.Text strong>
              กราฟ Uptime รายวัน และตารางสรุปแบบ Full-Screen
            </Typography.Text>
          </Flex>
        }
        open={isFullscreen}
        onCancel={() => setIsFullscreen(false)}
        width="95dvw"
        style={{ top: 20 }}
        footer={[
          <Button
            key="close"
            type="primary"
            icon={<FullscreenExitOutlined />}
            onClick={() => setIsFullscreen(false)}
          >
            ปิดหน้าต่างขยาย
          </Button>,
        ]}
      >
        <div style={{ padding: "20px 0" }}>{renderContent()}</div>
      </Modal>
    </>
  );
};

export default LogDailySummaryChart;
