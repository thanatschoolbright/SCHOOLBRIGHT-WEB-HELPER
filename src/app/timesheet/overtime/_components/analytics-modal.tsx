"use client";

import { BarChartOutlined } from "@ant-design/icons";
import { Card, Col, Flex, Modal, Row, Space, theme } from "antd";
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
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import React, { useMemo } from "react";
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

  // จัดสรุปสถานะรายการทั้งหมดเพื่อแสดงในกราฟวงกลม
  const pieChartConfiguration = useMemo(() => {
    const statusCounts: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    dataSource.forEach((record) => {
      if (record.status && statusCounts[record.status] !== undefined)
        statusCounts[record.status]++;
      else statusCounts["rejected"]++;
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
