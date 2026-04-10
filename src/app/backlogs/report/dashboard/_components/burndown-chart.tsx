"use client";

import {
  BarChartOutlined,
  FallOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Spin,
  Tabs,
  theme,
  Typography,
} from "antd";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import { useBacklogDashboardStore } from "../_state/use-backlog-dashboard-store";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const { Text } = Typography;

/**
 * แสดงกราฟ Burndown Chart และ Velocity Chart รายสัปดาห์
 */
export const BurndownChart = () => {
  const { token } = theme.useToken();
  const { burndownData, burndownLoading, burndownTotalIssues, fetchBurndown } =
    useBacklogDashboardStore();

  useEffect(() => {
    fetchBurndown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labels = burndownData.map((p) => p.week_label);

  // ---- Burndown Chart Data ----
  const burndownChartData = {
    labels,
    datasets: [
      {
        label: "งานคงเหลือจริง (Actual)",
        data: burndownData.map((p) => p.actual_remaining),
        borderColor: token.colorError,
        backgroundColor: token.colorErrorBg,
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
        fill: false,
      },
      {
        label: "งานคงเหลือตามแผน (Ideal)",
        data: burndownData.map((p) => p.ideal_remaining),
        borderColor: token.colorPrimary,
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        tension: 0,
        fill: false,
      },
    ],
  };

  const burndownOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} งาน`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "จำนวนงานคงเหลือ" },
        ticks: { stepSize: 1 },
      },
      x: {
        title: { display: true, text: "ช่วงเวลา" },
      },
    },
  };

  // ---- Velocity Chart Data ----
  const velocityChartData = {
    labels,
    datasets: [
      {
        label: "งานที่ปิดได้ต่อสัปดาห์ (Velocity)",
        data: burndownData.map((p) => p.velocity),
        backgroundColor: token.colorSuccess + "CC",
        borderColor: token.colorSuccess,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const velocityOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ปิดได้ ${ctx.parsed.y} งาน`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "จำนวนงานที่ปิดได้" },
        ticks: { stepSize: 1 },
      },
      x: {
        title: { display: true, text: "ช่วงเวลา" },
      },
    },
  };

  const isEmpty = !burndownLoading && burndownData.length === 0;

  const tabItems = [
    {
      key: "burndown",
      label: (
        <span>
          <FallOutlined style={{ marginRight: 6 }} />
          กราฟการเบิร์นดาวน์
        </span>
      ),
      children: isEmpty ? (
        <Empty
          description="ไม่พบข้อมูลในช่วงเวลาที่เลือก"
          style={{ padding: "40px 0" }}
        />
      ) : (
        <div style={{ height: 320 }}>
          <Line data={burndownChartData} options={burndownOptions} />
        </div>
      ),
    },
    {
      key: "velocity",
      label: (
        <span>
          <BarChartOutlined style={{ marginRight: 6 }} />
          กราฟ Velocity รายสัปดาห์
        </span>
      ),
      children: isEmpty ? (
        <Empty
          description="ไม่พบข้อมูลในช่วงเวลาที่เลือก"
          style={{ padding: "40px 0" }}
        />
      ) : (
        <div style={{ height: 320 }}>
          <Bar data={velocityChartData} options={velocityOptions} />
        </div>
      ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{ borderColor: token.colorBorderSecondary }}
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Row align="middle" gutter={8}>
            <Col>
              <FallOutlined
                style={{ fontSize: "1rem", color: token.colorPrimary }}
              />
            </Col>
            <Col>
              <Text style={{ fontWeight: 600, fontSize: "1rem" }}>
                กราฟประสิทธิภาพการปิดงาน
              </Text>
            </Col>
            {burndownTotalIssues > 0 && (
              <Col>
                <Text type="secondary" style={{ fontSize: "0.8rem" }}>
                  (งานทั้งหมด {burndownTotalIssues} งาน)
                </Text>
              </Col>
            )}
          </Row>
        </Col>
        <Col>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={fetchBurndown}
            loading={burndownLoading}
          >
            รีเฟรช
          </Button>
        </Col>
      </Row>

      <Spin spinning={burndownLoading}>
        <Tabs items={tabItems} size="small" />
      </Spin>
    </Card>
  );
};
