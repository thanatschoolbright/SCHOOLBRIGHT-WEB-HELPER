"use client";

//* แสดงรายชื่อทีมที่ยังไม่กรอกหรือกรอก Timesheet ไม่ครบในวันนี้

import PermissionLayout from "@/components/layouts/permission-layout";
import {
  ClearOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@components/layouts/backend-layout";
import { HeaderBar } from "@components/typhography/header-bar-component";
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TimesheetGap = {
  admin_id: number | string;
  employee_code?: string;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  position?: string;
  email?: string;
  backlog_email?: string | null;
  tel?: string | null;
  status: "ไม่ได้กรอกเลย" | "กรอกไม่ครบ";
  total_hours: number;
};

type ApiPayload = {
  records: TimesheetGap[];
  total: number;
  generated_at?: string;
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

const STATUS_COLORS: Record<TimesheetGap["status"], string> = {
  ไม่ได้กรอกเลย: "red",
  กรอกไม่ครบ: "orange",
};

const buildFullName = (record: TimesheetGap) =>
  [record.firstname, record.lastname].filter(Boolean).join(" ") || "-";

const formatNickname = (nickname?: string) =>
  (nickname ? `(${nickname})` : "").trim();

const formatContact = (record: TimesheetGap) =>
  [record.email, record.tel].filter(Boolean).join(" * ") || "-";

export default function Page() {
  const [keyword, setKeyword] = useState("");
  const [records, setRecords] = useState<TimesheetGap[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    const toastId = toast.loading(
      "กำลังโหลดรายชื่อผู้ที่ยังไม่กรอก Timesheet...",
    );
    try {
      setLoading(true);
      const response = await fetch(
        "/api/v1/timesheet/entry/check/who-not-entry",
      );
      if (!response.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลได้");
      }
      const body: ApiResponse = await response.json();
      setRecords(body.data?.records ?? []);
      setGeneratedAt(body.data?.generated_at);
      toast.success("โหลดข้อมูลสำเร็จ", { id: toastId });
    } catch (error: any) {
      console.error("[Timesheet][who-not-entry]", error);
      toast.error(error?.message || "ไม่สามารถโหลดข้อมูลได้", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRecords = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) =>
      [
        record.firstname,
        record.lastname,
        record.nickname,
        record.position,
        record.email,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [records, keyword]);

  const summary = useMemo(() => {
    const total = records.length;
    const notStarted = records.filter(
      (item) => item.status === "ไม่ได้กรอกเลย",
    ).length;
    const incomplete = records.filter(
      (item) => item.status === "กรอกไม่ครบ",
    ).length;
    return { total, notStarted, incomplete };
  }, [records]);

  const columns: ColumnsType<TimesheetGap> = [
    {
      title: "ลำดับ",
      width: 80,
      align: "center",
      render: (_value, _record, index) => index + 1,
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
      render: (position?: string) => {
        if (!position) return "-";
        const color = POSITION_COLORS[position.toLowerCase()] ?? "blue";
        return <Tag color={color}>{position}</Tag>;
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status: keyof typeof STATUS_COLORS) => (
        <Tag color={STATUS_COLORS[status]} icon={<WarningOutlined />}>
          {status}
        </Tag>
      ),
    },
    {
      title: "ชั่วโมงรวม",
      dataIndex: "total_hours",
      key: "total_hours",
      align: "center",
      render: (hours: number) => (
        <Tag color={hours === 0 ? "red" : "orange"}>{hours}</Tag>
      ),
    },
    {
      title: "ช่องทางติดต่อ",
      key: "contact",
      render: (_value, record) => (
        <Typography.Text>{formatContact(record)}</Typography.Text>
      ),
    },
  ];

  const resetSearch = () => setKeyword("");

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <HeaderBar
          title="Timesheet - Who Not Entry"
          subTitle="รายงานผู้ที่ยังไม่ได้บันทึกเวลา"
          icon={<ClockCircleOutlined />}
          color="none"
        />
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space
            direction="horizontal"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Typography.Title level={4} style={{ margin: 0 }}>
              สรุปการลงเวลาประจำวัน
            </Typography.Title>
            <Button
              icon={<ReloadOutlined />}
              type="primary"
              onClick={loadData}
              loading={loading}
            >
              อัปเดตข้อมูล
            </Button>
          </Space>
          <Button
            type="default"
            loading={sending}
            onClick={async () => {
              const toastId = toast.loading("กำลังแจ้งเตือน Discord...");
              try {
                setSending(true);
                const response = await fetch(
                  "/api/v1/timesheet/entry/condition/find-not-entry-today",
                  { method: "GET" },
                );
                if (!response.ok) {
                  throw new Error("แจ้งเตือน Discord ไม่สำเร็จ");
                }
                toast.success("ส่งแจ้งเตือน Discord สำเร็จ", { id: toastId });
              } catch (error: any) {
                console.error("[Timesheet][notify]", error);
                toast.error(error?.message || "ส่งแจ้งเตือนไม่สำเร็จ", {
                  id: toastId,
                });
              } finally {
                setSending(false);
              }
            }}
          >
            แจ้งเตือน Discord ให้กรอก Timesheet
          </Button>

          <Row gutter={[16, 16]}>
            {[
              {
                title: "จำนวนที่ต้องติดตาม",
                value: summary.total,
                prefix: <TeamOutlined />,
                color: undefined,
              },
              {
                title: "ยังไม่กรอก",
                value: summary.notStarted,
                prefix: <ClockCircleOutlined />,
                color: "#d4380d",
              },
              {
                title: "กรอกไม่ครบ",
                value: summary.incomplete,
                prefix: <WarningOutlined />,
                color: "#e67e22",
              },
            ].map((item) => (
              <Col key={item.title} xs={24} md={8}>
                <Card
                  size="small"
                  variant="borderless"
                  style={{ borderRadius: 12 }}
                >
                  <Statistic
                    title={item.title}
                    value={item.value}
                    prefix={item.prefix}
                    valueStyle={item.color ? { color: item.color } : undefined}
                  />
                </Card>
              </Col>
            ))}
          </Row>
          {generatedAt && (
            <Typography.Text type="secondary">
              อัปเดตล่าสุด: {new Date(generatedAt).toLocaleString("th-TH")}
            </Typography.Text>
          )}

          <Card title="รายชื่อผู้ที่ยังไม่ได้ลงเวลาวันนี้">
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
                onClick={resetSearch}
                type="default"
                style={{ alignSelf: "flex-start" }}
              >
                ล้างการค้นหา
              </Button>
              <Table
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
        </Space>
      </DashboardLayout>
    </PermissionLayout>
  );
}
