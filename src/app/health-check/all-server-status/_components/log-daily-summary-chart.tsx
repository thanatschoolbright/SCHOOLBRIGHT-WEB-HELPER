"use client";

import { LineChartOutlined } from "@ant-design/icons";
import { Card, Flex, Select, Spin, Typography, theme, Empty } from "antd";
import { Line } from "@ant-design/plots";
import dayjs from "dayjs";
import "dayjs/locale/th";
import React, { useEffect, useState } from "react";
import { useServerStatusStore } from "../_state/server-status.state";

dayjs.locale("th");

// ✨ Graph แสดง Uptime % รายวันของทุก Server (Line Chart จาก Daily Summary)
const LogDailySummaryChart: React.FC = () => {
  const { token } = theme.useToken();
  const { dailySummary, isLoadingDailySummary, fetchDailySummary } = useServerStatusStore();
  const [days, setDays] = useState<number>(30);

  // โหลดข้อมูลเมื่อ days เปลี่ยน
  useEffect(() => {
    fetchDailySummary(days);
  }, [days, fetchDailySummary]);

  // แปลงข้อมูลเป็น format ที่ @ant-design/plots ต้องการ
  const chartData = dailySummary.flatMap((server) =>
    server.data.map((point) => ({
      date: dayjs(point.date).format("DD/MM"),
      server: server.server_name_th,
      uptime: parseFloat(point.uptime_percent.toFixed(2)),
      offline_count: point.offline_count,
      date_full: point.date,
    }))
  );

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
        { field: "uptime", name: "Uptime", valueFormatter: (v: number) => `${v.toFixed(2)}%` },
        { field: "offline_count", name: "Offline", valueFormatter: (v: number) => `${v} ครั้ง` },
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
        data: chartData.length > 0 ? [
          { date: chartData[0]?.date, uptime: 99 },
          { date: chartData[chartData.length - 1]?.date, uptime: 99 },
        ] : [],
      },
    ],
    legend: {
      color: {
        position: "bottom",
      },
    },
    style: {
      lineWidth: 2,
    },
    height: 320,
  };

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      }}
      title={
        <Flex align="center" justify="space-between" style={{ padding: "8px 0" }}>
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
              <LineChartOutlined style={{ fontSize: "1.2rem", color: "#fff" }} />
            </div>
            <Flex vertical>
              <Typography.Text strong style={{ fontSize: "1rem", lineHeight: 1.2 }}>
                กราฟ Uptime รายวัน
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                เปอร์เซ็นต์ความพร้อมใช้งานของแต่ละ Server แยกตามวัน (เส้นประ = เป้าหมาย 99%)
              </Typography.Text>
            </Flex>
          </Flex>
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
        </Flex>
      }
    >
      {isLoadingDailySummary ? (
        <Flex justify="center" align="center" style={{ height: 320 }}>
          <Spin size="large" />
        </Flex>
      ) : chartData.length === 0 ? (
        <Flex justify="center" align="center" style={{ height: 320 }}>
          <Empty
            description={
              <Typography.Text type="secondary">
                ยังไม่มีข้อมูล Daily Summary — กด "สรุปข้อมูล LOG รายวัน" ก่อน
              </Typography.Text>
            }
          />
        </Flex>
      ) : (
        <Line {...config} />
      )}
    </Card>
  );
};

export default LogDailySummaryChart;
