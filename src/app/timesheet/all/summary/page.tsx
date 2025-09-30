"use client";

//* แสดงสรุปชั่วโมง Timesheet รายบุคคลในช่วงวันที่เลือก

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PermissionLayout from "@/components/layouts/permission-layout";
import DashboardLayout from "@components/layouts/backend-layout";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  AreaChartOutlined,
  CalendarOutlined,
  ClearOutlined,
  ReloadOutlined,
  TrophyOutlined,
  WarningOutlined,
  CrownFilled,
  StarFilled,
  SmileFilled,
  MehFilled,
  FrownFilled,
  FireFilled,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

type BreakdownRow = {
  date: string;
  weekday_th: string;
  hours: number;
};

type SummaryRecord = {
  admin_id: number | string;
  full_name: string;
  nickname: string | null;
  employee_code: string | null;
  position: string;
  email: string | null;
  tel: string | null;
  total_hours: number;
  required_hours: number;
  hours_gap: number;
  status_label: string;
  completion_rate: number;
  progress_text: string;
  breakdown: BreakdownRow[];
  rank: number;
};

type SummaryMetadata = {
  range: {
    start_date: string;
    end_date: string;
    label_th: string;
  };
  working_days: number;
  expected_hours_per_member: number;
  total_expected_hours_all_members: number;
  generated_at: string;
  notes?: string;
};

type ApiPayload = {
  records: SummaryRecord[];
  metadata: SummaryMetadata;
};

type ApiResponse = {
  status: number;
  message_th?: string;
  message_en?: string;
  data?: ApiPayload;
};

const POSITION_COLORS: Record<string, string> = {
  developer: "geekblue",
  tester: "purple",
};

const buildDefaultRange = (): [Dayjs, Dayjs] => {
  const monday = dayjs().startOf("week").add(1, "day");
  const friday = monday.add(4, "day");
  return [monday, friday];
};

const buildFullName = ({ full_name }: SummaryRecord) => full_name || "-";

const formatNickname = (nickname?: string | null) =>
  nickname ? `(${nickname})` : "";

const formatBreakdown = (rows: BreakdownRow[]) =>
  rows.length
    ? rows.map((item) => `${item.weekday_th} ${item.date} • ${item.hours} ชม.`)
    : ["ไม่มีข้อมูลในช่วงวันที่เลือก"];

type GradeConfig = {
  grade: "A" | "B" | "C" | "D" | "E" | "F";
  min: number;
  color: string;
  label: string;
  icon: React.ReactNode;
};

const GRADE_RULES: GradeConfig[] = [
  { grade: "A", min: 100, color: "#facc15", label: "Excellent", icon: <CrownFilled /> },
  { grade: "B", min: 90, color: "#38bdf8", label: "Great", icon: <StarFilled /> },
  { grade: "C", min: 75, color: "#34d399", label: "Good", icon: <SmileFilled /> },
  { grade: "D", min: 60, color: "#fb923c", label: "Needs Focus", icon: <MehFilled /> },
  { grade: "E", min: 40, color: "#f97316", label: "Risk", icon: <FrownFilled /> },
  { grade: "F", min: 0, color: "#f87171", label: "Critical", icon: <FireFilled /> },
];

const resolveGrade = (completionRate: number) => {
  return GRADE_RULES.find((rule) => completionRate >= rule.min) ?? GRADE_RULES.at(-1)!;
};

