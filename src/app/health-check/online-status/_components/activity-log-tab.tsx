"use client";

import { callApiService } from "@/services/axios-instance/sb-helper.axios";
import {
  BellOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  EditOutlined,
  FilterOutlined,
  ForwardOutlined,
  ReloadOutlined,
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
  Space,
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
export function BotRunLogSection() {
  const [logs, setLogs] = useState<BotRunLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchBotLogs = useCallback(async (page = 1, size = 20) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(size),
      });
      const res = await callApiService.get(
        `/api/v2/hardware/bot-run-log?${params.toString()}`,
      );
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
      title: "สถานะการทำงาน",
      dataIndex: "is_success",
      key: "is_success",
      width: 140,
      render: (isSuccess: boolean) => (
        <Tag
          icon={isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={isSuccess ? "success" : "error"}
          style={{
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {isSuccess ? "ดำเนินการสำเร็จ" : "พบข้อผิดพลาด"}
        </Tag>
      ),
    },
    {
      title: "สรุปผลการส่ง (กลุ่ม LINE)",
      key: "result_summary",
      width: 320,
      render: (_, record) => (
        <Flex align="center" gap={12}>
          <Tooltip title={`ส่งสำเร็จ ${record.success} กลุ่ม`}>
            <Flex
              align="center"
              gap={6}
              style={{
                background: "rgba(22, 163, 74, 0.05)",
                padding: "2px 10px",
                borderRadius: 20,
                border: "1px solid rgba(22, 163, 74, 0.1)",
              }}
            >
              <CheckOutlined style={{ color: "#16a34a", fontSize: 10 }} />
              <AntText
                style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}
              >
                {record.success.toLocaleString()}
              </AntText>
            </Flex>
          </Tooltip>

          <Tooltip title={`ส่งล้มเหลว ${record.failed} กลุ่ม`}>
            <Flex
              align="center"
              gap={6}
              style={{
                background:
                  record.failed > 0 ? "rgba(220, 38, 38, 0.05)" : "transparent",
                padding: "2px 10px",
                borderRadius: 20,
                border:
                  record.failed > 0
                    ? "1px solid rgba(220, 38, 38, 0.1)"
                    : "1px solid transparent",
              }}
            >
              <CloseOutlined
                style={{
                  color: record.failed > 0 ? "#dc2626" : "#cbd5e1",
                  fontSize: 10,
                }}
              />
              <AntText
                style={{
                  fontSize: 13,
                  color: record.failed > 0 ? "#dc2626" : "#94a3b8",
                  fontWeight: record.failed > 0 ? 700 : 400,
                }}
              >
                {record.failed.toLocaleString()}
              </AntText>
            </Flex>
          </Tooltip>

          <Tooltip title={`ข้าม ${record.skipped} กลุ่ม (ปิดแจ้งเตือน)`}>
            <Flex
              align="center"
              gap={6}
              style={{
                background: "rgba(148, 163, 184, 0.05)",
                padding: "2px 10px",
                borderRadius: 20,
                border: "1px solid rgba(148, 163, 184, 0.1)",
              }}
            >
              <ForwardOutlined style={{ color: "#64748b", fontSize: 10 }} />
              <AntText
                type="secondary"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                {record.skipped.toLocaleString()}
              </AntText>
            </Flex>
          </Tooltip>
        </Flex>
      ),
    },
    {
      title: "ระยะเวลา",
      dataIndex: "duration_ms",
      key: "duration_ms",
      width: 120,
      align: "center",
      render: (ms: number | null) => (
        <Flex vertical align="center" style={{ minWidth: 80 }}>
          {ms !== null ? (
            <>
              <AntText
                style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}
              >
                {(ms / 1000).toFixed(2)}
              </AntText>
              <AntText type="secondary" style={{ fontSize: 10, marginTop: -2 }}>
                วินาที
              </AntText>
            </>
          ) : (
            <AntText type="secondary">—</AntText>
          )}
        </Flex>
      ),
    },
    {
      title: "เวลาที่ทำงาน",
      dataIndex: "run_at",
      key: "run_at",
      width: 180,
      render: (runAt: string) => (
        <Tooltip
          title={dayjs(runAt).tz("Asia/Bangkok").format("DD/MM/YYYY HH:mm:ss")}
        >
          <Flex vertical gap={2}>
            <Flex align="center" gap={6}>
              <ClockCircleOutlined style={{ fontSize: 12, color: "#6366f1" }} />
              <AntText style={{ fontSize: 13, fontWeight: 500 }}>
                {dayjs(runAt).tz("Asia/Bangkok").fromNow()}
              </AntText>
            </Flex>
            <AntText type="secondary" style={{ fontSize: 11, marginLeft: 18 }}>
              {dayjs(runAt).tz("Asia/Bangkok").format("HH:mm:ss")}
            </AntText>
          </Flex>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      styles={{ body: { padding: 0 } }}
      style={{
        marginBottom: 24,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(128,128,128,0.15)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
      }}
      title={
        <Flex align="center" gap={12} style={{ padding: "4px 0" }}>
          <div
            style={{
              background: "#6366f1",
              padding: 8,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(99, 102, 241, 0.2)",
            }}
          >
            <RobotOutlined style={{ fontSize: "1.2rem", color: "#fff" }} />
          </div>
          <Flex vertical>
            <Typography.Text
              strong
              style={{ fontSize: "1rem", lineHeight: 1.2 }}
            >
              ประวัติการทำงานของ Bot
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              บันทึกการทำงานของระบบแจ้งเตือนอัตโนมัติ (Automated Reports)
            </Typography.Text>
          </Flex>
        </Flex>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void fetchBotLogs(currentPage, pageSize)}
          loading={isLoading}
          style={{ borderRadius: 8 }}
        >
          รีเฟรชข้อมูล
        </Button>
      }
    >
      <Table
        rowKey="id"
        dataSource={logs}
        columns={columns}
        loading={isLoading}
        size="middle"
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (t) => `ทั้งหมด ${t.toLocaleString()} รายการ`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          style: { paddingRight: 16 },
        }}
        locale={{ emptyText: "ยังไม่มีประวัติการทำงานของ Bot" }}
        scroll={{ x: 800 }}
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
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const [filterAction, setFilterAction] = useState<"all" | "rename" | "notify">(
    "all",
  );
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterDateRange, setFilterDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ✨ โหลดข้อมูล log จาก API
  const fetchLogs = useCallback(
    async (page = 1, size = 20) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(size),
          action: filterAction,
        });
        if (filterKeyword.trim()) params.set("keyword", filterKeyword.trim());
        if (filterDateRange[0])
          params.set(
            "date_from",
            filterDateRange[0].startOf("day").toISOString(),
          );
        if (filterDateRange[1])
          params.set("date_to", filterDateRange[1].endOf("day").toISOString());

        const res = await callApiService.get(
          `/api/v1/hardware/machine-monitoring/device-activity-log?${params.toString()}`,
        );
        setLogs(res.data?.data ?? []);
        setPagination(
          res.data?.pagination ?? {
            page: 1,
            page_size: 20,
            total: 0,
            total_pages: 0,
          },
        );
      } catch {
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filterAction, filterKeyword, filterDateRange],
  );

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
            <Tag
              icon={<BellOutlined />}
              color={record.value ? "green" : "default"}
            >
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
        <AntText style={{ fontSize: 13, fontFamily: "monospace" }}>
          {deviceId ?? "—"}
        </AntText>
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
            {value !== null && value !== "" ? (
              `"${value}"`
            ) : (
              <AntText type="secondary">ล้างชื่อ</AntText>
            )}
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
          <UserOutlined
            style={{ fontSize: 12, color: "#6366f1", flexShrink: 0 }}
          />
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
        <Tooltip
          title={dayjs(createdAt)
            .tz("Asia/Bangkok")
            .format("DD/MM/YYYY HH:mm:ss")}
        >
          <Flex align="center" gap={6}>
            <ClockCircleOutlined style={{ fontSize: 12, color: "#94a3b8" }} />
            <AntText style={{ fontSize: 13 }}>
              {dayjs(createdAt).tz("Asia/Bangkok").fromNow()}
            </AntText>
          </Flex>
        </Tooltip>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      {/* Bot Run Log Section */}
      <BotRunLogSection />

      {/* Filter Section */}
      <Card
        style={{
          borderRadius: 12,
          border: "1px solid rgba(128,128,128,0.15)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
        styles={{ body: { padding: "20px 24px" } }}
      >
        <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
          <FilterOutlined
            style={{ fontSize: "1rem", fontWeight: 600, color: "#6366f1" }}
          />
          <AntText strong style={{ fontSize: "1rem", fontWeight: 600 }}>
            ตัวกรอง
          </AntText>
        </Flex>

        <Row gutter={[24, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <AntText
              type="secondary"
              style={{ fontSize: 13, display: "block", marginBottom: 6 }}
            >
              ประเภทการกระทำ
            </AntText>
            <Select
              value={filterAction}
              onChange={(val) => setFilterAction(val)}
              style={{ width: "100%" }}
              placeholder="เลือกประเภท"
              options={[
                { label: "ทุกประเภท", value: "all" },
                { label: "เปลี่ยนชื่อเครื่อง", value: "rename" },
                { label: "เปิด/ปิดการแจ้งเตือน", value: "notify" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <AntText
              type="secondary"
              style={{ fontSize: 13, display: "block", marginBottom: 6 }}
            >
              ค้นหา (รหัสเครื่อง / User ID)
            </AntText>
            <Input
              placeholder="รหัสเครื่องหรือ User ID..."
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <AntText
              type="secondary"
              style={{ fontSize: 13, display: "block", marginBottom: 6 }}
            >
              ช่วงวันที่
            </AntText>
            <RangePicker
              style={{ width: "100%" }}
              value={filterDateRange}
              onChange={(dates) =>
                setFilterDateRange([
                  (dates?.[0] as dayjs.Dayjs) ?? null,
                  (dates?.[1] as dayjs.Dayjs) ?? null,
                ])
              }
              format="DD/MM/YYYY"
              placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
            />
          </Col>

          <Col xs={24}>
            <Flex gap={12} justify="flex-end" style={{ marginTop: 8 }}>
              <Button
                icon={<ClearOutlined />}
                onClick={handleReset}
                style={{ borderRadius: 8 }}
              >
                ล้างการค้นหา
              </Button>
              <Button
                icon={<SearchOutlined />}
                type="primary"
                onClick={handleSearch}
                style={{
                  borderRadius: 8,
                  paddingLeft: 24,
                  paddingRight: 24,
                  fontWeight: 600,
                  background: "#6366f1",
                }}
              >
                ค้นหา
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* Table Section */}
      <Card
        style={{
          borderRadius: 12,
          border: "1px solid rgba(128,128,128,0.15)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
        styles={{ body: { padding: 0 } }}
        title={
          <Flex align="center" gap={8} style={{ padding: "4px 0" }}>
            <UnorderedListOutlined
              style={{ fontSize: "1.1rem", color: "#6366f1" }}
            />
            <Flex align="baseline" gap={8}>
              <AntText strong style={{ fontSize: "1rem" }}>
                ประวัติการกระทำ
              </AntText>
              <AntText type="secondary" style={{ fontSize: 13 }}>
                แสดงรายการบันทึกการใช้งานระบบ
              </AntText>
            </Flex>
          </Flex>
        }
        extra={
          <AntText
            type="secondary"
            style={{ fontSize: 13, fontWeight: 500, marginRight: 8 }}
          >
            ทั้งหมด {pagination.total.toLocaleString()} รายการ
          </AntText>
        }
      >
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
            style: { paddingRight: 16 },
          }}
          size="middle"
          scroll={{ x: 1000 }}
          locale={{ emptyText: "ไม่พบข้อมูลประวัติการกระทำ" }}
        />
      </Card>
    </Space>
  );
}
