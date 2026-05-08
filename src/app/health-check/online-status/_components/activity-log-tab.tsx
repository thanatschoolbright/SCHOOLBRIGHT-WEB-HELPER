"use client";

import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import {
  BellOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FilterOutlined,
  RobotOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Input,
  Row,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import "dayjs/locale/th";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useCallback, useEffect, useState } from "react";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

const { Text: AntText } = Typography;
const { RangePicker } = DatePicker;

interface BotRunLogItem {
  id: string;
  run_at: string;
  duration_ms: number | null;
  is_success: boolean;
  success: number;
  failed: number;
  skipped: number;
  total_active_groups: number;
}

// ✨ Section แสดงประวัติการทำงานของ Bot (cronjob)
function BotRunLogSection() {
  const [logs, setLogs] = useState<BotRunLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchBotLogs = useCallback(async (page = 1, size = 20) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(size) });
      const res = await callApiService.get(`/api/v2/hardware/bot-run-log?${params.toString()}`);
      setLogs(res.data?.data ?? []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBotLogs(currentPage, pageSize);
  }, [fetchBotLogs, currentPage, pageSize]);

  const columns: ColumnsType<BotRunLogItem> = [
    {
      title: "สถานะ",
      dataIndex: "is_success",
      key: "is_success",
      width: 100,
      render: (isSuccess: boolean) =>
        isSuccess ? (
          <Tag icon={<CheckCircleOutlined />} color="success">สำเร็จ</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">มีข้อผิดพลาด</Tag>
        ),
    },
    {
      title: "ส่งสำเร็จ",
      dataIndex: "success",
      key: "success",
      width: 100,
      render: (v: number) => <AntText style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>{v}</AntText>,
    },
    {
      title: "ล้มเหลว",
      dataIndex: "failed",
      key: "failed",
      width: 100,
      render: (v: number) => (
        <AntText style={{ fontSize: 13, color: v > 0 ? "#dc2626" : undefined, fontWeight: v > 0 ? 600 : 400 }}>
          {v}
        </AntText>
      ),
    },
    {
      title: "ข้าม",
      dataIndex: "skipped",
      key: "skipped",
      width: 100,
      render: (v: number) => <AntText type="secondary" style={{ fontSize: 13 }}>{v}</AntText>,
    },
    {
      title: "ใช้เวลา",
      dataIndex: "duration_ms",
      key: "duration_ms",
      width: 110,
      render: (ms: number | null) =>
        ms !== null ? (
          <AntText style={{ fontSize: 13 }}>{(ms / 1000).toFixed(1)} วิ</AntText>
        ) : (
          <AntText type="secondary">—</AntText>
        ),
    },
    {
      title: "เวลา",
      dataIndex: "run_at",
      key: "run_at",
      render: (runAt: string) => (
        <Tooltip title={dayjs(runAt).tz("Asia/Bangkok").format("DD/MM/YYYY HH:mm:ss")}>
          <Flex align="center" gap={6}>
            <ClockCircleOutlined style={{ fontSize: 12, color: "#94a3b8" }} />
            <AntText style={{ fontSize: 13 }}>{dayjs(runAt).tz("Asia/Bangkok").fromNow()}</AntText>
          </Flex>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{ marginBottom: 16 }}
      title={
        <Typography.Text strong style={{ fontSize: "1rem" }}>
          <RobotOutlined style={{ marginRight: 8 }} />
          ประวัติการทำงานของ Bot
        </Typography.Text>
      }
      extra={
        <Button size="small" onClick={() => void fetchBotLogs(currentPage, pageSize)} loading={isLoading}>
          รีเฟรช
        </Button>
      }
    >
      <Table
        rowKey="id"
        dataSource={logs}
        columns={columns}
        loading={isLoading}
        size="small"
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (t) => `ทั้งหมด ${t.toLocaleString()} รายการ`,
          onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
        }}
        locale={{ emptyText: "ยังไม่มีประวัติการทำงานของ Bot" }}
        scroll={{ x: 600 }}
      />
    </Card>
  );
}

