"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  DatePicker,
  Button,
  Space,
  Progress,
  message,
  Tag,
  Tooltip,
  Divider,
  Popover,
  Checkbox,
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

// ** Config: รายชื่อ Column ทั้งหมดสำหรับ Filter **
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
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [data, setData] = useState<CapturableData[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  // ** State: Column Visibility **
  const [visibleColumns, setVisibleColumns] =
    useState<any[]>(defaultCheckedList);

  // ** Actions **
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

  // ** Calculations **
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

  // ** Columns Definition (Full List) **
  const allColumns: ColumnsType<CapturableData> = [
    {
      title: (
        <Tooltip title="ลำดับของรายการ">
          <span className="cursor-help flex items-center gap-1 text-xs font-semibold text-slate-500">
            # <InfoCircleOutlined className="text-[10px]" />
          </span>
        </Tooltip>
      ),
      key: "index",
      align: "center",
      width: 60,
      render: (_, __, index) => (
        <span className="text-slate-400 text-xs">{index + 1}</span>
      ),
    },
    {
      title: (
        <Tooltip title="รหัสอ้างอิงของโครงการ">
          <span className="cursor-help flex items-center gap-1 text-xs font-semibold text-slate-500">
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
          className="rounded-md font-medium border-none px-2 py-0.5 text-blue-600"
        >
          {code}
        </Tag>
      ),
    },
    {
      title: (
        <Tooltip title="ชื่อโครงการ">
          <span className="cursor-help flex items-center gap-1 text-xs font-semibold text-slate-500">
            Project Name <InfoCircleOutlined className="text-[10px]" />
          </span>
        </Tooltip>
      ),
      dataIndex: "project_name",
      key: "project_name",
      width: 300,
      render: (name: string) => (
        <span className="font-semibold text-slate-700">{name}</span>
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
            strokeColor="#10b981" // emerald-500
            trailColor="#ecfdf5" // emerald-50
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
            strokeColor="#f43f5e" // rose-500
            trailColor="#fff1f2" // rose-50
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
          <span className="cursor-help flex items-center gap-1 text-xs font-semibold text-slate-500">
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
          <span className="cursor-help flex items-center gap-1 text-xs font-semibold text-slate-500">
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
          className="bg-slate-100 text-slate-600 font-medium rounded-full px-3"
        >
          {value.toFixed(2)}%
        </Tag>
      ),
    },
  ];

  // ** Filter Columns based on selection **
  const filteredColumns = useMemo(() => {
    return allColumns.filter((col) =>
      visibleColumns.includes(col.key as string)
    );
  }, [allColumns, visibleColumns]);

  // ** Column Selector Content (Popover) **
  const columnSelectorContent = (
    <div className="w-52 p-2">
      <div className="mb-3 border-b border-slate-100 pb-2">
        <span className="font-semibold text-slate-700">แสดงคอลัมน์</span>
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
                  className="mt-1 hover:bg-slate-100 h-10 w-10 p-0 flex items-center justify-center rounded-lg"
                />

                <div>
                  <h2 className="text-2xl font-bold m-0 flex items-center gap-3 text-slate-800">
                    <div className="p-2  rounded-lg">
                      <PieChartOutlined className="text-blue-600 text-xl" />
                    </div>
                    Capturable Analytics
                  </h2>
                  <p className="text-slate-500 mt-2 text-sm pl-[52px]">
                    วิเคราะห์สัดส่วนงานสร้างใหม่ (Asset)
                    เปรียบเทียบกับงานซ่อมสร้าง (Maintenance)
                  </p>
                </div>
              </div>

              {/* Filter Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 pl-4 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
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
                  className="bg-transparent hover:bg-slate-50 rounded-lg w-[240px]"
                  allowClear={false}
                />
                <Divider type="vertical" className="h-6 m-0 border-slate-200" />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={fetchReport}
                  loading={loading}
                  shape="round"
                  className="px-6 bg-blue-600 hover:bg-blue-500 border-none shadow-md shadow-blue-200 h-9"
                >
                  Analyze
                </Button>
              </div>
            </div>

            {/* 2. Statistics Grid */}
            {data.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Stat Card 1: Projects */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                        Projects
                      </p>
                      <h3 className="text-3xl font-bold text-slate-800 m-0">
                        {data.length}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <ProjectOutlined className="text-lg" />
                    </div>
                  </div>
                </div>

                {/* Stat Card 2: Hours */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
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
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider m-0">
                          Avg. Capturable
                        </p>
                        <Tooltip title="งานสร้างใหม่ (Asset)">
                          <InfoCircleOutlined className="text-slate-300 text-xs cursor-help" />
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
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider m-0">
                          Avg. Uncapturable
                        </p>
                        <Tooltip title="งานซ่อมสร้าง (Expense)">
                          <InfoCircleOutlined className="text-slate-300 text-xs cursor-help" />
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-5 flex flex-col md:flex-row justify-between items-center border-b border-slate-100 gap-4 bg-white">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-700 m-0">
                    Detailed Breakdown
                  </h3>

                  <Popover
                    content={columnSelectorContent}
                    title={null}
                    trigger="click"
                    placement="bottomLeft"
                    arrow={false}
                  >
                    <button className="text-xs font-medium text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                      <SettingOutlined /> Columns
                    </button>
                  </Popover>
                </div>

                <Button
                  icon={<FileExcelOutlined />}
                  onClick={exportExcel}
                  loading={exportLoading}
                  disabled={data.length === 0}
                  className={`
                    border-none shadow-none font-medium h-9 rounded-lg
                    ${
                      data.length > 0
                        ? "bg-emerald-50 text-emerald-600 hover:!bg-emerald-100 hover:!text-emerald-700"
                        : "bg-slate-100 text-slate-400"
                    }
                  `}
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
                    <span className="text-slate-400 text-xs">
                      Total {total} items
                    </span>
                  ),
                  className: "px-6 py-4",
                }}
                scroll={{ x: 1000 }}
                // Tailwind styles for Ant Design Table using Arbitrary Variants
                className="
                  [&_.ant-table-thead_th]:!bg-slate-50/80 
                  [&_.ant-table-thead_th]:!text-slate-500 
                  [&_.ant-table-thead_th]:!font-semibold
                  [&_.ant-table-thead_th]:!border-b-slate-100
                  [&_.ant-table-tbody_td]:!border-b-slate-50
                  [&_.ant-table-tbody_tr:hover_td]:!bg-blue-50/30
                "
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
                      <Table.Summary.Row className="!bg-slate-50 font-bold">
                        <Table.Summary.Cell
                          index={0}
                          colSpan={hoursColumnIndex}
                          align="right"
                        >
                          <span className="text-slate-500 text-xs uppercase tracking-wider">
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
