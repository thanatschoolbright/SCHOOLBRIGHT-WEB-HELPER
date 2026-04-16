"use client";

import {
  BarChartOutlined,
  ClockCircleOutlined,
  FireOutlined,
  LeftOutlined,
  RightOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Calendar,
  Card,
  Col,
  Flex,
  Modal,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
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
import { Bar, Doughnut, Line } from "react-chartjs-2";

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

  // คำนวณข้อมูลสำหรับ Team Dashboard — Top OT Users
  const topOtUsers = useMemo(() => {
    const userMap: Record<
      string,
      {
        name: string;
        employeeCode: string;
        totalHours: number;
        approvedHours: number;
        pendingCount: number;
        requestCount: number;
      }
    > = {};

    dataSource.forEach((record) => {
      const uid = String(record.requester_id ?? record.requester_employee_code ?? "unknown");
      const name =
        record.requester_name ||
        `${record.requester_user?.firstname_th ?? ""} ${record.requester_user?.lastname_th ?? ""}`.trim() ||
        uid;
      const employeeCode =
        record.requester_employee_code ||
        record.requester_user?.employee_code ||
        "-";

      if (!userMap[uid]) {
        userMap[uid] = {
          name,
          employeeCode,
          totalHours: 0,
          approvedHours: 0,
          pendingCount: 0,
          requestCount: 0,
        };
      }

      const hours =
        record.descriptions?.reduce(
          (s: number, d: any) => s + Number(d.duration || 0),
          0,
        ) || 0;

      userMap[uid].totalHours += hours;
      userMap[uid].requestCount += 1;
      if (["approved", "paid"].includes(record.status || "")) {
        userMap[uid].approvedHours += hours;
      }
      if (record.status === "pending") {
        userMap[uid].pendingCount += 1;
      }
    });

    return Object.entries(userMap)
      .map(([uid, data]) => ({ uid, ...data }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10);
  }, [dataSource]);

  // คำนวณ max hours สำหรับ progress bar
  const maxUserHours = useMemo(
    () => (topOtUsers.length > 0 ? topOtUsers[0].totalHours : 1),
    [topOtUsers],
  );

  // คำนวณ Average Wait Time (pending → approved/rejected) เป็นวัน
  const avgWaitStats = useMemo(() => {
    const completedItems = dataSource.filter((r) =>
      ["approved", "rejected", "paid"].includes(r.status || ""),
    );
    if (completedItems.length === 0) return { avgDays: 0, minDays: 0, maxDays: 0 };

    const waitDays = completedItems
      .map((r) => {
        const created = r.created_at || r.request_date;
        const updated = r.updated_at;
        if (!created || !updated) return null;
        return Math.max(0, dayjs(updated).diff(dayjs(created), "day"));
      })
      .filter((d): d is number => d !== null);

    if (waitDays.length === 0) return { avgDays: 0, minDays: 0, maxDays: 0 };

    const avg = waitDays.reduce((a, b) => a + b, 0) / waitDays.length;
    return {
      avgDays: Math.round(avg * 10) / 10,
      minDays: Math.min(...waitDays),
      maxDays: Math.max(...waitDays),
    };
  }, [dataSource]);

  // คำนวณ Weekly Trend — จำนวน OT request แต่ละวันใน 4 สัปดาห์ล่าสุด
  const weeklyTrendData = useMemo(() => {
    const weeks: Record<string, number> = {};
    const weeksHours: Record<string, number> = {};
    const now = dayjs();

    // สร้าง label 8 สัปดาห์ย้อนหลัง
    for (let i = 7; i >= 0; i--) {
      const weekStart = now.subtract(i, "week").startOf("week");
      const label = `สัปดาห์ที่ ${weekStart.format("D/M")}`;
      weeks[label] = 0;
      weeksHours[label] = 0;
    }

    dataSource.forEach((record) => {
      const date = dayjs(record.created_at || record.request_date);
      const weekStart = date.startOf("week");
      const diffWeeks = now.startOf("week").diff(weekStart, "week");
      if (diffWeeks < 0 || diffWeeks > 7) return;
      const label = `สัปดาห์ที่ ${weekStart.format("D/M")}`;
      if (label in weeks) {
        weeks[label] += 1;
        weeksHours[label] +=
          record.descriptions?.reduce(
            (s: number, d: any) => s + Number(d.duration || 0),
            0,
          ) || 0;
      }
    });

    const labels = Object.keys(weeks);
    return {
      labels,
      datasets: [
        {
          label: "จำนวนคำขอ",
          data: labels.map((l) => weeks[l]),
          borderColor: token.colorPrimary,
          backgroundColor: token.colorPrimary + "20",
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          yAxisID: "y",
        },
        {
          label: "ชั่วโมงรวม",
          data: labels.map((l) => weeksHours[l]),
          borderColor: token.colorWarning,
          backgroundColor: token.colorWarning + "20",
          fill: false,
          tension: 0.4,
          borderDash: [5, 5],
          pointRadius: 4,
          yAxisID: "y1",
        },
      ],
    };
  }, [dataSource, token.colorPrimary, token.colorWarning]);

  // tab สำหรับสลับ view ใน Modal
  const [activeTab, setActiveTab] = useState<"overview" | "team">("overview");

  return (
    <Modal
      title={
        <Flex align="center" gap={12}>
          <BarChartOutlined />
          <span>แดชบอร์ดวิเคราะห์สถิติการทำงานล่วงเวลา</span>
          <Space size={4} style={{ marginLeft: 8 }}>
            {(["overview", "team"] as const).map((tab) => (
              <Tag
                key={tab}
                color={activeTab === tab ? "blue" : "default"}
                style={{ cursor: "pointer", margin: 0, fontSize: 12 }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "overview" ? "ภาพรวม" : "ทีม"}
              </Tag>
            ))}
          </Space>
        </Flex>
      }
      open={visible}
      onCancel={() => setVisible(false)}
      footer={null}
      width={1200}
      centered
    >
      <Flex vertical gap={32} style={{ paddingBlock: 32 }}>
        {/* === Team Dashboard Section === */}
        {activeTab === "team" && (
          <Flex vertical gap={24}>
            {/* Stats Row */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card
                  styles={{ body: { padding: 20 } }}
                  style={{
                    borderRadius: 16,
                    background: token.colorFillQuaternary,
                    border: `1px solid ${token.colorBorderSecondary}`,
                  }}
                >
                  <Flex align="center" gap={12}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${token.colorPrimary}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <TeamOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                    </div>
                    <Flex vertical gap={2}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        พนักงานที่ยื่น OT
                      </Typography.Text>
                      <Statistic
                        value={topOtUsers.length}
                        suffix="คน"
                        valueStyle={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}
                      />
                    </Flex>
                  </Flex>
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card
                  styles={{ body: { padding: 20 } }}
                  style={{
                    borderRadius: 16,
                    background: token.colorFillQuaternary,
                    border: `1px solid ${token.colorBorderSecondary}`,
                  }}
                >
                  <Flex align="center" gap={12}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${token.colorWarning}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ClockCircleOutlined style={{ fontSize: 20, color: token.colorWarning }} />
                    </div>
                    <Flex vertical gap={2}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        เวลารอเฉลี่ย
                      </Typography.Text>
                      <Statistic
                        value={avgWaitStats.avgDays}
                        suffix="วัน"
                        precision={1}
                        valueStyle={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}
                      />
                      {avgWaitStats.maxDays > 0 && (
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          น้อยสุด {avgWaitStats.minDays} — มากสุด {avgWaitStats.maxDays} วัน
                        </Typography.Text>
                      )}
                    </Flex>
                  </Flex>
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card
                  styles={{ body: { padding: 20 } }}
                  style={{
                    borderRadius: 16,
                    background: token.colorFillQuaternary,
                    border: `1px solid ${token.colorBorderSecondary}`,
                  }}
                >
                  <Flex align="center" gap={12}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${token.colorSuccess}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <TrophyOutlined style={{ fontSize: 20, color: token.colorSuccess }} />
                    </div>
                    <Flex vertical gap={2}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        OT มากที่สุด
                      </Typography.Text>
                      <Typography.Text strong style={{ fontSize: 16 }}>
                        {topOtUsers[0]?.name || "-"}
                      </Typography.Text>
                      {topOtUsers[0] && (
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {topOtUsers[0].totalHours.toFixed(1)} ชม.
                        </Typography.Text>
                      )}
                    </Flex>
                  </Flex>
                </Card>
              </Col>
            </Row>

            {/* Top OT Users Table */}
            <Card
              title={
                <Flex align="center" gap={8}>
                  <TrophyOutlined style={{ color: token.colorWarning }} />
                  <Typography.Text strong>อันดับพนักงาน OT สูงสุด (Top 10)</Typography.Text>
                </Flex>
              }
              variant="borderless"
              style={{
                borderRadius: token.borderRadiusLG,
                background: token.colorFillQuaternary,
              }}
            >
              <Table
                dataSource={topOtUsers}
                rowKey="uid"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "อันดับ",
                    key: "rank",
                    width: 60,
                    align: "center",
                    render: (_: any, __: any, index: number) => {
                      const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];
                      const color = medals[index] ?? token.colorTextTertiary;
                      return (
                        <Typography.Text strong style={{ color, fontSize: 14 }}>
                          {index + 1}
                        </Typography.Text>
                      );
                    },
                  },
                  {
                    title: "ชื่อพนักงาน",
                    key: "name",
                    render: (record: any) => (
                      <Flex align="center" gap={10}>
                        <Avatar size={32} style={{ background: token.colorPrimary, flexShrink: 0 }}>
                          {record.name.charAt(0)}
                        </Avatar>
                        <Flex vertical gap={0}>
                          <Typography.Text strong style={{ fontSize: 13 }}>
                            {record.name}
                          </Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            {record.employeeCode}
                          </Typography.Text>
                        </Flex>
                      </Flex>
                    ),
                  },
                  {
                    title: "คำขอ",
                    dataIndex: "requestCount",
                    key: "requestCount",
                    align: "center",
                    width: 80,
                    render: (v: number) => <Tag>{v} รายการ</Tag>,
                  },
                  {
                    title: "รออนุมัติ",
                    dataIndex: "pendingCount",
                    key: "pendingCount",
                    align: "center",
                    width: 90,
                    render: (v: number) =>
                      v > 0 ? (
                        <Tag color="gold">{v} รายการ</Tag>
                      ) : (
                        <Typography.Text type="secondary">-</Typography.Text>
                      ),
                  },
                  {
                    title: "ชั่วโมงรวม",
                    key: "totalHours",
                    width: 200,
                    render: (record: any) => (
                      <Flex vertical gap={4}>
                        <Flex justify="space-between">
                          <Typography.Text strong style={{ fontSize: 12 }}>
                            {record.totalHours.toFixed(1)} ชม.
                          </Typography.Text>
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 11 }}
                          >
                            อนุมัติ {record.approvedHours.toFixed(1)} ชม.
                          </Typography.Text>
                        </Flex>
                        <Progress
                          percent={Math.round(
                            (record.totalHours / maxUserHours) * 100,
                          )}
                          showInfo={false}
                          size={["100%", 6] as any}
                          strokeColor={
                            record.totalHours === maxUserHours
                              ? token.colorError
                              : token.colorPrimary
                          }
                          style={{ margin: 0 }}
                        />
                      </Flex>
                    ),
                  },
                ]}
              />
            </Card>

            {/* Weekly Trend Chart */}
            <Card
              title={
                <Flex align="center" gap={8}>
                  <BarChartOutlined style={{ color: token.colorInfo }} />
                  <Typography.Text strong>แนวโน้มรายสัปดาห์ (8 สัปดาห์ล่าสุด)</Typography.Text>
                </Flex>
              }
              variant="borderless"
              style={{
                borderRadius: token.borderRadiusLG,
                background: token.colorFillQuaternary,
              }}
            >
              <Flex style={{ height: 320 }}>
                <Line
                  data={weeklyTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: "index", intersect: false },
                    plugins: {
                      legend: {
                        position: "top",
                        labels: { usePointStyle: true, padding: 16 },
                      },
                    },
                    scales: {
                      y: {
                        type: "linear",
                        position: "left",
                        beginAtZero: true,
                        title: { display: true, text: "จำนวนคำขอ" },
                        grid: { color: token.colorBorderSecondary },
                      },
                      y1: {
                        type: "linear",
                        position: "right",
                        beginAtZero: true,
                        title: { display: true, text: "ชั่วโมง" },
                        grid: { drawOnChartArea: false },
                      },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </Flex>
            </Card>
          </Flex>
        )}

        {/* === Overview Section (เดิม) === */}
        {activeTab === "overview" && (
        <>
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
        </>
        )}
      </Flex>
    </Modal>
  );
};

export default AnalyticsModal;
