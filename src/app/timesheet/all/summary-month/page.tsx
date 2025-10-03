"use client";

//* แสดงสรุปชั่วโมง Timesheet รายบุคคลในช่วงวันที่เลือก

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PermissionLayout from "@/components/layouts/permission-layout";
import DashboardLayout from "@components/layouts/backend-layout";
import axios from "axios";
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
  Badge,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  AreaChartOutlined,
  CalendarOutlined,
  ClearOutlined,
  ReloadOutlined,
  TrophyOutlined,
  CrownFilled,
  StarFilled,
  SmileFilled,
  MehFilled,
  FrownFilled,
  FireFilled,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

type SummaryRecord = {
  admin_id: number | string;
  full_name: string;
  nickname: string | null;
  employee_code: string | null;
  position: string;
  email: string | null;
  tel: string | null;
  total_hours: number;
  expected_hours: number;
  completion_rate: number;
  rank: string;
  rank_description: string;
  order: number;
};

type SummaryMetadata = {
  range: {
    start_date: string;
    end_date: string;
    label_th: string;
  };
  working_days: number;
  expected_hours_per_member: number;
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

type GradeConfig = {
  grade: string;
  label: string;
  color: string;
  icon: React.ReactNode;
};

const GRADE_RULES: Record<string, GradeConfig> = {
  A: {
    grade: "A",
    label: "Excellent",
    color: "#facc15",
    icon: <CrownFilled />,
  },
  B: {
    grade: "B",
    label: "Great",
    color: "#38bdf8",
    icon: <StarFilled />,
  },
  C: {
    grade: "C",
    label: "Good",
    color: "#34d399",
    icon: <SmileFilled />,
  },
  D: {
    grade: "D",
    label: "Needs Focus",
    color: "#fb923c",
    icon: <MehFilled />,
  },
  E: {
    grade: "E",
    label: "Risk",
    color: "#f97316",
    icon: <FrownFilled />,
  },
  F: {
    grade: "F",
    label: "Critical",
    color: "#f87171",
    icon: <FireFilled />,
  },
};

//* การทำงาน : กำหนดค่าเริ่มต้นเป็นวันแรกและวันสุดท้ายของเดือนปัจจุบัน
const buildDefaultRange = (): [Dayjs, Dayjs] => {
  const start = dayjs().startOf("month");
  const end = dayjs().endOf("month");
  return [start, end];
};

const buildFullName = ({ full_name }: SummaryRecord) => full_name || "-";

const formatNickname = (nickname?: string | null) =>
  nickname ? `(${nickname})` : "";

//* การทำงาน : แสดงตำแหน่งเป็น Badge แบบ stable เพื่อลด Warning ของ CSS-in-JS เวลา Table re-render
const PositionBadge: React.FC<{ position?: string | null }> = React.memo(
  ({ position }) => {
    return <Badge status="processing" text={position || "-"} />;
  }
);
PositionBadge.displayName = "PositionBadge";

//* การทำงาน : แสดงเกรดเป็น Tag อิงจาก GRADE_RULES แบบ stable เพื่อลดการสร้าง style ซ้ำ ๆ
const GradeTag: React.FC<{ rank: string; description?: string | null }> =
  React.memo(({ rank, description }) => {
    const grade = GRADE_RULES[rank] ?? {
      grade: rank,
      label: description ?? rank,
      color: "default",
      icon: null,
    };
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
        title={grade.label}
      >
        {grade.grade}
      </Tag>
    );
  });
GradeTag.displayName = "GradeTag";

export default function Page() {
  const [keyword, setKeyword] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(buildDefaultRange);
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [metadata, setMetadata] = useState<SummaryMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  //* การทำงาน : เมื่อผู้ใช้เลือกเดือน จะตั้งค่า dateRange เป็นวันแรก-วันสุดท้ายของเดือนนั้น
  const handleMonthChange = (value: Dayjs | null) => {
    if (value) {
      setDateRange([value.startOf("month"), value.endOf("month")] as [
        Dayjs,
        Dayjs
      ]);
    }
  };

  const loadData = useCallback(async () => {
    //* fetch summary for the selected date range
    try {
      setLoading(true);
      const [start, end] = dateRange;
      const response = await axios.post<ApiResponse>(
        "/api/v1/timesheet/entry/check/summary-month",
        {
          month: String(start.month() + 1),
          year: String(start.year()),
        }
      );
      const body = response.data;
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
    const totalExpected =
      (metadata?.expected_hours_per_member ?? 0) * totalMembers;
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

  const uniquePositions = useMemo(() => {
    const positionsSet = new Set(records.map((r) => r.position));
    return Array.from(positionsSet).map((pos) => ({
      text: pos || "-",
      value: pos,
    }));
  }, [records]);

  const columns: ColumnsType<SummaryRecord> = useMemo(
    () => [
      {
        title: "อันดับ",
        dataIndex: "rank",
        width: 80,
        align: "center",
        render: (_rank: string, record) => (
          <Typography.Text strong>{record.order}</Typography.Text>
        ),
      },
      {
        title: "เกรด",
        key: "grade",
        align: "center",
        width: 160,
        filters: [
          { text: "A", value: "A" },
          { text: "B", value: "B" },
          { text: "C", value: "C" },
          { text: "D", value: "D" },
          { text: "E", value: "E" },
          { text: "F", value: "F" },
        ],
        onFilter: (value, record) => record.rank === value,
        sorter: (a, b) => a.rank.localeCompare(b.rank),
        render: (_value, record) => (
          <GradeTag rank={record.rank} description={record.rank_description} />
        ),
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
        filters: uniquePositions,
        onFilter: (value, record) => record.position === value,
        sorter: (a, b) => (a.position || "").localeCompare(b.position || ""),
        render: (position: string) => <PositionBadge position={position} />,
      },
      {
        title: "ความคืบหน้า",
        dataIndex: "completion_rate",
        key: "completion_rate",
        render: (_value, record) => (
          <Space direction="vertical" size={4} style={{ width: 220 }}>
            <Progress
              percent={Number(record.completion_rate.toFixed(2))}
              status={record.completion_rate >= 100 ? "success" : "active"}
            />
            <Typography.Text type="secondary">
              {record.total_hours}/{record.expected_hours} ชม.
            </Typography.Text>
          </Space>
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
    [uniquePositions]
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
              <DatePicker
                picker="month"
                allowClear={false}
                value={dateRange[0]}
                onChange={handleMonthChange}
                format="MMMM YYYY"
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
              {metadata.working_days} วัน | ชั่วโมงที่คาดหวังต่อคน{" "}
              {metadata.expected_hours_per_member} ชม.
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