interface ActivityLogItem {
  id: string;
  action_type: "notify" | "rename";
  action_label: string;
  device_id: string | null;
  school_id: number | null;
  value: boolean | string | null;
  called_by: string;
  user_employee_code: string | null;
  user_fullname: string | null;
  is_success: boolean;
  created_at: string;
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// ✨ ตาราง Log บันทึกการกระทำของ User ในหน้า Online Status
export default function ActivityLogTab() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, page_size: 20, total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const [filterAction, setFilterAction] = useState<"all" | "rename" | "notify">("all");
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ✨ โหลดข้อมูล log จาก API
  const fetchLogs = useCallback(async (page = 1, size = 20) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(size),
        action: filterAction,
      });
      if (filterKeyword.trim()) params.set("keyword", filterKeyword.trim());
      if (filterDateRange[0]) params.set("date_from", filterDateRange[0].startOf("day").toISOString());
      if (filterDateRange[1]) params.set("date_to", filterDateRange[1].endOf("day").toISOString());

      const res = await callApiService.get(
        `/api/v1/hardware/machine-monitoring/device-activity-log?${params.toString()}`,
      );
      setLogs(res.data?.data ?? []);
      setPagination(res.data?.pagination ?? { page: 1, page_size: 20, total: 0, total_pages: 0 });
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterAction, filterKeyword, filterDateRange]);

  useEffect(() => {
    void fetchLogs(currentPage, pageSize);
  }, [fetchLogs, currentPage, pageSize]);

  // ✨ รีเซ็ต filter และโหลดใหม่
  const handleReset = () => {
    setFilterAction("all");
    setFilterKeyword("");
    setFilterDateRange([null, null]);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    void fetchLogs(1, pageSize);
  };

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    const newPage = paginationConfig.current ?? 1;
    const newSize = paginationConfig.pageSize ?? 20;
    setCurrentPage(newPage);
    setPageSize(newSize);
  };

  const columns: ColumnsType<ActivityLogItem> = [
    {
      title: "ประเภท",
      dataIndex: "action_type",
      key: "action_type",
      width: 160,
      render: (type: string, record) => (
        <Flex align="center" gap={8}>
          {type === "notify" ? (
            <Tag icon={<BellOutlined />} color={record.value ? "green" : "default"}>
              {record.action_label}
            </Tag>
          ) : (
            <Tag icon={<EditOutlined />} color="blue">
              {record.action_label}
            </Tag>
          )}
        </Flex>
      ),
    },
    {
      title: "รหัสเครื่อง",
      dataIndex: "device_id",
      key: "device_id",
      render: (deviceId: string | null) => (
        <AntText style={{ fontSize: 13, fontFamily: "monospace" }}>{deviceId ?? "—"}</AntText>
      ),
    },
    {
      title: "รหัสโรงเรียน",
      dataIndex: "school_id",
      key: "school_id",
      width: 120,
      render: (schoolId: number | null) => (
        <AntText style={{ fontSize: 13 }}>{schoolId ?? "—"}</AntText>
      ),
    },
    {
      title: "ค่าที่เปลี่ยน",
      dataIndex: "value",
      key: "value",
      render: (value: boolean | string | null, record) => {
        if (record.action_type === "notify") {
          return (
            <Badge
              status={value === true ? "success" : "default"}
              text={
                <AntText style={{ fontSize: 13 }}>
                  {value === true ? "เปิด" : "ปิด"}
                </AntText>
              }
            />
          );
        }
        return (
          <AntText style={{ fontSize: 13 }}>
            {value !== null && value !== "" ? `"${value}"` : <AntText type="secondary">ล้างชื่อ</AntText>}
          </AntText>
        );
      },
    },
    {
      title: "ผู้ดำเนินการ",
      key: "called_by",
      width: 200,
      render: (_: unknown, record: ActivityLogItem) => (
        <Flex align="center" gap={6}>
          <UserOutlined style={{ fontSize: 12, color: "#6366f1", flexShrink: 0 }} />
          <Flex vertical gap={0}>
            <AntText style={{ fontSize: 13, lineHeight: 1.4 }}>
              {record.user_fullname ?? `User #${record.called_by}`}
            </AntText>
            {record.user_employee_code && (
              <AntText type="secondary" style={{ fontSize: 11 }}>
                {record.user_employee_code}
              </AntText>
            )}
          </Flex>
        </Flex>
      ),
    },
    {
      title: "เวลา",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      sorter: true,
      render: (createdAt: string) => (
        <Tooltip title={dayjs(createdAt).tz("Asia/Bangkok").format("DD/MM/YYYY HH:mm:ss")}>
          <Flex align="center" gap={6}>
            <ClockCircleOutlined style={{ fontSize: 12, color: "#94a3b8" }} />
            <AntText style={{ fontSize: 13 }}>{dayjs(createdAt).tz("Asia/Bangkok").fromNow()}</AntText>
          </Flex>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <BotRunLogSection />

      {/* Filter Section */}
      <Card
        size="small"
        style={{ borderRadius: 14, marginBottom: 16 }}
        styles={{ body: { padding: "16px 20px" } }}
      >
        <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
          <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
          <AntText strong style={{ fontSize: 14, fontWeight: 600 }}>
            ตัวกรอง
          </AntText>
        </Flex>
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12}>
            <AntText type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              ประเภทการกระทำ
            </AntText>
            <Select
              value={filterAction}
              onChange={(val) => setFilterAction(val)}
              style={{ width: "100%" }}
              options={[
                { label: "ทุกประเภท", value: "all" },
                { label: "เปลี่ยนชื่อเครื่อง", value: "rename" },
                { label: "เปิด/ปิดการแจ้งเตือน", value: "notify" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12}>
            <AntText type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              ค้นหา (รหัสเครื่อง / User ID)
            </AntText>
            <Input
              placeholder="พิมพ์รหัสเครื่องหรือ User ID"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12}>
            <AntText type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              ช่วงวันที่
            </AntText>
            <RangePicker
              style={{ width: "100%" }}
              value={filterDateRange}
              onChange={(dates) => setFilterDateRange([dates?.[0] as dayjs.Dayjs ?? null, dates?.[1] as dayjs.Dayjs ?? null])}
              format="DD/MM/YYYY"
              placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
            />
          </Col>
          <Col xs={24} sm={12}>
            <AntText style={{ fontSize: 12, display: "block", marginBottom: 4, color: "transparent" }}>.</AntText>
            <Flex gap={8} justify="flex-end">
              <Button icon={<SearchOutlined />} type="primary" onClick={handleSearch}>
                ค้นหา
              </Button>
              <Button icon={<ClearOutlined />} onClick={handleReset}>
                ล้างการค้นหา
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card styles={{ body: { padding: 16 } }}>
        <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
          <UnorderedListOutlined style={{ fontSize: "1rem" }} />
          <AntText strong style={{ fontSize: 14 }}>
            ประวัติการกระทำ
          </AntText>
          <AntText type="secondary" style={{ fontSize: 12 }}>
            ({pagination.total.toLocaleString()} รายการ)
          </AntText>
        </Flex>
        <Table
          rowKey="id"
          dataSource={logs}
          columns={columns}
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            current: currentPage,
            pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `ทั้งหมด ${total.toLocaleString()} รายการ`,
          }}
          size="small"
          scroll={{ x: 800 }}
          locale={{ emptyText: "ไม่พบประวัติการกระทำ" }}
        />
      </Card>
    </div>
  );
}
