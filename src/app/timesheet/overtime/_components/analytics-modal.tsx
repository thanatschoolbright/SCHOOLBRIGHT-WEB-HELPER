"use client";

import { BarChartOutlined, FireOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Calendar, Card, Col, Flex, Modal, Row, Space, theme, Tooltip, Typography } from "antd";
import type { CellRenderInfo } from "rc-picker/lib/interface";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
} from "chart.js";
import dayjs, { Dayjs } from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import React, { useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
);

dayjs.extend(buddhistEra);

interface OvertimeRecord {
  id: string | number;
  request_date?: string;
  status?: string;
  descriptions?: any[];
  [key: string]: any;
}

interface AnalyticsModalProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  dataSource: OvertimeRecord[];
}

/**
 * Modal แสดงกราฟวิเคราะห์สถิติการทำงานล่วงเวลา
 */
const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  visible,
  setVisible,
  dataSource,
}) => {
  const { token } = theme.useToken();

  // จัดเรียงข้อมูลเพื่อนำเสนอในรูปแบบกราฟแนวโน้มรายเดือน
  const chartConfigurationData = useMemo(() => {
    const hourlyDistribution: Record<string, number> = {};
    dataSource.forEach((record) => {
      const monthIdentifier = dayjs(record.request_date).format("MMM BB");
      const durationValue =
        record.descriptions?.reduce(
          (sum: number, d: any) => sum + Number(d.duration || 0),
          0,
        ) || 0;
      hourlyDistribution[monthIdentifier] =
        (hourlyDistribution[monthIdentifier] || 0) + durationValue;
    });

    const monthLabels = Object.keys(hourlyDistribution).sort(
      (a, b) => dayjs(a, "MMM BB").unix() - dayjs(b, "MMM BB").unix(),
    );

    return {
      labels: monthLabels,
      datasets: [
        {
          label: "จำนวนชั่วโมง OT รวม",
          data: monthLabels.map((label) => hourlyDistribution[label]),
          backgroundColor: token.colorPrimary + "90",
          borderRadius: 8,
          barThickness: 32,
        },
      ],
    };
  }, [dataSource, token.colorPrimary]);

  // สถานะเดือนที่เลือกสำหรับ Heat Map
  const [heatMapMonth, setHeatMapMonth] = useState<Dayjs>(dayjs());

  // คำนวณ density OT แต่ละวัน (จำนวน request + hours รวม) สำหรับ Heat Map
  const heatMapData = useMemo(() => {
    const dayMap: Record<string, { count: number; hours: number; statuses: string[] }> = {};
    const monthKey = heatMapMonth.format("YYYY-MM");
    dataSource.forEach((record) => {
      const dateKey = dayjs(record.request_date).format("YYYY-MM-DD");
      if (!dateKey.startsWith(monthKey)) return;
      if (!dayMap[dateKey]) dayMap[dateKey] = { count: 0, hours: 0, statuses: [] };
      dayMap[dateKey].count += 1;
      dayMap[dateKey].hours += record.descriptions?.reduce(
        (sum: number, d: any) => sum + Number(d.duration || 0), 0,
      ) || 0;
      if (record.status) dayMap[dateKey].statuses.push(record.status);
    });
    return dayMap;
  }, [dataSource, heatMapMonth]);

  // หา max hours ในเดือนเพื่อคำนวณ intensity
  const maxHoursInMonth = useMemo(() => {
    const values = Object.values(heatMapData).map((d) => d.hours);
    return values.length > 0 ? Math.max(...values) : 1;
  }, [heatMapData]);

  /** คำนวณสี Heat Map ตาม intensity (0-1) */
  const getHeatColor = (hours: number, max: number, tokenRef: typeof token): string => {
    if (hours === 0) return "transparent";
    const intensity = hours / max;
    if (intensity <= 0.25) return tokenRef.colorWarningBg;
    if (intensity <= 0.5) return tokenRef.colorWarning + "80";
    if (intensity <= 0.75) return tokenRef.colorWarning;
    return tokenRef.colorError;
  };

  /** Render cell ของ Calendar สำหรับ Heat Map */
  const heatCellRender = (value: Dayjs, info: CellRenderInfo<Dayjs>): React.ReactNode => {
    if (info.type !== "date") return null;
    const key = value.format("YYYY-MM-DD");
    const dayData = heatMapData[key];
    if (!dayData) return null;

    const pendingCount = dayData.statuses.filter((s) => s === "pending").length;
    const approvedCount = dayData.statuses.filter((s) => s === "approved" || s === "paid").length;

    return (
      <Tooltip
        title={
          <Flex vertical gap={4}>
            <Typography.Text style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>
              {value.format("D MMMM BBBB")}
            </Typography.Text>
            <Typography.Text style={{ color: "#fff", fontSize: 11 }}>
              🕐 {dayData.hours.toFixed(1)} ชม. | {dayData.count} รายการ
            </Typography.Text>
            {pendingCount > 0 && (
              <Typography.Text style={{ color: "#fadb14", fontSize: 11 }}>
                ⏳ รออนุมัติ {pendingCount} รายการ
              </Typography.Text>
            )}
            {approvedCount > 0 && (
              <Typography.Text style={{ color: "#b7eb8f", fontSize: 11 }}>
                ✅ อนุมัติแล้ว {approvedCount} รายการ
              </Typography.Text>
            )}
          </Flex>
        }
        placement="top"
      >
        <div
          style={{
            margin: "2px 1px",
            borderRadius: 6,
            background: getHeatColor(dayData.hours, maxHoursInMonth, token),
            border: `1px solid ${getHeatColor(dayData.hours, maxHoursInMonth, token)}`,
            padding: "2px 4px",
            cursor: "default",
          }}
        >
          <Typography.Text style={{ fontSize: 10, fontWeight: 700, color: token.colorText }}>
            {dayData.hours > 0 ? `${dayData.hours.toFixed(0)}h` : ""}
          </Typography.Text>
        </div>
      </Tooltip>
    );
  };

  // จัดสรุปสถานะรายการทั้งหมดเพื่อแสดงในกราฟวงกลม
  const pieChartConfiguration = useMemo(() => {
    const statusCounts: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    dataSource.forEach((record) => {
      const s = record.status ?? "";
      if (s && Object.prototype.hasOwnProperty.call(statusCounts, s)) {
        statusCounts[s] = (statusCounts[s] ?? 0) + 1;
      } else {
        statusCounts["rejected"] = (statusCounts["rejected"] ?? 0) + 1;
      }
    });

    return {
      labels: ["รอการอนุมัติ", "อนุมัติแล้ว", "ปฏิเสธ/อื่นๆ"],
      datasets: [
        {
          data: [
            statusCounts.pending,
            statusCounts.approved,
            statusCounts.rejected,
          ],
          backgroundColor: ["#faad14", "#52c41a", "#ff4d4f"],
          hoverOffset: 12,
          borderWidth: 0,
        },
      ],
    };
  }, [dataSource]);

  return (
    <Modal
      title={
        <Space>
          <BarChartOutlined /> แดชบอร์ดวิเคราะห์สถิติการทำงานล่วงเวลา
        </Space>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={null}
      width={1200}
      centered
    >
      <Flex vertical gap={32} style={{ paddingBlock: 32 }}>
        {/* === Calendar Heat Map Section === */}
        <Card
          title={
            <Flex align="center" gap={8}>
              <FireOutlined style={{ color: token.colorError }} />
              <Typography.Text strong>
                OT Heat Map — ความหนาแน่นการทำ OT รายวัน
              </Typography.Text>
            </Flex>
          }
          variant="borderless"
          style={{
            background: token.colorFillQuaternary,
            borderRadius: token.borderRadiusLG,
          }}
          extra={
            <Flex align="center" gap={8}>
              {/* Legend */}
              <Flex align="center" gap={6}>
                {[
                  { label: "น้อย", color: token.colorWarningBg },
                  { label: "ปานกลาง", color: token.colorWarning + "80" },
                  { label: "มาก", color: token.colorWarning },
                  { label: "สูงสุด", color: token.colorError },
                ].map((item) => (
                  <Flex key={item.label} align="center" gap={3}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography.Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                      {item.label}
                    </Typography.Text>
                  </Flex>
                ))}
              </Flex>
              {/* Month Navigation */}
              <Button
                type="text"
                size="small"
                shape="circle"
                icon={<LeftOutlined />}
                onClick={() => setHeatMapMonth((m) => m.subtract(1, "month"))}
              />
              <Typography.Text strong style={{ minWidth: 100, textAlign: "center" }}>
                {heatMapMonth.format("MMMM BBBB")}
              </Typography.Text>
              <Button
                type="text"
                size="small"
                shape="circle"
                icon={<RightOutlined />}
                onClick={() => setHeatMapMonth((m) => m.add(1, "month"))}
              />
              <Button
                size="small"
                type="text"
                style={{ color: token.colorPrimary, fontSize: 12 }}
                onClick={() => setHeatMapMonth(dayjs())}
              >
                เดือนนี้
              </Button>
            </Flex>
          }
        >
          <Calendar
            value={heatMapMonth}
            onChange={setHeatMapMonth as any}
            headerRender={() => null}
            cellRender={heatCellRender as any}
            style={{ background: "transparent" }}
            fullscreen
          />
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              title="ภาพรวมแนวโน้มภาระงานรายเดือน (ชั่วโมงสะสม)"
              variant="borderless"
              style={{
                background: token.colorFillQuaternary,
                borderRadius: token.borderRadiusLG,
              }}
            >
              <Flex vertical style={{ height: 450 }}>
                <Bar
                  data={chartConfigurationData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: token.colorBorderSecondary,
                          borderDash: [4, 4],
                        } as any,
                      },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </Flex>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title="สัดส่วนสถานะคำขอในระบบ"
              variant="borderless"
              style={{
                background: token.colorFillQuaternary,
                borderRadius: token.borderRadiusLG,
              }}
            >
              <Flex align="center" justify="center" style={{ height: 450 }}>
                <Doughnut
                  data={pieChartConfiguration}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { padding: 20, usePointStyle: true },
                      },
                    },
                    cutout: "65%",
                  }}
                />
              </Flex>
            </Card>
          </Col>
        </Row>
      </Flex>
    </Modal>
  );
};

export default AnalyticsModal;
