"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  DatePicker,
  Button,
  Progress,
  Tag,
  Divider,
  Popover,
  Checkbox,
  theme,
  Empty,
  Row,
  Col,
  Card,
  Space,
  Typography,
  Modal,
} from "antd";
import {
  FileExcelOutlined,
  SearchOutlined,
  ProjectOutlined,
  BuildOutlined,
  ToolOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // * Use Sonner Toast

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// * Define Data Interface
interface ProjectStatDetail {
  feature_id: number | null;
  feature_name: string;
  asset_capture_type: string;
  hours: number;
  percent: number;
}

interface CapturableData {
  project_id: number;
  project_code: string;
  project_name: string;
  capturable_percent: number;
  uncapturable_percent: number;
  hours: number;
  hours_percent: number;
  details: ProjectStatDetail[];
}

// * Column Constants
const defaultCheckedList = [
  "index",
  "project_code",
  "project_name",
  "capturable_percent",
  "uncapturable_percent",
  "hours",
  "hours_percent",
  "actions",
];

const columnOptions = [
  { label: "# ลำดับ", value: "index" },
  { label: "รหัส (Code)", value: "project_code" },
  { label: "ชื่อโครงการ", value: "project_name" },
  { label: "งานสร้างใหม่ (%)", value: "capturable_percent" },
  { label: "งานบำรุงรักษา (%)", value: "uncapturable_percent" },
  { label: "ชั่วโมงรวม", value: "hours" },
  { label: "สัดส่วน (%)", value: "hours_percent" },
  { label: "จัดการ", value: "actions" },
];

/**
 * * CapturableReportPage Component
 * Displays a report analyzing the ratio of Capturable vs Uncapturable work hours for projects.
 */
export default function CapturableReportPage() {
  const router = useRouter();
  const { token } = theme.useToken();

  // * State Management
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [data, setData] = useState<CapturableData[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [visibleColumns, setVisibleColumns] =
    useState<any[]>(defaultCheckedList);

  // * Detail Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CapturableData | null>(
    null,
  );

  const openDetails = (record: CapturableData) => {
    setSelectedProject(record);
    setDetailModalOpen(true);
  };

  /**
   * * Fetch Report Data
   * Retrieve report data from API based on selected date range
   */
  const fetchReport = async () => {
    setLoading(true);
    const toastId = toast.loading("กำลังดึงข้อมูลรายงาน...");
    try {
      const response = await axios.post(
        "/api/v1/timesheet/report/capturable-report",
        {
          start_date: dateRange[0].format("YYYY-MM-DD"),
          end_date: dateRange[1].format("YYYY-MM-DD"),
        },
      );

      if (response.data.status === 200) {
        setData(response.data.data);
        toast.success(response.data.message_th || "ดึงข้อมูลสำเร็จ", {
          id: toastId,
        });
      } else {
        toast.error("ไม่สามารถดึงข้อมูลได้", { id: toastId });
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message_th || "เกิดข้อผิดพลาดในการดึงข้อมูล",
        { id: toastId },
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * * Export to Excel
   * Dowuload detailed report as an Excel file
   */
  const exportExcel = async () => {
    setExportLoading(true);
    const toastId = toast.loading("กำลังส่งออกไฟล์ Excel...");
    try {
      const response = await axios.post(
        "/api/v1/timesheet/report/capturable-report/export-excel",
        {
          start_date: dateRange[0].format("YYYY-MM-DD"),
          end_date: dateRange[1].format("YYYY-MM-DD"),
        },
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `capturable-report-${dateRange[0].format(
          "YYYY-MM-DD",
        )}-to-${dateRange[1].format("YYYY-MM-DD")}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("ส่งออกไฟล์ Excel สำเร็จ", { id: toastId });
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดในการส่งออกไฟล์", { id: toastId });
    } finally {
      setExportLoading(false);
    }
  };

  // * Calculations for Summary Cards
  const totalHours = data.reduce((sum, item) => sum + item.hours, 0);
  const avgCapturable =
    data.length > 0
      ? data.reduce((sum, item) => sum + item.capturable_percent, 0) /
        data.length
      : 0;
  const avgUncapturable =
    data.length > 0
      ? data.reduce((sum, item) => sum + item.uncapturable_percent, 0) /
        data.length
      : 0;

  // * Table Columns Definition
  const allColumns: ColumnsType<CapturableData> = [
    {
      title: "#",
      key: "index",
      align: "center",
      width: 50,
      render: (_, __, index) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {index + 1}
        </Text>
      ),
    },
    {
      title: "รหัส",
      dataIndex: "project_code",
      key: "project_code",
      width: 80,
      align: "center",
      render: (code: string) => (
        <Tag bordered={false} style={{ color: token.colorPrimary }}>
          {code}
        </Tag>
      ),
    },
    {
      title: "ชื่อโครงการ",
      dataIndex: "project_name",
      key: "project_name",
      width: 250,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: (
        <Space size={4}>
          <BuildOutlined style={{ color: token.colorSuccess }} />
          <span>งานสร้างใหม่ (capitalization)</span>
        </Space>
      ),
      dataIndex: "capturable_percent",
      key: "capturable_percent",
      width: 150,
      sorter: (a, b) => a.capturable_percent - b.capturable_percent,
      render: (value: number) => (
        <div className="w-full">
          <div className="flex justify-between items-center mb-1">
            <Text type="secondary" style={{ fontSize: 11 }}>
              สร้างใหม่
            </Text>
            <Text strong style={{ color: token.colorSuccess, fontSize: 12 }}>
              {value.toFixed(0)}%
            </Text>
          </div>
          <Progress
            percent={value}
            showInfo={false}
            strokeColor={token.colorSuccess}
            trailColor={token.colorFillSecondary}
            size="small"
          />
        </div>
      ),
    },
    {
      title: (
        <Space size={4}>
          <ToolOutlined style={{ color: token.colorError }} />
          <span>งานดูแล (Expense)</span>
        </Space>
      ),
      dataIndex: "uncapturable_percent",
      key: "uncapturable_percent",
      width: 150,
      sorter: (a, b) => a.uncapturable_percent - b.uncapturable_percent,
      render: (value: number) => (
        <div className="w-full">
          <div className="flex justify-between items-center mb-1">
            <Text type="secondary" style={{ fontSize: 11 }}>
              ดูแล
            </Text>
            <Text strong style={{ color: token.colorError, fontSize: 12 }}>
              {value.toFixed(0)}%
            </Text>
          </div>
          <Progress
            percent={value}
            showInfo={false}
            strokeColor={token.colorError}
            trailColor={token.colorFillSecondary}
            size="small"
          />
        </div>
      ),
    },
    {
      title: "ชั่วโมง",
      dataIndex: "hours",
      key: "hours",
      width: 100,
      align: "right",
      sorter: (a, b) => a.hours - b.hours,
      render: (value: number) => (
        <Text strong style={{ color: token.colorInfoText }}>
          {value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      ),
    },
    {
      title: "สัดส่วน",
      dataIndex: "hours_percent",
      key: "hours_percent",
      width: 100,
      align: "center",
      sorter: (a, b) => a.hours_percent - b.hours_percent,
      render: (value: number) => (
        <Tag bordered={false}>{value.toFixed(2)}%</Tag>
      ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          ghost
          icon={<InfoCircleOutlined />}
          onClick={() => openDetails(record)}
        >
          รายละเอียด
        </Button>
      ),
    },
  ];

  // * Dynamic Column Filtering
  const filteredColumns = useMemo(() => {
    return allColumns.filter((col) =>
      visibleColumns.includes(col.key as string),
    );
  }, [allColumns, visibleColumns]);

  const columnSelectorContent = (
    <div className="p-2 w-64">
      <div
        className="mb-3 border-b pb-2 font-semibold"
        style={{
          borderColor: token.colorBorderSecondary,
          color: token.colorText,
        }}
      >
        เลือกคอลัมน์แสดงผล
      </div>
      <Checkbox.Group
        className="flex flex-col gap-2"
        options={columnOptions}
        value={visibleColumns}
        onChange={(checkedValues) => setVisibleColumns(checkedValues)}
      />
    </div>
  );

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        {/* Main Content Container */}
        <Space direction="vertical" size={24} className="w-full p-6">
          {/* 1. Header & Filter Section */}
          <div
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 rounded-xl shadow-sm border transition-colors duration-200"
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorderSecondary,
            }}
          >
            <div className="flex items-center gap-4">
              <Button
                shape="circle"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/timesheet/all")}
                style={{
                  color: token.colorTextSecondary,
                  borderColor: token.colorBorder,
                }}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  รายงานวิเคราะห์ทรัพย์สิน (Capitalization)
                </Title>
                <Text type="secondary" className="text-xs">
                  วิเคราะห์สัดส่วนงานรายโครงการเพื่อแยกประเภทสินทรัพย์
                </Text>
              </div>
            </div>

            <div
              className="flex items-center gap-2 p-1.5 rounded-lg border transition-colors duration-200"
              style={{
                backgroundColor: token.colorFillQuaternary,
                borderColor: token.colorBorderSecondary,
              }}
            >
              <RangePicker
                value={dateRange}
                onChange={(dates) =>
                  dates &&
                  dates[0] &&
                  dates[1] &&
                  setDateRange([dates[0], dates[1]])
                }
                format="DD MMM YYYY"
                variant="borderless"
                allowClear={false}
                style={{ width: 240, backgroundColor: token.colorBgContainer }}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={fetchReport}
                loading={loading}
                className="rounded-lg shadow-none border-0"
              >
                วิเคราะห์
              </Button>
            </div>
          </div>

          {/* 2. Modern Summary Statistics Cards */}
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} xl={6}>
              <Card
                bordered={false}
                className="shadow-sm rounded-xl overflow-hidden relative h-full border"
                style={{ borderColor: token.colorBorderSecondary }}
                styles={{ body: { zIndex: 10, position: "relative" } }}
              >
                {/* Background Icon (Single) */}
                <div
                  className="absolute -right-4 -bottom-4 text-8xl opacity-10 pointer-events-none rotate-12"
                  style={{ color: token.colorPrimary }}
                >
                  <ProjectOutlined />
                </div>

                <div className="relative z-10">
                  <Text
                    type="secondary"
                    className="font-semibold text-xs tracking-wider"
                  >
                    โครงการทั้งหมด
                  </Text>
                  <div className="mt-2">
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                      {data.length}
                    </Title>
                  </div>
                  <Tag className="mt-3 border-0" color="processing">
                    {data.length > 0 ? "มีข้อมูล" : "ไม่มีข้อมูล"}
                  </Tag>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Card
                bordered={false}
                className="shadow-sm rounded-xl overflow-hidden relative h-full border"
                style={{ borderColor: token.colorBorderSecondary }}
                styles={{ body: { zIndex: 10, position: "relative" } }}
              >
                <div
                  className="absolute -right-4 -bottom-4 text-8xl opacity-10 pointer-events-none rotate-12"
                  style={{ color: token.colorInfo }}
                >
                  <ClockCircleOutlined />
                </div>
                <div className="relative z-10">
                  <Text
                    type="secondary"
                    className="font-semibold text-xs tracking-wider"
                  >
                    ชั่วโมงรวม
                  </Text>
                  <div className="mt-2">
                    <Title
                      level={2}
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        color: token.colorInfoText,
                      }}
                    >
                      {totalHours.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </Title>
                  </div>
                  <Text type="secondary" className="text-xs mt-1 block">
                    ชั่วโมงที่บันทึกในช่วงเวลานี้
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Card
                bordered={false}
                className="shadow-sm rounded-xl overflow-hidden relative h-full border"
                style={{ borderColor: token.colorBorderSecondary }}
                styles={{ body: { zIndex: 10, position: "relative" } }}
              >
                <div
                  className="absolute -right-4 -bottom-4 text-8xl opacity-10 pointer-events-none rotate-12"
                  style={{ color: token.colorSuccess }}
                >
                  <CheckCircleOutlined />
                </div>
                <div className="relative z-10">
                  <Text
                    type="secondary"
                    className="font-semibold text-xs tracking-wider"
                    style={{ color: token.colorSuccess }}
                  >
                    เฉลี่ยงานสร้างใหม่ (Asset)
                  </Text>
                  <div className="mt-2 flex items-baseline gap-1">
                    <Title
                      level={2}
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        color: token.colorSuccess,
                      }}
                    >
                      {avgCapturable.toFixed(1)}
                    </Title>
                    <span
                      className="text-lg font-bold"
                      style={{ color: token.colorSuccess }}
                    >
                      %
                    </span>
                  </div>
                  <Progress
                    percent={avgCapturable}
                    showInfo={false}
                    strokeColor={token.colorSuccess}
                    trailColor={token.colorFillSecondary}
                    size="small"
                    className="mt-3"
                  />
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Card
                bordered={false}
                className="shadow-sm rounded-xl overflow-hidden relative h-full border"
                style={{ borderColor: token.colorBorderSecondary }}
                styles={{ body: { zIndex: 10, position: "relative" } }}
              >
                <div
                  className="absolute -right-4 -bottom-4 text-8xl opacity-10 pointer-events-none rotate-12"
                  style={{ color: token.colorError }}
                >
                  <CloseCircleOutlined />
                </div>
                <div className="relative z-10">
                  <Text
                    type="secondary"
                    className="font-semibold text-xs tracking-wider"
                    style={{ color: token.colorError }}
                  >
                    เฉลี่ยงานดูแล (Expense)
                  </Text>
                  <div className="mt-2 flex items-baseline gap-1">
                    <Title
                      level={2}
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        color: token.colorError,
                      }}
                    >
                      {avgUncapturable.toFixed(1)}
                    </Title>
                    <span
                      className="text-lg font-bold"
                      style={{ color: token.colorError }}
                    >
                      %
                    </span>
                  </div>
                  <Progress
                    percent={avgUncapturable}
                    showInfo={false}
                    strokeColor={token.colorError}
                    trailColor={token.colorFillSecondary}
                    size="small"
                    className="mt-3"
                  />
                </div>
              </Card>
            </Col>
          </Row>

          {/* 3. Detailed Table Section */}
          <Card
            bordered={false}
            className="shadow-sm rounded-xl border"
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorderSecondary,
            }}
            styles={{ body: { padding: "24px 0" } }}
          >
            {/* Toolbar */}
            <div className="px-6 mb-4 flex justify-between items-center">
              <Space>
                <Title level={5} style={{ margin: 0 }}>
                  รายละเอียดรายโครงการ
                </Title>
                <Popover
                  content={columnSelectorContent}
                  trigger="click"
                  placement="bottomLeft"
                >
                  <Button
                    size="small"
                    icon={<SettingOutlined />}
                    type="text"
                    style={{ color: token.colorTextSecondary }}
                  >
                    ตั้งค่า
                  </Button>
                </Popover>
              </Space>
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportExcel}
                loading={exportLoading}
                disabled={data.length === 0}
                className={
                  data.length > 0
                    ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900 dark:bg-emerald-950/30"
                    : ""
                }
                style={
                  data.length > 0 ? {} : { color: token.colorTextDisabled }
                }
              >
                ดาวน์โหลด Excel
              </Button>
            </div>

            <Divider
              className="my-0"
              style={{ borderColor: token.colorBorderSecondary }}
            />

            {/* Table */}
            <Table
              columns={filteredColumns}
              dataSource={data}
              rowKey="project_id"
              loading={loading}
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                className: "px-6",
                showTotal: (t) => `ทั้งหมด ${t} รายการ`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="ไม่มีข้อมูล"
                  />
                ),
              }}
              scroll={{ x: 900 }}
              summary={(pageData) => {
                if (pageData.length === 0) return undefined;
                const hoursIdx = filteredColumns.findIndex(
                  (c) => c.key === "hours",
                );
                if (hoursIdx === -1) return undefined;

                const total = pageData.reduce(
                  (acc, curr) => acc + curr.hours,
                  0,
                );

                return (
                  <Table.Summary.Row
                    style={{
                      backgroundColor: token.colorFillQuaternary,
                      fontWeight: 600,
                    }}
                  >
                    <Table.Summary.Cell
                      index={0}
                      colSpan={hoursIdx}
                      align="right"
                    >
                      <span
                        className="pr-4 uppercase text-xs tracking-wider"
                        style={{ color: token.colorTextSecondary }}
                      >
                        รวมเฉพาะหน้านี้
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <span style={{ color: token.colorInfoText }}>
                        {total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>
        </Space>

        {/* 4. Detail Breakdown Modal */}
        <Modal
          title={
            <Space size={12}>
              <div
                className="p-2 rounded-xl"
                style={{
                  background: token.colorPrimaryBg,
                  color: token.colorPrimary,
                }}
              >
                <InfoCircleOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  รายละเอียดการวิเคราะห์รายโครงการ
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  แจกแจงที่มาของตัวเลขโดยแบ่งตาม Sub-project / Feature
                </Text>
              </div>
            </Space>
          }
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          width={900}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>
              ปิดหน้าต่าง
            </Button>,
          ]}
          className="rounded-2xl"
        >
          {selectedProject && (
            <div className="py-2">
              <div
                className="mb-6 p-4 rounded-xl border"
                style={{
                  backgroundColor: token.colorFillQuaternary,
                  borderColor: token.colorBorderSecondary,
                }}
              >
                <Row gutter={24}>
                  <Col span={12}>
                    <Text type="secondary" className="text-xs block mb-1">
                      โครงการ
                    </Text>
                    <Title level={5} style={{ margin: 0 }}>
                      [{selectedProject.project_code}]{" "}
                      {selectedProject.project_name}
                    </Title>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary" className="text-xs block mb-1">
                      ชั่วโมงรวม
                    </Text>
                    <Text
                      strong
                      style={{ fontSize: 18, color: token.colorInfoText }}
                    >
                      {selectedProject.hours} hrs
                    </Text>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary" className="text-xs block mb-1">
                      ช่วงเวลา
                    </Text>
                    <Text strong>
                      {dateRange[0].format("DD/MM/BB")} -{" "}
                      {dateRange[1].format("DD/MM/BB")}
                    </Text>
                  </Col>
                </Row>
              </div>

              <Table
                dataSource={selectedProject.details}
                rowKey={(record) =>
                  `${record.feature_id}-${record.asset_capture_type}`
                }
                pagination={false}
                size="middle"
                columns={[
                  {
                    title: "Sub-project / Feature",
                    dataIndex: "feature_name",
                    key: "feature_name",
                    render: (text) => <Text strong>{text}</Text>,
                  },
                  {
                    title: "ประเภทสินทรัพย์ (Asset Type)",
                    dataIndex: "asset_capture_type",
                    key: "asset_capture_type",
                    width: 250,
                    align: "center",
                    render: (type) => (
                      <Tag
                        color={type === "CAPTUREABLE" ? "success" : "default"}
                        icon={
                          type === "CAPTUREABLE" ? (
                            <BuildOutlined />
                          ) : (
                            <ToolOutlined />
                          )
                        }
                        style={{ padding: "4px 12px", borderRadius: 6 }}
                      >
                        {type === "CAPTUREABLE"
                          ? "งานสร้างใหม่ (Capitalization)"
                          : "งานบำรุงรักษา (Expense)"}
                      </Tag>
                    ),
                  },
                  {
                    title: "ชั่วโมง",
                    dataIndex: "hours",
                    key: "hours",
                    width: 120,
                    align: "right",
                    render: (val) => (
                      <Text strong style={{ color: token.colorInfoText }}>
                        {val.toLocaleString()}
                      </Text>
                    ),
                  },
                  {
                    title: "สัดส่วนในโครงการ",
                    dataIndex: "percent",
                    key: "percent",
                    width: 150,
                    render: (val) => (
                      <div className="w-full">
                        <Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                          className="block text-right mb-1"
                        >
                          {val}%
                        </Text>
                        <Progress
                          percent={val}
                          showInfo={false}
                          size="small"
                          strokeColor={token.colorPrimary}
                        />
                      </div>
                    ),
                  },
                ]}
                summary={(pageData) => {
                  const total = pageData.reduce(
                    (acc, curr) => acc + curr.hours,
                    0,
                  );
                  return (
                    <Table.Summary.Row
                      style={{ backgroundColor: token.colorFillQuaternary }}
                    >
                      <Table.Summary.Cell index={0} colSpan={2} align="right">
                        <Text strong>รวมทั้งหมด</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text
                          strong
                          style={{ fontSize: 16, color: token.colorInfoText }}
                        >
                          {total.toLocaleString()}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong>100%</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />

              <div
                className="mt-6 p-4 rounded-lg"
                style={{ backgroundColor: token.colorInfoBg }}
              >
                <Space align="start">
                  <InfoCircleOutlined
                    style={{ color: token.colorInfo, marginTop: 4 }}
                  />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <strong>หมายเหตุสำหรับการตรวจสอบ (IPO Audit Note):</strong>{" "}
                    ตัวเลขเปอร์เซ็นต์ "งานสร้างใหม่" และ "งานบำรุงรักษา"
                    ในหน้าหลัก คำนวณจากการนำชั่วโมงรวมของ Sub-project
                    แต่ละประเภทมาหารด้วยชั่วโมงรวมทั้งหมดของโครงการนี้
                    ตามรายละเอียดที่ปรากฏในตารางด้านบน
                  </Text>
                </Space>
              </div>
            </div>
          )}
        </Modal>
      </DashboardLayout>
    </PermissionLayout>
  );
}
