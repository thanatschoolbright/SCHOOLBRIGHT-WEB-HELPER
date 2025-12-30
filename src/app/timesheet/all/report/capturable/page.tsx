"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  DatePicker,
  Button,
  Progress,
  message,
  Tag,
  Tooltip,
  Divider,
  Popover,
  Checkbox,
  theme,
  Empty,
} from "antd";
import {
  FileExcelOutlined,
  SearchOutlined,
  PieChartOutlined,
  ProjectOutlined,
  BuildOutlined,
  ToolOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { useRouter } from "next/navigation";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";

const { RangePicker } = DatePicker;

interface CapturableData {
  project_id: number;
  project_code: string;
  project_name: string;
  capturable_percent: number;
  uncapturable_percent: number;
  hours: number;
  hours_percent: number;
}

const defaultCheckedList = [
  "index",
  "project_code",
  "project_name",
  "capturable_percent",
  "uncapturable_percent",
  "hours",
  "hours_percent",
];

const columnOptions = [
  { label: "# ลำดับ", value: "index" },
  { label: "Code", value: "project_code" },
  { label: "Project Name", value: "project_name" },
  { label: "Capturable (%)", value: "capturable_percent" },
  { label: "Uncapturable (%)", value: "uncapturable_percent" },
  { label: "Hours", value: "hours" },
  { label: "Impact (%)", value: "hours_percent" },
];

export default function CapturableReportPage() {
  const router = useRouter();
  const { token } = theme.useToken();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [data, setData] = useState<CapturableData[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const [visibleColumns, setVisibleColumns] =
    useState<any[]>(defaultCheckedList);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/v1/timesheet/report/capturable-report",
        {
          start_date: dateRange[0].format("YYYY-MM-DD"),
          end_date: dateRange[1].format("YYYY-MM-DD"),
        }
      );

      if (response.data.status === 200) {
        setData(response.data.data);
        messageApi.success(response.data.message_th || "ดึงข้อมูลสำเร็จ");
      }
    } catch (error: any) {
      messageApi.error(
        error.response?.data?.message_th || "เกิดข้อผิดพลาดในการดึงข้อมูล"
      );
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    setExportLoading(true);
    try {
      const response = await axios.post(
        "/api/v1/timesheet/report/capturable-report/export-excel",
        {
          start_date: dateRange[0].format("YYYY-MM-DD"),
          end_date: dateRange[1].format("YYYY-MM-DD"),
        },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `capturable-report-${dateRange[0].format(
          "YYYY-MM-DD"
        )}-to-${dateRange[1].format("YYYY-MM-DD")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      messageApi.success("ส่งออกไฟล์ Excel สำเร็จ");
    } catch (error: any) {
      messageApi.error("เกิดข้อผิดพลาดในการส่งออกไฟล์");
    } finally {
      setExportLoading(false);
    }
  };

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

  const allColumns: ColumnsType<CapturableData> = [
    {
      title: (
        <Tooltip title="ลำดับของรายการ">
          <span
            className="cursor-help flex items-center gap-1 text-xs font-semibold"
            style={{ color: token.colorTextSecondary }}
          >
            # <InfoCircleOutlined className="text-[10px]" />
          </span>
        </Tooltip>
      ),
      key: "index",
      align: "center",
      width: 60,
      render: (_, __, index) => (
        <span style={{ color: token.colorTextTertiary }} className="text-xs">
          {index + 1}
        </span>
      ),
    },
    {
      title: (
        <Tooltip title="รหัสอ้างอิงของโครงการ">
          <span
            className="cursor-help flex items-center gap-1 text-xs font-semibold"
            style={{ color: token.colorTextSecondary }}
          >
            Code <InfoCircleOutlined className="text-[10px]" />
          </span>
        </Tooltip>
      ),
      dataIndex: "project_code",
      key: "project_code",
      width: 100,
      align: "center",
      render: (code: string) => (
        <Tag
          color="blue"
          className="rounded-md font-medium border-none px-2 py-0.5"
        >
          {code}
        </Tag>
      ),
    },
    {
      title: (
        <Tooltip title="ชื่อโครงการ">
          <span
            className="cursor-help flex items-center gap-1 text-xs font-semibold"
            style={{ color: token.colorTextSecondary }}
          >
            Project Name <InfoCircleOutlined className="text-[10px]" />
          </span>
        </Tooltip>
      ),
      dataIndex: "project_name",
      key: "project_name",
      width: 300,
      render: (name: string) => (
        <span className="font-semibold" style={{ color: token.colorText }}>
          {name}
        </span>
      ),
    },
    {
      title: (
        <Tooltip
          title={
            <div>
              <div className="font-bold">Capturable (งานสร้างใหม่)</div>
              <div>สามารถบันทึกเป็นทรัพย์สินได้ (Asset)</div>
            </div>
          }
        >
          <span className="cursor-help flex items-center gap-1 text-emerald-600 font-semibold text-xs">
            <BuildOutlined /> Capturable
            <InfoCircleOutlined className="text-[10px] text-emerald-400" />
          </span>
        </Tooltip>
      ),
      dataIndex: "capturable_percent",
      key: "capturable_percent",
      width: 180,
      sorter: (a, b) => a.capturable_percent - b.capturable_percent,
      render: (value: number) => (
        <div className="w-full flex justify-between items-center gap-3">
          <Progress
            percent={Number(value.toFixed(2))}
            size={["100%", 6]}
            strokeColor="#10b981"
            showInfo={false}
            className="flex-1"
          />
          <span className="text-emerald-600 font-bold text-xs w-12 text-right">
            {value.toFixed(1)}%
          </span>
        </div>
      ),
    },
    {
      title: (
        <Tooltip
          title={
            <div>
              <div className="font-bold">Uncapturable (งานซ่อมสร้าง)</div>
              <div>บันทึกเป็นค่าใช้จ่าย/ซ่อมแซม (Expense)</div>
            </div>
          }
        >
          <span className="cursor-help flex items-center gap-1 text-rose-600 font-semibold text-xs">
            <ToolOutlined /> Uncapturable
            <InfoCircleOutlined className="text-[10px] text-rose-400" />
          </span>
        </Tooltip>
      ),
      dataIndex: "uncapturable_percent",
      key: "uncapturable_percent",
      width: 180,
      sorter: (a, b) => a.uncapturable_percent - b.uncapturable_percent,
      render: (value: number) => (
        <div className="w-full flex justify-between items-center gap-3">
          <Progress
            percent={Number(value.toFixed(2))}
            size={["100%", 6]}
            strokeColor="#f43f5e"
            showInfo={false}
            className="flex-1"
          />
          <span className="text-rose-600 font-bold text-xs w-12 text-right">
            {value.toFixed(1)}%
          </span>
        </div>
      ),
    },
    {
      title: (
        <Tooltip title="ชั่วโมงการทำงานรวมในโครงการนี้">
          <span
            className="cursor-help flex items-center gap-1 text-xs font-semibold"
            style={{ color: token.colorTextSecondary }}
          >
            Hours <InfoCircleOutlined className="text-[10px]" />
          </span>
        </Tooltip>
      ),
      dataIndex: "hours",
      key: "hours",
      width: 120,
      align: "right",
      sorter: (a, b) => a.hours - b.hours,
      render: (value: number) => (
        <span className="font-bold text-blue-600">
          {value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      title: (
        <Tooltip title="สัดส่วนเปอร์เซ็นต์เทียบกับชั่วโมงงานทั้งบริษัท">
          <span
            className="cursor-help flex items-center gap-1 text-xs font-semibold"
            style={{ color: token.colorTextSecondary }}
          >
            Impact (%) <InfoCircleOutlined className="text-[10px]" />
          </span>
        </Tooltip>
      ),
      dataIndex: "hours_percent",
      key: "hours_percent",
      width: 120,
      align: "center",
      sorter: (a, b) => a.hours_percent - b.hours_percent,
      render: (value: number) => (
        <Tag
          bordered={false}
          style={{
            backgroundColor: token.colorFillSecondary,
            color: token.colorTextSecondary,
          }}
          className="font-medium rounded-full px-3"
        >
          {value.toFixed(2)}%
        </Tag>
      ),
    },
  ];

  const filteredColumns = useMemo(() => {
    return allColumns.filter((col) =>
      visibleColumns.includes(col.key as string)
    );
  }, [allColumns, visibleColumns]);

  const columnSelectorContent = (
    <div className="w-52 p-2">
      <div
        className="mb-3 border-b pb-2"
        style={{ borderColor: token.colorBorderSecondary }}
      >
        <span className="font-semibold" style={{ color: token.colorText }}>
          แสดงคอลัมน์
        </span>
      </div>
      <Checkbox.Group
        className="flex flex-col gap-2.5"
        options={columnOptions}
        value={visibleColumns}
        onChange={(checkedValues) => setVisibleColumns(checkedValues)}
      />
    </div>
  );

  return (
    <PermissionLayout role={["ALL"]}>
      {contextHolder}
      <DashboardLayout>
        {/* Main Container */}
        <div className="min-h-screen p-6 md:p-8 font-sans">
          <div className="flex flex-col gap-8 w-full mx-auto">
            {/* 1. Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="flex items-start gap-4">
                {/* Back Button */}
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/timesheet/all")}
                  className="mt-1 h-10 w-10 p-0 flex items-center justify-center rounded-lg"
                  style={{
                    color: token.colorText,
                    backgroundColor: "transparent",
                  }}
                />

                <div>
                  <h2
                    className="text-2xl font-bold m-0 flex items-center gap-3"
                    style={{ color: token.colorText }}
                  >
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: token.colorFillQuaternary }}
                    >
                      <PieChartOutlined
                        style={{ color: token.colorPrimary }}
                        className="text-xl"
                      />
                    </div>
                    Capturable Analytics
                  </h2>
                  <p
                    className="mt-2 text-sm pl-[52px]"
                    style={{ color: token.colorTextSecondary }}
                  >
                    วิเคราะห์สัดส่วนงานสร้างใหม่ (Asset)
                    เปรียบเทียบกับงานซ่อมสร้าง (Maintenance)
                  </p>
                </div>
              </div>

              {/* Filter Section */}
              <div
                className="rounded-2xl shadow-sm border p-1.5 pl-4 flex flex-wrap items-center gap-3"
                style={{
                  backgroundColor: token.colorBgContainer,
                  borderColor: token.colorBorderSecondary,
                }}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: token.colorTextTertiary }}
                >
                  Period:
                </span>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) =>
                    dates &&
                    dates[0] &&
                    dates[1] &&
                    setDateRange([dates[0], dates[1]])
                  }
                  format="DD/MM/YYYY"
                  variant="borderless"
                  className="w-[240px]"
                  allowClear={false}
                />
                <Divider
                  type="vertical"
                  className="h-6 m-0"
                  style={{ borderColor: token.colorBorderSecondary }}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={fetchReport}
                  loading={loading}
                  shape="round"
                  className="px-6 h-9 shadow-md"
                  style={{ boxShadow: `0 2px 0 ${token.colorPrimary}33` }}
                >
                  Analyze
                </Button>
              </div>
            </div>

            {/* 2. Statistics Grid */}
            {data.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Stat Card 1: Projects */}
                <div
                  className="p-6 rounded-2xl shadow-sm border transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: token.colorBgContainer,
                    borderColor: token.colorBorderSecondary,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-1"
                        style={{ color: token.colorTextTertiary }}
                      >
                        Projects
                      </p>
                      <h3
                        className="text-3xl font-bold m-0"
                        style={{ color: token.colorText }}
                      >
                        {data.length}
                      </h3>
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: token.colorFillQuaternary,
                        color: token.colorTextSecondary,
                      }}
                    >
                      <ProjectOutlined className="text-lg" />
                    </div>
                  </div>
                </div>

                {/* Stat Card 2: Hours */}
                <div
                  className="p-6 rounded-2xl shadow-sm border transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: token.colorBgContainer,
                    borderColor: token.colorBorderSecondary,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-1"
                        style={{ color: token.colorTextTertiary }}
                      >
                        Total Hours
                      </p>
                      <h3 className="text-3xl font-bold text-blue-600 m-0">
                        {totalHours.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <PieChartOutlined className="text-lg" />
                    </div>
                  </div>
                </div>

                {/* Stat Card 3: Capturable */}
                <div
                  className="p-6 rounded-2xl shadow-sm border transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: token.colorBgContainer,
                    borderColor: token.colorBorderSecondary,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className="text-xs font-semibold uppercase tracking-wider m-0"
                          style={{ color: token.colorTextTertiary }}
                        >
                          Avg. Capturable
                        </p>
                        <Tooltip title="งานสร้างใหม่ (Asset)">
                          <InfoCircleOutlined
                            className="text-xs cursor-help"
                            style={{ color: token.colorTextTertiary }}
                          />
                        </Tooltip>
                      </div>
                      <h3 className="text-3xl font-bold text-emerald-500 m-0">
                        {avgCapturable.toFixed(2)}
                        <span className="text-lg text-emerald-300 ml-1">%</span>
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                      <BuildOutlined className="text-lg" />
                    </div>
                  </div>
                </div>

                {/* Stat Card 4: Uncapturable */}
                <div
                  className="p-6 rounded-2xl shadow-sm border transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: token.colorBgContainer,
                    borderColor: token.colorBorderSecondary,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className="text-xs font-semibold uppercase tracking-wider m-0"
                          style={{ color: token.colorTextTertiary }}
                        >
                          Avg. Uncapturable
                        </p>
                        <Tooltip title="งานซ่อมสร้าง (Expense)">
                          <InfoCircleOutlined
                            className="text-xs cursor-help"
                            style={{ color: token.colorTextTertiary }}
                          />
                        </Tooltip>
                      </div>
                      <h3 className="text-3xl font-bold text-rose-500 m-0">
                        {avgUncapturable.toFixed(2)}
                        <span className="text-lg text-rose-300 ml-1">%</span>
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                      <ToolOutlined className="text-lg" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Table Section */}
            <div
              className="rounded-2xl shadow-sm border overflow-hidden"
              style={{
                backgroundColor: token.colorBgContainer,
                borderColor: token.colorBorderSecondary,
              }}
            >
              <div
                className="px-6 py-5 flex flex-col md:flex-row justify-between items-center border-b gap-4"
                style={{
                  backgroundColor: token.colorBgContainer,
                  borderColor: token.colorBorderSecondary,
                }}
              >
                <div className="flex items-center gap-3">
                  <h3
                    className="text-lg font-bold m-0"
                    style={{ color: token.colorText }}
                  >
                    Detailed Breakdown
                  </h3>

                  <Popover
                    content={columnSelectorContent}
                    title={null}
                    trigger="click"
                    placement="bottomLeft"
                    arrow={false}
                  >
                    <button
                      className="text-xs font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                      style={{
                        color: token.colorTextSecondary,
                        backgroundColor: token.colorFillQuaternary,
                      }}
                    >
                      <SettingOutlined /> Columns
                    </button>
                  </Popover>
                </div>

                <Button
                  icon={<FileExcelOutlined />}
                  onClick={exportExcel}
                  loading={exportLoading}
                  disabled={data.length === 0}
                  className={`border-none shadow-none font-medium h-9 rounded-lg ${
                    data.length > 0
                      ? "bg-emerald-50 text-emerald-600 hover:!bg-emerald-100 hover:!text-emerald-700"
                      : ""
                  }`}
                  style={
                    data.length === 0
                      ? {
                          backgroundColor: token.colorFillSecondary,
                          color: token.colorTextDisabled,
                        }
                      : {}
                  }
                >
                  Export Excel
                </Button>
              </div>

              <Table
                columns={filteredColumns}
                dataSource={data}
                rowKey="project_id"
                loading={loading}
                pagination={{
                  pageSize: 100,
                  showSizeChanger: true,
                  showTotal: (total) => (
                    <span
                      className="text-xs"
                      style={{ color: token.colorTextSecondary }}
                    >
                      Total {total} items
                    </span>
                  ),
                  className: "px-6 py-4",
                }}
                scroll={{ x: 1000 }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="ไม่พบข้อมูล"
                    />
                  ),
                }}
                summary={(pageData) => {
                  if (pageData.length === 0) return undefined;
                  const totalPageHours = pageData.reduce(
                    (sum, item) => sum + item.hours,
                    0
                  );

                  const hoursColumnIndex = filteredColumns.findIndex(
                    (c) => c.key === "hours"
                  );

                  if (hoursColumnIndex === -1) return undefined;

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row
                        style={{
                          backgroundColor: token.colorFillQuaternary,
                        }}
                        className="font-bold"
                      >
                        <Table.Summary.Cell
                          index={0}
                          colSpan={hoursColumnIndex}
                          align="right"
                        >
                          <span
                            className="text-xs uppercase tracking-wider"
                            style={{ color: token.colorTextSecondary }}
                          >
                            Page Total
                          </span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <span className="text-blue-600 text-base">
                            {totalPageHours.toFixed(2)}
                          </span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
