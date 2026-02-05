import {
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  InfoCircleOutlined,
  PieChartOutlined,
  RiseOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getUserById } from "@helpers/local_storage/user.storage";
import {
  Badge,
  Card,
  Col,
  Divider,
  Modal,
  Progress,
  Row,
  Segmented,
  Space,
  Statistic,
  Typography,
} from "antd";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import dayjs from "dayjs";
import "dayjs/locale/th";
import React, { useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { OvertimeRecord } from "../types/overtime.types";

const { Text, Title: AntTitle } = Typography;

dayjs.locale("th");

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
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
  const [viewType, setViewType] = useState<string | number>("Monthly");

  const analyticsData = useMemo(() => {
    let totalHours = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    const monthlyHours: Record<string, number> = {};
    const requesterHours: Record<string, number> = {};
    const requesterNameCache = new Map<string, string>();

    const resolveRequesterName = (requesterId?: string) => {
      if (!requesterId) return "ไม่ระบุชื่อ";
      if (requesterNameCache.has(requesterId))
        return requesterNameCache.get(requesterId);
      const user = getUserById(requesterId);
      const fullName =
        [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
        user?.name ||
        requesterId;
      requesterNameCache.set(requesterId, fullName);
      return fullName;
    };

    dataSource.forEach((record) => {
      if (record.status === "approved") approvedCount++;
      else if (record.status === "rejected") rejectedCount++;
      else pendingCount++;

      const recordHours =
        record.descriptions?.reduce(
          (sum, desc) => sum + (Number(desc.duration) || 0),
          0,
        ) || 0;
      totalHours += recordHours;

      const monthKey = record.request_date
        ? dayjs(record.request_date).format("MMM YYYY")
        : "N/A";
      monthlyHours[monthKey] = (monthlyHours[monthKey] || 0) + recordHours;

      const requesterId = record.requester_id || record.created_by || "Unknown";
      requesterHours[requesterId] =
        (requesterHours[requesterId] || 0) + recordHours;
    });

    const sortedMonths = Object.keys(monthlyHours).sort(
      (a, b) => dayjs(a, "MMM YYYY").unix() - dayjs(b, "MMM YYYY").unix(),
    );
    const topRequesters = Object.entries(requesterHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, hours]) => ({ displayName: resolveRequesterName(id), hours }));

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

  // สัดส่วนเปอร์เซ็นต์สำหรับ Progress Circle
  const approvalRate =
    analyticsData.totalRequests > 0
      ? (analyticsData.approvedCount / analyticsData.totalRequests) * 100
      : 0;

  return (
    <div>
      <Modal
        title={
          <Space>
            <div
              style={{
                background: "#e6f7ff",
                padding: "8px",
                borderRadius: "10px",
              }}
            >
              <RiseOutlined style={{ color: "#1890ff", fontSize: "24px" }} />
            </div>
            <div>
              <AntTitle level={4} style={{ margin: 0 }}>
                Executive Overtime Analytics
              </AntTitle>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                ข้อมูลสรุปและแนวโน้มการทำงานล่วงเวลา
              </Text>
            </div>
          </Space>
        }
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width="90vw"
        style={{ top: 20, maxWidth: "1600px" }}
      >
        <div style={{ padding: "10px 0" }}>
          {/* Section 1: Key Performance Indicators */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable styles={{ body: { padding: "20px" } }}>
                <Statistic
                  title={
                    <Space>
                      <UserOutlined /> คำขอทั้งหมด
                    </Space>
                  }
                  value={analyticsData.totalRequests}
                  valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
                  suffix="รายการ"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable styles={{ body: { padding: "20px" } }}>
                <Statistic
                  title={
                    <Space>
                      <ClockCircleOutlined /> ชั่วโมง OT สะสม
                    </Space>
                  }
                  value={analyticsData.totalHours}
                  precision={1}
                  valueStyle={{ color: "#722ed1", fontWeight: "bold" }}
                  suffix="ชม."
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable styles={{ body: { padding: "20px" } }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Statistic
                    title={
                      <Space>
                        <CheckCircleOutlined /> อัตราการอนุมัติ
                      </Space>
                    }
                    value={approvalRate}
                    precision={1}
                    valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
                    suffix="%"
                  />
                  <Progress
                    type="circle"
                    percent={Math.round(approvalRate)}
                    width={50}
                    strokeColor="#52c41a"
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable styles={{ body: { padding: "20px" } }}>
                <Statistic
                  title={
                    <Space>
                      <InfoCircleOutlined /> อยู่ระหว่างรอดำเนินการ
                    </Space>
                  }
                  value={analyticsData.pendingCount}
                  valueStyle={{ color: "#faad14", fontWeight: "bold" }}
                  prefix={<Badge status="processing" />}
                />
              </Card>
            </Col>
          </Row>

          <Divider orientation="left" style={{ margin: "32px 0" }}>
            <Space>
              <BarChartOutlined /> วิเคราะห์เชิงลึก
            </Space>
          </Divider>

          {/* Section 2: Charts */}
          <Row gutter={[20, 20]}>
            <Col lg={16} xs={24}>
              <Card
                title={
                  <Space>
                    <CalendarOutlined /> แนวโน้มรายเดือน
                  </Space>
                }
                extra={
                  <Segmented
                    options={["Monthly", "Weekly"]}
                    value={viewType}
                    onChange={setViewType}
                    size="small"
                  />
                }
              >
                <div style={{ height: 350 }}>
                  <Bar
                    data={{
                      labels: analyticsData.monthlyLabels,
                      datasets: [
                        {
                          label: "ชั่วโมงรวม",
                          data: analyticsData.monthlyData,
                          backgroundColor: "rgba(24, 144, 255, 0.5)",
                          borderColor: "#1890ff",
                          borderWidth: 1,
                          borderRadius: 6,
                        },
                      ],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </Card>
            </Col>

            <Col lg={8} xs={24}>
              <Card
                title={
                  <Space>
                    <PieChartOutlined /> สัดส่วนสถานะ
                  </Space>
                }
              >
                <div
                  style={{
                    height: 350,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Doughnut
                    data={{
                      labels: ["อนุมัติ", "รอ", "ปฏิเสธ"],
                      datasets: [
                        {
                          data: [
                            analyticsData.approvedCount,
                            analyticsData.pendingCount,
                            analyticsData.rejectedCount,
                          ],
                          backgroundColor: ["#52c41a", "#faad14", "#ff4d4f"],
                          hoverOffset: 15,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: "bottom" } },
                    }}
                  />
                </div>
              </Card>
            </Col>

            <Col span={24}>
              <Card
                title={
                  <Space>
                    <FireOutlined style={{ color: "#ff4d4f" }} />
                    <span>Top 5 ผู้ขอ OT สูงสุด</span>
                    <Text
                      type="danger"
                      style={{ fontSize: "12px", fontWeight: "normal" }}
                    >
                      (เฝ้าระวังภาวะ Burnout)
                    </Text>
                  </Space>
                }
              >
                <div style={{ height: 300 }}>
                  <Bar
                    options={{
                      indexAxis: "y" as const,
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                    }}
                    data={{
                      labels: analyticsData.topRequesters.map(
                        (r) => r.displayName,
                      ),
                      datasets: [
                        {
                          label: "ชั่วโมง",
                          data: analyticsData.topRequesters.map((r) => r.hours),
                          backgroundColor: "rgba(255, 77, 79, 0.6)",
                          borderColor: "#ff4d4f",
                          borderWidth: 1,
                          borderRadius: 4,
                        },
                      ],
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Modal>
    </div>
  );
};
