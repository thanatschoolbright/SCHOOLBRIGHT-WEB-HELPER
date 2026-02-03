"use client";

import {
  BuildOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileExcelOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  ProjectOutlined,
  SearchOutlined,
  SettingOutlined,
  TableOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Flex,
  Input,
  Modal,
  Popover,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import dayjs, { Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import SummaryCard from "@/components/card/summary-card";
import PermissionLayout from "@/components/layouts/permission-layout";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import DashboardLayout from "@components/layouts/backend-layout";

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
  const [searchText, setSearchText] = useState("");
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
   * * Fetch Report Data from API using Axios
   * @param startDate วันที่เริ่มต้น
   * @param endDate วันที่สิ้นสุด
   */
  const requestCapturableReport = async (
    startDate: string,
    endDate: string,
  ) => {
    setLoading(true);
    const toastId = toast.loading("กำลังดึงข้อมูลรายงาน...");
    try {
      const response = await axios.post(
        "/api/v1/timesheet/report/capturable-report",
        {
          start_date: startDate,
          end_date: endDate,
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
   * * Export Report to Excel using Axios
   */
  const requestExportExcel = async () => {
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

  /**
   * * Clear All Filters
   */
  const handleClearFilters = () => {
    setSearchText("");
    setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
  };

  // * Overall Statistics calculated from raw API response (Instruction 2.b)
  const overallStats = useMemo(() => {
    const totalHoursRaw = data.reduce((sum, item) => sum + item.hours, 0);
    const avgCapturableRaw =
      data.length > 0
        ? data.reduce((sum, item) => sum + item.capturable_percent, 0) /
          data.length
        : 0;
    const avgUncapturableRaw =
      data.length > 0
        ? data.reduce((sum, item) => sum + item.uncapturable_percent, 0) /
          data.length
        : 0;

    return {
      totalProjects: data.length,
      totalHours: totalHoursRaw,
      avgCapturable: avgCapturableRaw,
      avgUncapturable: avgUncapturableRaw,
    };
  }, [data]);

  // * Local Filtering for Table only
  const filteredTableData = useMemo(() => {
    if (!searchText) return data;
    const lower = searchText.toLowerCase();
    return data.filter(
      (item) =>
        item.project_name.toLowerCase().includes(lower) ||
        item.project_code.toLowerCase().includes(lower),
    );
  }, [data, searchText]);

  // * Table Columns Definition with Sorting
  const allColumns: ColumnsType<CapturableData> = [
    {
      title: "#",
      key: "index",
      align: "center",
      width: 60,
      render: (_, __, index) => (
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
          {index + 1}
        </Text>
      ),
    },
    {
      title: "รหัส",
      dataIndex: "project_code",
      key: "project_code",
      width: 100,
      align: "center",
      sorter: (a, b) => a.project_code.localeCompare(b.project_code),
      render: (code: string) => (
        <Tag variant="borderless" color="blue" style={{ fontWeight: 600 }}>
          {code}
        </Tag>
      ),
    },
    {
      title: "ชื่อโครงการ",
      dataIndex: "project_name",
      key: "project_name",
      width: 280,
      sorter: (a, b) => a.project_name.localeCompare(b.project_name),
      render: (name: string) => (
        <Text strong style={{ fontWeight: 600 }}>
          {name}
        </Text>
      ),
    },
    {
      title: "งานสร้างใหม่ (%)",
      dataIndex: "capturable_percent",
      key: "capturable_percent",
      width: 160,
      sorter: (a, b) => a.capturable_percent - b.capturable_percent,
      render: (value: number) => (
        <div className="w-full">
          <Flex justify="space-between" align="center" className="mb-1">
            <Text type="secondary" style={{ fontSize: 12 }}>
              Asset
            </Text>
            <Text strong style={{ color: token.colorSuccess, fontSize: 12 }}>
              {value.toFixed(0)}%
            </Text>
          </Flex>
          <Progress
            percent={value}
            showInfo={false}
            strokeColor={token.colorSuccess}
            size="small"
          />
        </div>
      ),
    },
    {
      title: "งานดูแล (%)",
      dataIndex: "uncapturable_percent",
      key: "uncapturable_percent",
      width: 160,
      sorter: (a, b) => a.uncapturable_percent - b.uncapturable_percent,
      render: (value: number) => (
        <div className="w-full">
          <Flex justify="space-between" align="center" className="mb-1">
            <Text type="secondary" style={{ fontSize: 12 }}>
              Expense
            </Text>
            <Text strong style={{ color: token.colorError, fontSize: 12 }}>
              {value.toFixed(0)}%
            </Text>
          </Flex>
          <Progress
            percent={value}
            showInfo={false}
            strokeColor={token.colorError}
            size="small"
          />
        </div>
      ),
    },
    {
      title: "ชั่วโมงรวม",
      dataIndex: "hours",
      key: "hours",
      width: 120,
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
        <Tag variant="borderless" color="cyan" style={{ fontWeight: 600 }}>
          {value.toFixed(2)}%
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 120,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          ghost
          icon={<InfoCircleOutlined />}
          onClick={() => openDetails(record)}
          style={{ fontWeight: 600 }}
        >
          รายละเอียด
        </Button>
      ),
    },
  ];

  const filteredColumns = useMemo(() => {
    return allColumns.filter((col) =>
      visibleColumns.includes(col.key as string),
    );
  }, [allColumns, visibleColumns]);

  const columnSelectorContent = (
    <div className="p-3 w-64">
      <Title
        level={5}
        className="mb-3 border-b pb-2"
        style={{ fontWeight: 600 }}
      >
        เลือกคอลัมน์แสดงผล
      </Title>
      <Checkbox.Group
        className="flex flex-col gap-3"
        options={columnOptions}
        value={visibleColumns}
        onChange={(checkedValues) => setVisibleColumns(checkedValues)}
      />
    </div>
  );

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <div className="w-full space-y-8">
          {/* ส่วนที่ 1: หัวข้อหน้าเว็ป */}
          <HeaderBar
            icon={<ProjectOutlined />}
            title="รายงานวิเคราะห์ทรัพย์สิน (Capitalization Report)"
            subTitle="เครื่องมือวิเคราะห์สัดส่วนงานรายโครงการเพื่อแยกประเภทสินทรัพย์และค่าใช้จ่าย"
            showBackButton={true}
          />

          {/* ส่วนที่ 2: บัตรสรุปข้อมูล (Summary Cards) */}
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} lg={6}>
              <SummaryCard
                title="โครงการทั้งหมด"
                value={overallStats.totalProjects}
                subtitle="จำนวนโครงการที่วิเคราะห์"
                icon={<ProjectOutlined />}
                color={token.colorPrimary}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <SummaryCard
                title="ชั่วโมงรวม"
                value={overallStats.totalHours.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
                subtitle="บันทึกในช่วงเวลานี้"
                icon={<ClockCircleOutlined />}
                color={token.colorInfo}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <SummaryCard
                title="เฉลี่ยงานสร้างใหม่"
                value={`${overallStats.avgCapturable.toFixed(1)}%`}
                subtitle="สัดส่วนสินทรัพย์ (Asset)"
                icon={<CheckCircleOutlined />}
                color={token.colorSuccess}
                percent={overallStats.avgCapturable}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <SummaryCard
                title="เฉลี่ยงานดูแล"
                value={`${overallStats.avgUncapturable.toFixed(1)}%`}
                subtitle="สัดส่วนค่าใช้จ่าย (Expense)"
                icon={<CloseCircleOutlined />}
                color={token.colorError}
                percent={overallStats.avgUncapturable}
              />
            </Col>
          </Row>

          {/* ส่วนที่ 3: ฟิลเตอร์และปุ่มค้นหา */}
          <Card
            variant="borderless"
            style={{ borderRadius: 16 }}
            styles={{ body: { padding: 24 } }}
          >
            <Flex align="center" gap={8} className="mb-6">
              <FilterOutlined
                style={{ color: token.colorPrimary, fontSize: 18 }}
              />
              <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                ตัวกรอง
              </Title>
            </Flex>

            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Text
                  strong
                  style={{ fontSize: 13, display: "block", marginBottom: 8 }}
                >
                  ค้นหาโครงการ
                </Text>
                <Input
                  size="large"
                  placeholder="ค้นหาด้วยรหัส หรือ ชื่อโครงการ..."
                  prefix={<SearchOutlined style={{ opacity: 0.5 }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Col>
              <Col xs={24} lg={12}>
                <Text
                  strong
                  style={{ fontSize: 13, display: "block", marginBottom: 8 }}
                >
                  ช่วงเวลาที่วิเคราะห์
                </Text>
                <RangePicker
                  className="w-full"
                  size="large"
                  value={dateRange}
                  onChange={(dates) =>
                    dates &&
                    dates[0] &&
                    dates[1] &&
                    setDateRange([dates[0], dates[1]])
                  }
                  format="DD MMM YYYY"
                  allowClear={false}
                />
              </Col>
            </Row>

            <Divider style={{ margin: "24px 0" }} />

            <Flex justify="end" gap={12}>
              <Button
                size="large"
                icon={<ClearOutlined />}
                onClick={handleClearFilters}
                style={{ fontWeight: 600 }}
              >
                ล้างการค้นหา
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                loading={loading}
                onClick={() =>
                  requestCapturableReport(
                    dateRange[0].format("YYYY-MM-DD"),
                    dateRange[1].format("YYYY-MM-DD"),
                  )
                }
                style={{ fontWeight: 600, padding: "0 32px" }}
              >
                วิเคราะห์ข้อมูล
              </Button>
            </Flex>
          </Card>

          {/* ส่วนที่ 4: ตารางข้อมูลเนื้อหา */}
          <Card
            styles={{ body: { padding: 16 } }}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Flex justify="space-between" align="center" className="mb-4">
              <Space size={12}>
                <TableOutlined
                  style={{ color: token.colorPrimary, fontSize: 18 }}
                />
                <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
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
                    ตั้งค่าคอลัมน์
                  </Button>
                </Popover>
              </Space>

              <Button
                icon={<FileExcelOutlined />}
                onClick={requestExportExcel}
                loading={exportLoading}
                disabled={data.length === 0}
                className={
                  data.length > 0
                    ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                    : ""
                }
                style={{ fontWeight: 600 }}
              >
                ดาวน์โหลด Excel
              </Button>
            </Flex>

            <Table<CapturableData>
              columns={filteredColumns}
              dataSource={filteredTableData}
              rowKey="project_id"
              loading={loading}
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              }}
              scroll={{ x: 1200 }}
              summary={(pageData) => {
                if (pageData.length === 0) return undefined;
                const hoursIdx = filteredColumns.findIndex(
                  (c) => (c as any).dataIndex === "hours" || c.key === "hours",
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
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        รวมเฉพาะหน้านี้
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ color: token.colorInfoText }}>
                        {total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>
        </div>

        {/* 5. Detail Breakdown Modal */}
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
                <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
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
            <Button
              key="close"
              onClick={() => setDetailModalOpen(false)}
              style={{ fontWeight: 600 }}
            >
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
                    <Text
                      type="secondary"
                      style={{ fontSize: 12 }}
                      className="block mb-1"
                    >
                      โครงการ
                    </Text>
                    <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                      [{selectedProject.project_code}]{" "}
                      {selectedProject.project_name}
                    </Title>
                  </Col>
                  <Col span={6}>
                    <Text
                      type="secondary"
                      style={{ fontSize: 12 }}
                      className="block mb-1"
                    >
                      ชั่วโมงรวม
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: 18,
                        color: token.colorInfoText,
                        fontWeight: 600,
                      }}
                    >
                      {selectedProject.hours} hrs
                    </Text>
                  </Col>
                  <Col span={6}>
                    <Text
                      type="secondary"
                      style={{ fontSize: 12 }}
                      className="block mb-1"
                    >
                      ช่วงเวลา
                    </Text>
                    <Text strong style={{ fontWeight: 600 }}>
                      {dateRange[0].format("DD/MM/YYYY")} -{" "}
                      {dateRange[1].format("DD/MM/YYYY")}
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
                    render: (text) => (
                      <Text strong style={{ fontWeight: 600 }}>
                        {text}
                      </Text>
                    ),
                  },
                  {
                    title: "ประเภทสินทรัพย์",
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
                        style={{
                          padding: "4px 12px",
                          borderRadius: 6,
                          fontWeight: 600,
                        }}
                      >
                        {type === "CAPTUREABLE"
                          ? "สร้างใหม่ (CapEx)"
                          : "ดูแล (OpEx)"}
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
                      <Text
                        strong
                        style={{ color: token.colorInfoText, fontWeight: 600 }}
                      >
                        {val.toLocaleString()}
                      </Text>
                    ),
                  },
                  {
                    title: "สัดส่วน",
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
                        <Text strong style={{ fontWeight: 600 }}>
                          รวมทั้งหมด
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text
                          strong
                          style={{
                            fontSize: 16,
                            color: token.colorInfoText,
                            fontWeight: 600,
                          }}
                        >
                          {total.toLocaleString()}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong style={{ fontWeight: 600 }}>
                          100%
                        </Text>
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
                    ตัวเลขเปอร์เซ็นต์คำนวณจากการนำชั่วโมงรวมของ Sub-project
                    แต่ละประเภทมาหารด้วยชั่วโมงรวมทั้งหมดของโครงการนี้
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
