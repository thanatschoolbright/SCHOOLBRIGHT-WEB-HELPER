"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Flex,
  Progress,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
} from "chart.js";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { useAdminOvertimeStore } from "../_state/admin-overtime-store";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Legend,
);

const { Text } = Typography;

// เป้าหมาย SLA: อนุมัติภายใน N วัน
const SLA_TARGET_DAYS = 2;

interface SlaRecord {
  id: string | number;
  requesterName: string;
  employeeCode: string;
  requestDate: string;
  resolvedDate: string | null;
  waitDays: number | null;
  status: string;
  metSla: boolean | null; // null = ยังรออยู่
}

interface WeeklyBucket {
  week: string;
  avgWaitDays: number;
  countResolved: number;
  slaMetRate: number; // 0-100
}

/**
 * แดชบอร์ดวัด Approval SLA (C2)
 * วัดเวลาเฉลี่ยที่ใช้อนุมัติ เทียบกับ target (SLA_TARGET_DAYS วัน)
 * คำนวณจาก dataSource ที่มีอยู่ ไม่ยิง API เพิ่ม
 */
const ApprovalSlaDashboard: React.FC = () => {
  const { dataSource, isLoading } = useAdminOvertimeStore();

  // สร้าง record SLA ต่อ OT แต่ละรายการ
  const slaRecords = useMemo<SlaRecord[]>(() => {
    return dataSource.map((r) => {
      const created = r.created_at || r.request_date;
      const resolved =
        r.status === "approved" || r.status === "rejected" || r.status === "paid"
          ? r.updated_at
          : null;

      const waitDays =
        created && resolved
          ? dayjs(resolved).diff(dayjs(created), "day", true)
          : created
            ? dayjs().diff(dayjs(created), "day", true)
            : null;

      const firstName = r.requester_firstname_th || r.requester_name || "";
      const lastName = r.requester_lastname_th || "";

      return {
        id: r.id,
        requesterName: `${firstName} ${lastName}`.trim() || `User #${r.requester_id}`,
        employeeCode: r.requester_employee_code || "",
        requestDate: created || "",
        resolvedDate: resolved || null,
        waitDays: waitDays !== null ? Math.max(0, waitDays) : null,
        status: r.status,
        metSla:
          resolved && waitDays !== null
            ? waitDays <= SLA_TARGET_DAYS
            : null,
      };
    });
  }, [dataSource]);

  // สรุปตัวเลข SLA
  const summary = useMemo(() => {
    const resolved = slaRecords.filter((r) => r.resolvedDate);
    const pending = slaRecords.filter((r) => !r.resolvedDate);

    const waitDaysResolved = resolved
      .map((r) => r.waitDays)
      .filter((d): d is number => d !== null);

    const avgWait =
      waitDaysResolved.length > 0
        ? waitDaysResolved.reduce((s, d) => s + d, 0) / waitDaysResolved.length
        : 0;
    const maxWait = waitDaysResolved.length > 0 ? Math.max(...waitDaysResolved) : 0;
    const minWait = waitDaysResolved.length > 0 ? Math.min(...waitDaysResolved) : 0;

    const metSlaCount = resolved.filter((r) => r.metSla === true).length;
    const slaMetRate =
      resolved.length > 0
        ? Math.round((metSlaCount / resolved.length) * 100)
        : 0;

    const overdueCount = pending.filter(
      (r) => r.waitDays !== null && r.waitDays > SLA_TARGET_DAYS,
    ).length;

    return {
      avgWait,
      maxWait,
      minWait,
      slaMetRate,
      resolvedCount: resolved.length,
      pendingCount: pending.length,
      overdueCount,
    };
  }, [slaRecords]);

  // Trend 8 สัปดาห์ล่าสุด
  const weeklyTrend = useMemo<WeeklyBucket[]>(() => {
    const buckets: WeeklyBucket[] = Array.from({ length: 8 }, (_, i) => {
      const weekStart = dayjs()
        .startOf("week")
        .subtract(7 - i, "week");
      return {
        week: weekStart.format("DD/MM"),
        avgWaitDays: 0,
        countResolved: 0,
        slaMetRate: 0,
      };
    });

    const resolved = slaRecords.filter(
      (r) => r.resolvedDate && r.waitDays !== null,
    );

    for (const r of resolved) {
      const resolvedDay = dayjs(r.resolvedDate!);
      const bucketIdx = buckets.findIndex((_b, i) => {
        const bStart = dayjs()
          .startOf("week")
          .subtract(7 - i, "week");
        const bEnd = bStart.add(6, "day").endOf("day");
        return resolvedDay.isAfter(bStart) && resolvedDay.isBefore(bEnd);
      });
      if (bucketIdx < 0) continue;
      const b = buckets[bucketIdx];
      if (!b) continue;
      b.countResolved += 1;
      b.avgWaitDays =
        (b.avgWaitDays * (b.countResolved - 1) + (r.waitDays ?? 0)) /
        b.countResolved;
    }

    return buckets.map((bucket, idx) => {
      if (bucket.countResolved === 0) return bucket;
      const bStart = dayjs()
        .startOf("week")
        .subtract(7 - idx, "week");
      const bEnd = bStart.add(6, "day").endOf("day");
      const resolvedInWeek = resolved.filter((r) => {
        const rd = dayjs(r.resolvedDate!);
        return rd.isAfter(bStart) && rd.isBefore(bEnd);
      });
      const metCount = resolvedInWeek.filter((r) => r.metSla).length;
      return {
        ...bucket,
        avgWaitDays: Math.round(bucket.avgWaitDays * 10) / 10,
        slaMetRate:
          resolvedInWeek.length > 0
            ? Math.round((metCount / resolvedInWeek.length) * 100)
            : 0,
      };
    });
  }, [slaRecords]);

  const chartData = useMemo(
    () => ({
      labels: weeklyTrend.map((w) => w.week),
      datasets: [
        {
          label: "เวลาเฉลี่ย (วัน)",
          data: weeklyTrend.map((w) => w.avgWaitDays),
          borderColor: "#1677ff",
          backgroundColor: "rgba(22, 119, 255, 0.1)",
          tension: 0.3,
          fill: true,
          yAxisID: "yDays",
          pointRadius: 4,
        },
        {
          label: "SLA ผ่าน (%)",
          data: weeklyTrend.map((w) => w.slaMetRate),
          borderColor: "#52c41a",
          backgroundColor: "rgba(82, 196, 26, 0.1)",
          tension: 0.3,
          fill: false,
          yAxisID: "yRate",
          pointRadius: 4,
          borderDash: [4, 3],
        },
      ],
    }),
    [weeklyTrend],
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            if (ctx.dataset.yAxisID === "yDays")
              return `เวลาเฉลี่ย: ${ctx.raw} วัน`;
            return `SLA ผ่าน: ${ctx.raw}%`;
          },
        },
      },
    },
    scales: {
      yDays: {
        type: "linear" as const,
        position: "left" as const,
        ticks: { callback: (v: any) => `${v} วัน` },
        suggestedMin: 0,
        suggestedMax: Math.max(SLA_TARGET_DAYS + 2, 5),
      },
      yRate: {
        type: "linear" as const,
        position: "right" as const,
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
        ticks: { callback: (v: any) => `${v}%` },
      },
    },
  };

  // ตารางรายการที่ยังรอนาน (เกิน SLA target)
  const overdueList = useMemo(
    () =>
      slaRecords
        .filter(
          (r) =>
            r.status === "pending" &&
            r.waitDays !== null &&
            r.waitDays > SLA_TARGET_DAYS,
        )
        .sort((a, b) => (b.waitDays ?? 0) - (a.waitDays ?? 0)),
    [slaRecords],
  );

  const overdueColumns = [
    {
      title: "รหัส OT",
      dataIndex: "id",
      width: 80,
      render: (id: any) => (
        <Text type="secondary" style={{ fontWeight: 600 }}>
          #{id}
        </Text>
      ),
    },
    {
      title: "พนักงาน",
      key: "name",
      render: (_: any, r: SlaRecord) => (
        <Flex vertical gap={0}>
          <Text style={{ fontWeight: 600 }}>{r.requesterName}</Text>
          {r.employeeCode && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {r.employeeCode}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      title: "วันที่ขอ",
      dataIndex: "requestDate",
      width: 110,
      render: (d: string) => (d ? dayjs(d).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "รอมาแล้ว",
      dataIndex: "waitDays",
      width: 100,
      sorter: (a: SlaRecord, b: SlaRecord) => (a.waitDays ?? 0) - (b.waitDays ?? 0),
      defaultSortOrder: "descend" as const,
      render: (d: number) => (
        <Tag color={d > SLA_TARGET_DAYS * 2 ? "red" : "orange"} icon={<WarningOutlined />}>
          {d.toFixed(0)} วัน
        </Tag>
      ),
    },
  ];

  if (!isLoading && dataSource.length === 0) return null;

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={16}>
        {/* Header */}
        <Flex align="center" gap={8}>
          <ThunderboltOutlined style={{ fontSize: "1rem" }} />
          <Text strong>Approval SLA Dashboard</Text>
          <Tag color="blue">เป้าหมาย: อนุมัติภายใน {SLA_TARGET_DAYS} วัน</Tag>
        </Flex>

        {/* Summary Cards */}
        <Row gutter={[16, 12]}>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Statistic
                title="เวลาเฉลี่ย"
                value={summary.avgWait.toFixed(1)}
                suffix="วัน"
                valueStyle={{
                  color:
                    summary.avgWait <= SLA_TARGET_DAYS ? "#52c41a" : "#ff4d4f",
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Statistic
                title="SLA ผ่าน"
                value={summary.slaMetRate}
                suffix="%"
                valueStyle={{
                  color:
                    summary.slaMetRate >= 80 ? "#52c41a" : summary.slaMetRate >= 60 ? "#fa8c16" : "#ff4d4f",
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Statistic
                title="รอนานสุด"
                value={summary.maxWait.toFixed(1)}
                suffix="วัน"
                valueStyle={{ fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Statistic
                title="รออนุมัติอยู่"
                value={summary.pendingCount}
                suffix="รายการ"
                valueStyle={{
                  color: summary.pendingCount > 0 ? "#fa8c16" : "#52c41a",
                  fontWeight: 600,
                }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Statistic
                title="เกิน SLA"
                value={summary.overdueCount}
                suffix="รายการ"
                valueStyle={{
                  color: summary.overdueCount > 0 ? "#ff4d4f" : "#52c41a",
                  fontWeight: 600,
                }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Statistic
                title="อนุมัติแล้ว"
                value={summary.resolvedCount}
                suffix="รายการ"
                valueStyle={{ fontWeight: 600, color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* SLA Rate Progress */}
        <Card size="small" styles={{ body: { padding: 12 } }}>
          <Flex align="center" gap={16} wrap="wrap">
            <Flex align="center" gap={6}>
              <TrophyOutlined style={{ color: "#faad14" }} />
              <Text strong>อัตรา SLA ผ่านโดยรวม</Text>
            </Flex>
            <Flex flex={1} align="center" gap={8} style={{ minWidth: 200 }}>
              <Progress
                percent={summary.slaMetRate}
                strokeColor={
                  summary.slaMetRate >= 80
                    ? "#52c41a"
                    : summary.slaMetRate >= 60
                      ? "#fa8c16"
                      : "#ff4d4f"
                }
                style={{ flex: 1 }}
              />
              <Tag
                color={
                  summary.slaMetRate >= 80
                    ? "green"
                    : summary.slaMetRate >= 60
                      ? "orange"
                      : "red"
                }
              >
                {summary.slaMetRate >= 80
                  ? "ดี"
                  : summary.slaMetRate >= 60
                    ? "พอใช้"
                    : "ต้องปรับปรุง"}
              </Tag>
            </Flex>
          </Flex>
        </Card>

        {/* Trend Chart */}
        <Card
          size="small"
          styles={{ body: { padding: 12 } }}
          style={{ height: 240 }}
          title={
            <Text style={{ fontSize: 12 }}>แนวโน้ม 8 สัปดาห์ล่าสุด</Text>
          }
        >
          <Line data={chartData} options={chartOptions} height={180} />
        </Card>

        {/* ตารางรายการเกิน SLA */}
        {overdueList.length > 0 && (
          <>
            <Flex align="center" gap={8}>
              <UnorderedListOutlined style={{ fontSize: "1rem" }} />
              <Text strong style={{ color: "#ff4d4f" }}>
                รายการรออนุมัติเกิน {SLA_TARGET_DAYS} วัน
              </Text>
              <Tag color="red" icon={<CloseCircleOutlined />}>
                {overdueList.length} รายการ
              </Tag>
            </Flex>
            <Table
              dataSource={overdueList}
              columns={overdueColumns}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 5, showSizeChanger: false }}
              scroll={{ x: 480 }}
            />
          </>
        )}
      </Flex>
    </Card>
  );
};

export default ApprovalSlaDashboard;
