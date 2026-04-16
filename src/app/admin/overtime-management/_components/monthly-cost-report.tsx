"use client";

import {
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Flex,
  InputNumber,
  Row,
  Segmented,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
} from "chart.js";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useAdminOvertimeStore } from "../_state/admin-overtime-store";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend,
);

const { Text } = Typography;

// อัตรา OT ตามกฎหมายแรงงานไทย: (เงินเดือน / 30 / 8) × 1.5 × ชั่วโมง
const calcOtCost = (monthlyAvgSalary: number, hours: number): number => {
  if (!monthlyAvgSalary || monthlyAvgSalary <= 0) return 0;
  return (monthlyAvgSalary / 30 / 8) * 1.5 * hours;
};

const formatBaht = (value: number): string =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

type ViewMode = "monthly" | "person";

interface MonthlyStat {
  month: string; // "YYYY-MM"
  label: string; // "ม.ค. 68"
  approvedHours: number;
  approvedCount: number;
  estimatedCost: number;
  uniqueUsers: number;
}

interface PersonStat {
  userId: string;
  name: string;
  employeeCode: string;
  approvedHours: number;
  requestCount: number;
  estimatedCost: number;
}

/**
 * รายงานค่าใช้จ่าย OT รายเดือน / รายคน (C1)
 * คำนวณจาก dataSource ที่มีอยู่ ไม่ยิง API เพิ่ม
 * ใช้สูตร: (เงินเดือนเฉลี่ย / 30 / 8) × 1.5 × ชั่วโมง OT
 */