export default function Page() {
  const [keyword, setKeyword] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(buildDefaultRange);
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [metadata, setMetadata] = useState<SummaryMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    //* fetch summary for the selected date range
    try {
      setLoading(true);
      const [start, end] = dateRange;
      const response = await fetch("/api/v1/timesheet/entry/check/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: start.format("YYYY-MM-DD"),
          end_date: end.format("YYYY-MM-DD"),
        }),
      });

      if (!response.ok) {
        const messageBody = await response.json().catch(() => ({}));
        throw new Error(
          messageBody?.message_th ||
            messageBody?.message_en ||
            "โหลดข้อมูลล้มเหลว"
        );
      }

      const body: ApiResponse = await response.json();
      setRecords(body.data?.records ?? []);
      setMetadata(body.data?.metadata ?? null);
    } catch (error: any) {
      console.error("[Timesheet][summary]", error);
      message.error(error?.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRangeChange = (range: null | (Dayjs | null)[]) => {
    if (range && range[0] && range[1]) {
      setDateRange([range[0], range[1]] as [Dayjs, Dayjs]);
    }
  };

  const filteredRecords = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) =>
      [record.full_name, record.nickname, record.position, record.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [records, keyword]);

  const summaryCards = useMemo(() => {
    const totalMembers = records.length;
    const totalHours = records.reduce(
      (sum, current) => sum + current.total_hours,
      0
    );
    const totalExpected = metadata?.total_expected_hours_all_members ?? 0;
    const avgCompletion = totalMembers
      ? Number(
          (
            records.reduce((sum, current) => sum + current.completion_rate, 0) /
            totalMembers
          ).toFixed(2)
        )
      : 0;

    return [
      {
        title: "ชั่วโมงรวมที่ทำได้",
        value: totalHours,
        suffix: "ชม.",
        icon: <AreaChartOutlined />,
        color: "#1677ff",
      },
      {
        title: "ชั่วโมงที่คาดหวังทั้งหมด",
        value: totalExpected,
        suffix: "ชม.",
        icon: <CalendarOutlined />,
        color: "#faad14",
      },
      {
        title: "ค่าเฉลี่ยการทำงาน (%)",
        value: avgCompletion,
        suffix: "%",
        icon: <TrophyOutlined />,
        color: avgCompletion >= 100 ? "#52c41a" : "#d4380d",
      },
    ];
  }, [records, metadata]);

  const columns: ColumnsType<SummaryRecord> = useMemo(
    () => [
      {
        title: "อันดับ",
        dataIndex: "rank",
        width: 80,
        align: "center",
        render: (rank: number) => (
          <Typography.Text strong>{rank}</Typography.Text>
        ),
      },
      {
        title: "เกรด",
        key: "grade",
        align: "center",
        width: 120,
        render: (_value, record) => {
          const grade = resolveGrade(record.completion_rate);
          return (
            <Tag
              icon={grade.icon}
              color={grade.color}
              style={{
                minWidth: 72,
                display: "inline-flex",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              {grade.grade}
            </Tag>
          );
        },
      },
      {
        title: "ชื่อ - สกุล",
        key: "name",
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>
              {buildFullName(record)} {formatNickname(record.nickname)}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.employee_code || "-"}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: "ตำแหน่ง",
        dataIndex: "position",
        key: "position",
        render: (position: string) => (
          <Tag color={POSITION_COLORS[position.toLowerCase()] ?? "blue"}>
            {position}
          </Tag>
        ),
      },
      {
        title: "ความคืบหน้า",
        dataIndex: "progress_text",
        key: "progress_text",
        render: (_value, record) => (
          <Space direction="vertical" size={4} style={{ width: 220 }}>
            <Progress
              percent={Number(record.completion_rate.toFixed(2))}
              status={record.completion_rate >= 100 ? "success" : "active"}
            />
            <Typography.Text type="secondary">
              {record.progress_text}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: "สถานะ",
        dataIndex: "status_label",
        key: "status_label",
        render: (status: string) => (
          <Tag color={status.includes("ขาด") ? "volcano" : "green"}>
            {status}
          </Tag>
        ),
      },
      {
        title: "อีเมล",
        dataIndex: "email",
        key: "email",
        render: (value?: string | null) => value || "-",
      },
      {
        title: "เบอร์มือถือ",
        dataIndex: "tel",
        key: "tel",
        render: (value?: string | null) => value || "-",
      },
    ],
    []
  );

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space
            direction="horizontal"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Typography.Title level={4} style={{ margin: 0 }}>
              สรุปชั่วโมง Timesheet ตามช่วงวันที่เลือก
            </Typography.Title>
            <Space>
              <RangePicker
                allowClear={false}
                value={dateRange}
                onChange={handleRangeChange}
                format="DD/MM/YYYY"
              />
              <Button
                icon={<ReloadOutlined />}
                type="primary"
                onClick={loadData}
                loading={loading}
              >
                อัปเดตข้อมูล
              </Button>
            </Space>
          </Space>

          {metadata && (
            <Typography.Text type="secondary">
              ช่วงวันที่ประเมิน: {metadata.range.label_th} | วันทำงาน{" "}
              {metadata.working_days} วัน
            </Typography.Text>
          )}

          <Row gutter={[16, 16]}>
            {summaryCards.map((item) => (
              <Col key={item.title} xs={24} md={8}>
                <Card
                  size="small"
                  variant="borderless"
                  style={{ borderRadius: 12 }}
                >
                  <Space align="center">
                    <Tag color={item.color} style={{ padding: "6px 12px" }}>
                      {item.icon}
                    </Tag>
                    <Statistic
                      title={item.title}
                      value={item.value}
                      suffix={item.suffix}
                      valueStyle={{ color: item.color }}
                    />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Card title="ตารางสรุปชั่วโมงรายบุคคล">
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Input.Search
                allowClear
                placeholder="ค้นหาชื่อ นามสกุล อีเมล หรือชื่อเล่น"
                enterButton
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onSearch={setKeyword}
              />
              <Button
                icon={<ClearOutlined />}
                onClick={() => setKeyword("")}
                style={{ alignSelf: "flex-start" }}
              >
                ล้างการค้นหา
              </Button>
              <Table<SummaryRecord>
                bordered
                rowKey={(record) => String(record.admin_id)}
                columns={columns}
                dataSource={filteredRecords}
                loading={loading}
                expandable={{
                  expandedRowRender: (record) => (
                    <Space direction="vertical" size={6}>
                      {formatBreakdown(record.breakdown).map((text, idx) => (
                        <Typography.Text key={idx}>{text}</Typography.Text>
                      ))}
                    </Space>
                  ),
                  rowExpandable: (record) => record.breakdown.length > 0,
                }}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                  showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                }}
              />
            </Space>
          </Card>

          {metadata?.notes && (
            <Typography.Text type="secondary">
              หมายเหตุ: {metadata.notes}
            </Typography.Text>
          )}
        </Space>
      </DashboardLayout>
    </PermissionLayout>
  );
}
