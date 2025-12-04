import React, { useMemo } from "react";
import { Modal, Row, Col, Card, Statistic, Divider } from "antd";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { OvertimeRecord } from "../types/overtime.types";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { getUserById } from "@helpers/local_storage/user.storage";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  RiseOutlined,
} from "@ant-design/icons";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  dataSource: OvertimeRecord[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  visible,
  setVisible,
  dataSource,
}) => {
  // --- Data Processing Logic ---
  const analyticsData = useMemo(() => {
    let totalHours = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    const monthlyHours: Record<string, number> = {};
    const requesterHours: Record<string, number> = {};
    const requesterNameCache = new Map<string, string>();

    const resolveRequesterName = (requesterId?: string) => {
      if (!requesterId) return "Unknown";
      if (requesterNameCache.has(requesterId)) {
        return requesterNameCache.get(requesterId) || "Unknown";
      }
      const user = getUserById(requesterId);
      const fullName =
        [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
        user?.name ||
        requesterId;
      requesterNameCache.set(requesterId, fullName);
      return fullName;
    };

    dataSource.forEach((record) => {
      // 1. Status Counts
      if (record.status === "approved") approvedCount++;
      else if (record.status === "rejected") rejectedCount++;
      else pendingCount++;

      // 2. Calculate Hours per record
      const recordHours =
        record.descriptions?.reduce(
          (sum, desc) => sum + (Number(desc.duration) || 0),
          0
        ) || 0;
      totalHours += recordHours;

      // 3. Monthly Trend
      const monthKey = record.request_date
        ? dayjs(record.request_date).locale("th").format("MMMM YYYY")
        : "Unknown";
      monthlyHours[monthKey] = (monthlyHours[monthKey] || 0) + recordHours;

      // 4. Top Requesters
      const requesterId = record.requester_id || record.created_by || "Unknown";
      requesterHours[requesterId] =
        (requesterHours[requesterId] || 0) + recordHours;
    });

    // Sort Monthly Data
    const sortedMonths = Object.keys(monthlyHours).sort((a, b) => {
      // Simple sort, might need better date parsing if format changes
      return (
        dayjs(a, "MMMM YYYY", "th").unix() - dayjs(b, "MMMM YYYY", "th").unix()
      );
    });

    // Sort Top Requesters
    const topRequesters = Object.entries(requesterHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([requesterId, hours]) => ({
        requesterId,
        displayName: resolveRequesterName(requesterId),
        hours,
      }));

    return {
      totalHours,
      totalRequests: dataSource.length,
      approvedCount,
      pendingCount,
      rejectedCount,
      monthlyLabels: sortedMonths,
      monthlyData: sortedMonths.map((m) => monthlyHours[m]),
      topRequesters,
    };
  }, [dataSource]);

  // --- Chart Configurations ---
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "แนวโน้มชั่วโมง OT รายเดือน" },
    },
  };

  const barData = {
    labels: analyticsData.monthlyLabels,
    datasets: [
      {
        label: "ชั่วโมงรวม",
        data: analyticsData.monthlyData,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: ["อนุมัติ", "รออนุมัติ", "ปฏิเสธ"],
    datasets: [
      {
        data: [
          analyticsData.approvedCount,
          analyticsData.pendingCount,
          analyticsData.rejectedCount,
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)", // Green
          "rgba(255, 206, 86, 0.6)", // Yellow
          "rgba(255, 99, 132, 0.6)", // Red
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const topRequesterData = {
    labels: analyticsData.topRequesters.map((r) => r.displayName),
    datasets: [
      {
        label: "ชั่วโมงสะสม",
        data: analyticsData.topRequesters.map((r) => r.hours),
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <RiseOutlined style={{ color: "#1890ff", fontSize: "20px" }} />
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>
            Executive Analytics Dashboard
          </span>
        </div>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={null}
      width={1000}
      style={{ top: 20 }}
      bodyStyle={{ padding: "24px", background: "#f0f2f5" }}
    >
      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Total Requests"
              value={analyticsData.totalRequests}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Total OT Hours"
              value={analyticsData.totalHours.toFixed(2)}
              precision={2}
              prefix={<ClockCircleOutlined />}
              suffix="Hrs"
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Approval Rate"
              value={
                analyticsData.totalRequests > 0
                  ? (
                      (analyticsData.approvedCount /
                        analyticsData.totalRequests) *
                      100
                    ).toFixed(1)
                  : 0
              }
              prefix={<CheckCircleOutlined />}
              suffix="%"
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Pending Review"
              value={analyticsData.pendingCount}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Charts Section */}
      <Row gutter={[16, 16]}>
        {/* Monthly Trend */}
        <Col span={16}>
          <Card title="Monthly OT Trend" bordered={false} className="shadow-sm">
            <Bar options={barOptions} data={barData} height={120} />
          </Card>
        </Col>

        {/* Status Distribution */}
        <Col span={8}>
          <Card
            title="Status Distribution"
            bordered={false}
            className="shadow-sm"
          >
            <div
              style={{
                height: "250px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Doughnut
                data={doughnutData}
                options={{ maintainAspectRatio: false }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
        {/* Top Requesters */}
        <Col span={24}>
          <Card
            title="Top 5 OT Requesters (Burnout Risk)"
            bordered={false}
            className="shadow-sm"
          >
            <Bar
              options={{
                indexAxis: "y" as const,
                responsive: true,
                plugins: {
                  legend: { position: "right" as const },
                },
              }}
              data={topRequesterData}
              height={80}
            />
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};