const MonthlyCostReport: React.FC = () => {
  const { dataSource, isLoading } = useAdminOvertimeStore();

  // เงินเดือนเฉลี่ยที่ admin ใส่เพื่อประมาณ (ค่า default ตัวอย่าง)
  const [avgSalary, setAvgSalary] = useState<number | null>(30000);
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");

  // กรองเฉพาะ approved + paid
  const paidRecords = useMemo(
    () =>
      dataSource.filter(
        (r) => r.status === "approved" || r.status === "paid",
      ),
    [dataSource],
  );

  // สถิติรายเดือน (12 เดือนล่าสุด)
  const monthlyStats = useMemo<MonthlyStat[]>(() => {
    const map = new Map<string, MonthlyStat>();

    for (const r of paidRecords) {
      const d = r.request_date || r.created_at;
      if (!d) continue;
      const m = dayjs(d).format("YYYY-MM");
      const label = dayjs(d).locale("th").format("MMM BB");

      if (!map.has(m)) {
        map.set(m, {
          month: m,
          label,
          approvedHours: 0,
          approvedCount: 0,
          estimatedCost: 0,
          uniqueUsers: 0,
        });
      }

      const entry = map.get(m)!;
      const hrs = (r.descriptions || []).reduce(
        (s: number, d: any) => s + (Number(d.duration) || 0),
        0,
      );
      entry.approvedHours += hrs;
      entry.approvedCount += 1;
    }

    // คำนวณต้นทุนและ unique users
    const userPerMonth = new Map<string, Set<string>>();
    for (const r of paidRecords) {
      const d = r.request_date || r.created_at;
      if (!d) continue;
      const m = dayjs(d).format("YYYY-MM");
      if (!userPerMonth.has(m)) userPerMonth.set(m, new Set());
      if (r.requester_id)
        userPerMonth.get(m)!.add(String(r.requester_id));
    }

    const salary = avgSalary ?? 0;
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([m, stat]) => ({
        ...stat,
        estimatedCost: calcOtCost(salary, stat.approvedHours),
        uniqueUsers: userPerMonth.get(m)?.size ?? 0,
      }));
  }, [paidRecords, avgSalary]);

  // สถิติรายคน
  const personStats = useMemo<PersonStat[]>(() => {
    const map = new Map<string, PersonStat>();
    const salary = avgSalary ?? 0;

    for (const r of paidRecords) {
      const uid = String(r.requester_id || "unknown");
      if (!map.has(uid)) {
        const firstName =
          r.requester_firstname_th || r.requester_name || "";
        const lastName = r.requester_lastname_th || "";
        map.set(uid, {
          userId: uid,
          name: `${firstName} ${lastName}`.trim() || `User #${uid}`,
          employeeCode: r.requester_employee_code || "",
          approvedHours: 0,
          requestCount: 0,
          estimatedCost: 0,
        });
      }

      const entry = map.get(uid)!;
      const hrs = (r.descriptions || []).reduce(
        (s: number, d: any) => s + (Number(d.duration) || 0),
        0,
      );
      entry.approvedHours += hrs;
      entry.requestCount += 1;
      entry.estimatedCost = calcOtCost(salary, entry.approvedHours);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.estimatedCost - a.estimatedCost,
    );
  }, [paidRecords, avgSalary]);

  // สรุปรวม
  const totalSummary = useMemo(() => {
    const totalHours = monthlyStats.reduce(
      (s, m) => s + m.approvedHours,
      0,
    );
    const totalCost = monthlyStats.reduce(
      (s, m) => s + m.estimatedCost,
      0,
    );
    const avgPerMonth =
      monthlyStats.length > 0 ? totalCost / monthlyStats.length : 0;
    return { totalHours, totalCost, avgPerMonth };
  }, [monthlyStats]);

  // Chart data
  const chartData = useMemo(() => ({
    labels: monthlyStats.map((m) => m.label),
    datasets: [
      {
        label: "ค่าใช้จ่าย OT (บาท)",
        data: monthlyStats.map((m) => Math.round(m.estimatedCost)),
        backgroundColor: "rgba(22, 119, 255, 0.7)",
        borderRadius: 4,
        yAxisID: "yCost",
      },
      {
        label: "ชั่วโมง OT",
        data: monthlyStats.map((m) => m.approvedHours),
        backgroundColor: "rgba(82, 196, 26, 0.5)",
        borderRadius: 4,
        yAxisID: "yHours",
      },
    ],
  }), [monthlyStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            if (ctx.dataset.yAxisID === "yCost")
              return `ค่าใช้จ่าย: ${formatBaht(ctx.raw)} บาท`;
            return `ชั่วโมง: ${ctx.raw} ชม.`;
          },
        },
      },
    },
    scales: {
      yCost: {
        type: "linear" as const,
        position: "left" as const,
        ticks: { callback: (v: any) => `${formatBaht(v)}฿` },
      },
      yHours: {
        type: "linear" as const,
        position: "right" as const,
        grid: { drawOnChartArea: false },
        ticks: { callback: (v: any) => `${v} ชม.` },
      },
    },
  };

  const monthlyColumns = [
    {
      title: "เดือน",
      dataIndex: "label",
      key: "label",
      render: (v: string) => (
        <Flex align="center" gap={6}>
          <CalendarOutlined style={{ color: "#1677ff" }} />
          <Text strong>{v}</Text>
        </Flex>
      ),
    },
    {
      title: "คำขอ",
      dataIndex: "approvedCount",
      key: "approvedCount",
      width: 70,
      sorter: (a: MonthlyStat, b: MonthlyStat) =>
        a.approvedCount - b.approvedCount,
      render: (v: number) => <Tag>{v} รายการ</Tag>,
    },
    {
      title: "พนักงาน",
      dataIndex: "uniqueUsers",
      key: "uniqueUsers",
      width: 80,
      render: (v: number) => (
        <Flex align="center" gap={4}>
          <TeamOutlined />
          <Text>{v} คน</Text>
        </Flex>
      ),
    },
    {
      title: "ชั่วโมง OT รวม",
      dataIndex: "approvedHours",
      key: "approvedHours",
      width: 110,
      sorter: (a: MonthlyStat, b: MonthlyStat) =>
        a.approvedHours - b.approvedHours,
      render: (v: number) => <Tag color="blue">{v.toFixed(1)} ชม.</Tag>,
    },
    {
      title: "ค่าใช้จ่ายโดยประมาณ",
      dataIndex: "estimatedCost",
      key: "estimatedCost",
      width: 160,
      sorter: (a: MonthlyStat, b: MonthlyStat) =>
        a.estimatedCost - b.estimatedCost,
      defaultSortOrder: "descend" as const,
      render: (v: number) => (
        <Text style={{ fontWeight: 600, color: v > 0 ? "#1677ff" : "#8c8c8c" }}>
          {v > 0 ? `${formatBaht(v)} ฿` : "—"}
        </Text>
      ),
    },
  ];

  const personColumns = [
    {
      title: "ลำดับ",
      key: "rank",
      width: 55,
      render: (_: any, __: any, i: number) => (
        <Tag color={i === 0 ? "gold" : i === 1 ? "default" : i === 2 ? "orange" : "default"}>
          {i + 1}
        </Tag>
      ),
    },
    {
      title: "พนักงาน",
      key: "name",
      render: (_: any, r: PersonStat) => (
        <Flex vertical gap={0}>
          <Text style={{ fontWeight: 600 }}>{r.name}</Text>
          {r.employeeCode && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {r.employeeCode}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      title: "คำขอ",
      dataIndex: "requestCount",
      width: 70,
      render: (v: number) => <Tag>{v} รายการ</Tag>,
    },
    {
      title: "ชั่วโมง OT",
      dataIndex: "approvedHours",
      width: 100,
      sorter: (a: PersonStat, b: PersonStat) =>
        a.approvedHours - b.approvedHours,
      render: (v: number) => <Tag color="blue">{v.toFixed(1)} ชม.</Tag>,
    },
    {
      title: "ค่าใช้จ่ายโดยประมาณ",
      dataIndex: "estimatedCost",
      width: 160,
      sorter: (a: PersonStat, b: PersonStat) =>
        a.estimatedCost - b.estimatedCost,
      defaultSortOrder: "descend" as const,
      render: (v: number) => (
        <Text style={{ fontWeight: 600, color: v > 0 ? "#1677ff" : "#8c8c8c" }}>
          {v > 0 ? `${formatBaht(v)} ฿` : "—"}
        </Text>
      ),
    },
  ];

  if (!isLoading && paidRecords.length === 0) return null;

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex vertical gap={16}>
        {/* Header + ตั้งค่าเงินเดือนเฉลี่ย */}
        <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
          <Flex align="center" gap={8}>
            <DollarOutlined style={{ fontSize: "1rem" }} />
            <Text strong>รายงานค่าใช้จ่าย OT โดยประมาณ</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              (สูตร: เงินเดือน / 30 / 8 × 1.5 × ชม.)
            </Text>
          </Flex>
          <Flex align="center" gap={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              เงินเดือนเฉลี่ย (บาท/เดือน):
            </Text>
            <Tooltip title="ใส่เงินเดือนเฉลี่ยเพื่อประมาณค่าใช้จ่าย OT — ไม่บันทึกลงระบบ">
              <InputNumber
                value={avgSalary}
                onChange={(v) => setAvgSalary(v)}
                min={0}
                max={500000}
                step={1000}
                formatter={(v) =>
                  v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
                }
                parser={(v) => Number(String(v).replace(/,/g, "")) as any}
                style={{ width: 140 }}
                size="small"
              />
            </Tooltip>
          </Flex>
        </Flex>

        {/* Summary Cards */}
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={8}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Statistic
                title="ชั่วโมง OT รวม (อนุมัติแล้ว)"
                value={totalSummary.totalHours.toFixed(1)}
                suffix="ชม."
                valueStyle={{ color: "#1677ff", fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Statistic
                title="ค่าใช้จ่าย OT รวม"
                value={
                  avgSalary
                    ? `${formatBaht(totalSummary.totalCost)} ฿`
                    : "ระบุเงินเดือนก่อน"
                }
                valueStyle={{
                  color: avgSalary ? "#52c41a" : "#8c8c8c",
                  fontWeight: 600,
                  fontSize: avgSalary ? 20 : 14,
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Statistic
                title="ค่าเฉลี่ยต่อเดือน"
                value={
                  avgSalary && monthlyStats.length > 0
                    ? `${formatBaht(totalSummary.avgPerMonth)} ฿`
                    : "—"
                }
                valueStyle={{ fontWeight: 600 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Bar Chart */}
        {monthlyStats.length > 0 && (
          <Card size="small" styles={{ body: { padding: 12 } }} style={{ height: 260 }}>
            <Bar data={chartData} options={chartOptions} height={220} />
          </Card>
        )}

        {/* Tab สลับมุมมอง */}
        <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
          <Flex align="center" gap={8}>
            <UnorderedListOutlined style={{ fontSize: "1rem" }} />
            <Text strong>
              {viewMode === "monthly" ? "รายละเอียดรายเดือน" : "รายละเอียดรายคน"}
            </Text>
          </Flex>
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
            options={[
              { label: "รายเดือน", value: "monthly" },
              { label: "รายคน", value: "person" },
            ]}
            size="small"
          />
        </Flex>

        {/* ตารางรายเดือน */}
        {viewMode === "monthly" && (
          <Table
            dataSource={monthlyStats}
            columns={monthlyColumns}
            rowKey="month"
            size="small"
            pagination={false}
            loading={isLoading}
            scroll={{ x: 560 }}
          />
        )}

        {/* ตารางรายคน */}
        {viewMode === "person" && (
          <Table
            dataSource={personStats}
            columns={personColumns}
            rowKey="userId"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            loading={isLoading}
            scroll={{ x: 560 }}
          />
        )}

        <Text type="secondary" style={{ fontSize: 11 }}>
          ตัวเลขเป็นการประมาณเท่านั้น — ใช้เงินเดือนเฉลี่ยที่ระบุ ไม่บันทึกลงฐานข้อมูล
        </Text>
      </Flex>
    </Card>
  );
};

export default MonthlyCostReport;
