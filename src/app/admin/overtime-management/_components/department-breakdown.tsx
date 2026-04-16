"use client";

import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Flex,
  Progress,
  Row,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip as ChartTooltip,
} from "chart.js";
import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useAdminOvertimeStore } from "../_state/admin-overtime-store";

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

const { Text } = Typography;

interface DeptStat {
  department: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalHours: number;
  uniqueUsers: number;
}

/**
 * คอมโพเนนต์แสดงสถิติ OT แยกตามแผนก (Department Breakdown)
 * คำนวณจาก dataSource ที่โหลดมาแล้ว ไม่ต้องยิง API เพิ่ม
 */
const DepartmentBreakdown: React.FC = () => {
  const { dataSource, isLoading } = useAdminOvertimeStore();

  // รวบรวมสถิติแยกตามแผนก
  const deptStats = useMemo<DeptStat[]>(() => {
    const map = new Map<string, DeptStat>();

    for (const r of dataSource) {
      const dept =
        r.requester_department ||
        r.department ||
        r.requester_department_name ||
        "ไม่ระบุแผนก";

      if (!map.has(dept)) {
        map.set(dept, {
          department: dept,
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          totalHours: 0,
          uniqueUsers: 0,
        });
      }

      const entry = map.get(dept)!;
      entry.total += 1;
      if (r.status === "pending") entry.pending += 1;
      if (r.status === "approved" || r.status === "paid") entry.approved += 1;
      if (r.status === "rejected") entry.rejected += 1;

      const hrs = (r.descriptions || []).reduce(
        (s: number, d: any) => s + (Number(d.duration) || 0),
        0,
      );
      entry.totalHours += hrs;
    }

    // นับ unique users ต่อแผนก
    const userPerDept = new Map<string, Set<string>>();
    for (const r of dataSource) {
      const dept =
        r.requester_department ||
        r.department ||
        r.requester_department_name ||
        "ไม่ระบุแผนก";
      if (!userPerDept.has(dept)) userPerDept.set(dept, new Set());
      if (r.requester_id) userPerDept.get(dept)!.add(String(r.requester_id));
    }
    for (const [dept, users] of userPerDept) {
      const entry = map.get(dept);
      if (entry) entry.uniqueUsers = users.size;
    }

    return Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);
  }, [dataSource]);

  const maxHours = useMemo(
    () => Math.max(...deptStats.map((d) => d.totalHours), 1),
    [deptStats],
  );

  // ข้อมูล Bar chart (Top 8 แผนก)
  const chartData = useMemo(() => {
    const top8 = deptStats.slice(0, 8);
    return {
      labels: top8.map((d) => d.department),
      datasets: [
        {
          label: "อนุมัติ (ชม.)",
          data: top8.map((d) => d.approved > 0 ? d.totalHours : 0),
          backgroundColor: "rgba(82, 196, 26, 0.7)",
          borderRadius: 4,
        },
        {
          label: "รออนุมัติ (ชม.)",
          data: top8.map((d) => {
            const pendingHrs = dataSource
              .filter(
                (r) =>
                  (r.requester_department ||
                    r.department ||
                    r.requester_department_name ||
                    "ไม่ระบุแผนก") === d.department && r.status === "pending",
              )
              .reduce((s, r) => {
                return (
                  s +
                  (r.descriptions || []).reduce(
                    (ss: number, dd: any) => ss + (Number(dd.duration) || 0),
                    0,
                  )
                );
              }, 0);
            return pendingHrs;
          }),
          backgroundColor: "rgba(250, 173, 20, 0.7)",
          borderRadius: 4,
        },
      ],
    };
  }, [deptStats, dataSource]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw} ชม.`,
        },
      },
    },
    scales: {
      x: { stacked: false },
      y: {
        stacked: false,
        ticks: { callback: (v: any) => `${v} ชม.` },
      },
    },
  };

  const tableColumns = [
    {
      title: "แผนก",
      dataIndex: "department",
      key: "department",
      render: (dept: string) => (
        <Flex align="center" gap={6}>
          <TeamOutlined style={{ color: "#1677ff" }} />
          <Text strong>{dept}</Text>
        </Flex>
      ),
    },
    {
      title: "คำขอ",
      dataIndex: "total",
      key: "total",
      width: 70,
      sorter: (a: DeptStat, b: DeptStat) => a.total - b.total,
      render: (v: number) => <Text>{v}</Text>,
    },
    {
      title: "สถานะ",
      key: "status",
      width: 200,
      render: (_: any, r: DeptStat) => (
        <Flex gap={4} wrap="wrap">
          {r.pending > 0 && (
            <Tag color="gold" icon={<ClockCircleOutlined />}>
              รอ {r.pending}
            </Tag>
          )}
          {r.approved > 0 && (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              อนุมัติ {r.approved}
            </Tag>
          )}
          {r.rejected > 0 && (
            <Tag color="red" icon={<CloseCircleOutlined />}>
              ปฏิเสธ {r.rejected}
            </Tag>
          )}
        </Flex>
      ),
    },
    {
      title: "ชั่วโมง OT รวม",
      key: "hours",
      width: 160,
      sorter: (a: DeptStat, b: DeptStat) => a.totalHours - b.totalHours,
      defaultSortOrder: "descend" as const,
      render: (_: any, r: DeptStat) => (
        <Flex vertical gap={2}>
          <Text style={{ fontWeight: 600 }}>{r.totalHours.toFixed(1)} ชม.</Text>
          <Progress
            percent={Math.round((r.totalHours / maxHours) * 100)}
            showInfo={false}
            size="small"
            strokeColor="#1677ff"
          />
        </Flex>
      ),
    },
    {
      title: "พนักงาน",
      dataIndex: "uniqueUsers",
      key: "uniqueUsers",
      width: 80,
      sorter: (a: DeptStat, b: DeptStat) => a.uniqueUsers - b.uniqueUsers,
      render: (v: number) => <Tag color="blue">{v} คน</Tag>,
    },
  ];

  if (!isLoading && deptStats.length === 0) return null;

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={16}>
        <Flex align="center" gap={8}>
          <BarChartOutlined style={{ fontSize: "1rem" }} />
          <Text strong>สถิติ OT แยกตามแผนก</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ({deptStats.length} แผนก)
          </Text>
        </Flex>

        <Row gutter={[16, 16]}>
          {/* Bar Chart — Top 8 แผนก */}
          <Col xs={24} lg={14}>
            <Card
              size="small"
              styles={{ body: { padding: 12 } }}
              style={{ height: 280 }}
            >
              {deptStats.length > 0 ? (
                <Bar data={chartData} options={chartOptions} height={240} />
              ) : (
                <Flex
                  justify="center"
                  align="center"
                  style={{ height: 240 }}
                >
                  <Text type="secondary">ไม่มีข้อมูล</Text>
                </Flex>
              )}
            </Card>
          </Col>

          {/* Top 3 แผนกที่มี OT มากที่สุด */}
          <Col xs={24} lg={10}>
            <Flex vertical gap={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                แผนกที่มีชั่วโมง OT สูงสุด
              </Text>
              {deptStats.slice(0, 3).map((d, i) => (
                <Card
                  key={d.department}
                  size="small"
                  styles={{ body: { padding: 10 } }}
                >
                  <Flex justify="space-between" align="center">
                    <Flex align="center" gap={8}>
                      <Tag
                        color={i === 0 ? "gold" : i === 1 ? "silver" : "default"}
                        style={{ minWidth: 28, textAlign: "center" }}
                      >
                        {i + 1}
                      </Tag>
                      <Flex vertical gap={0}>
                        <Text style={{ fontWeight: 600, fontSize: 13 }}>
                          {d.department}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {d.uniqueUsers} คน · {d.total} คำขอ
                        </Text>
                      </Flex>
                    </Flex>
                    <Text style={{ fontWeight: 600, color: "#1677ff" }}>
                      {d.totalHours.toFixed(1)} ชม.
                    </Text>
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Col>
        </Row>

        {/* ตารางรายละเอียดทุกแผนก */}
        <Table
          dataSource={deptStats}
          columns={tableColumns}
          rowKey="department"
          size="small"
          pagination={false}
          loading={isLoading}
          scroll={{ x: 600 }}
        />
      </Flex>
    </Card>
  );
};

export default DepartmentBreakdown;
