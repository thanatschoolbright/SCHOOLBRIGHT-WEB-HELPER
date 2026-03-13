"use client";

import {
  CalendarOutlined,
  CheckCircleTwoTone,
  ClearOutlined,
  ClockCircleOutlined,
  ExclamationCircleTwoTone,
  FieldTimeOutlined,
  FilterOutlined,
  FireFilled,
  ProjectOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
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
  theme,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import SummaryCard from "@/components/card/summary-card";
import DashboardLayout from "@/components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { StatusModalComponent } from "@/components/modal/status-modal-component";
import { HeaderBar } from "@/components/typhography/header-bar-component";
import { callApiService } from "@/services/axios-instance/sb-helper.axios";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

/**
 * Interface สำหรับข้อมูลรายการบันทึกเวลา (Entry)
 */
interface TimesheetEntry {
  date: string;
  description: string;
  hours: number;
  project_name: string;
  feature_name: string;
  date_str: string;
  backlogDescription: {
    note: string;
    backlogs?: { link: string; title: string }[];
  };
}

/**
 * Interface สำหรับข้อมูลสรุปรายพนักงาน (Record)
 */
interface TimesheetRecord {
  admin_id: number;
  full_name: string;
  nickname: string;
  employee_code: string;
  position: string;
  department: string;
  image_profile: string | null;
  total_hours: number;
  required_hours: number;
  hours_gap: number;
  status_label: string;
  completion_rate: number;
  progress_text: string;
  entries: TimesheetEntry[];
  rank: number;
}

/**
 * Interface สำหรับ API Metadata
 */
interface TimesheetMetadata {
  range: {
    label_th: string;
  };
  working_days: number;
  expected_hours_per_member: number;
  total_expected_hours_all_members: number;
}

/**
 * หน้าตรวจสอบการลงเวลาทำงานรายวันของพนักงาน
 * (src/app/timesheet/all/description/page.tsx)
 */
export default function TimesheetDailyReportPage() {
  const { token } = theme.useToken();

  // --- States ---
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs(),
    dayjs(),
  ]);
  const [departmentIds, setDepartmentIds] = useState<number[]>([7, 9]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [records, setRecords] = useState<TimesheetRecord[]>([]);
  const [metadata, setMetadata] = useState<TimesheetMetadata | null>(null);

  // Status Modal State
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error" | "confirm";
    title?: string;
    message?: string;
  }>({
    open: false,
    type: "success",
  });

  /**
   * ดึงข้อมูลรายชื่อแผนก
   */
  const requestDepartments = useCallback(async () => {
    try {
      const response = await callApiService.get(
        "/api/v1/timesheet/department/list",
      );
      if (response.data.status === 200) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error("[DailyReport][departments]", error);
    }
  }, []);

  /**
   * ดึงข้อมูลรายงานการลงเวลาประจำวันจาก API
   */
  const requestFetchDailyReport = useCallback(async () => {
    try {
      setLoading(true);
      const payload = {
        start_date: dateRange[0].format("YYYY-MM-DD"),
        end_date: dateRange[1].format("YYYY-MM-DD"),
        department_ids: departmentIds,
      };

      const response = await callApiService.post(
        "/api/v1/timesheet/entry/check/summary",
        payload,
      );

      if (response.data.status === 200) {
        setRecords(response.data.data.records);
        setMetadata(response.data.data.metadata);
      } else {
        toast.error(response.data.message_th || "ไม่สามารถดึงข้อมูลได้");
      }
    } catch (error: any) {
      console.error("[DailyReport][fetch]", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  }, [dateRange, departmentIds]);

  // Initial load
  useEffect(() => {
    requestDepartments();
    requestFetchDailyReport();
  }, []);

  /**
   * กรองข้อมูลตาม Keyword (ชื่อ, นามสกุล, ชื่อเล่น, รหัสพนักงาน)
   */
  const filteredRecords = useMemo(() => {
    if (!keyword) return records;
    const lowerKeyword = keyword.toLowerCase();
    return records.filter(
      (rec) =>
        rec.full_name.toLowerCase().includes(lowerKeyword) ||
        rec.nickname.toLowerCase().includes(lowerKeyword) ||
        rec.employee_code.toLowerCase().includes(lowerKeyword) ||
        rec.department.toLowerCase().includes(lowerKeyword),
    );
  }, [records, keyword]);

  /**
   * คำนวณสรุปข้อมูลจาก Raw Data
   */
  const summaryStats = useMemo(() => {
    const totalMembers = records.length;
    const completedMembers = records.filter((r) => r.hours_gap <= 0).length;
    const totalHours = records.reduce((sum, r) => sum + r.total_hours, 0);
    const missingHours = records.reduce((sum, r) => sum + r.hours_gap, 0);

    return {
      totalMembers,
      completedMembers,
      incompleteMembers: totalMembers - completedMembers,
      totalHours,
      missingHours,
    };
  }, [records]);

  // --- Table Columns ---
  const columns: ColumnsType<TimesheetRecord> = [
    {
      title: "พนักงาน",
      key: "employee",
      fixed: "left",
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.image_profile}
            icon={<UserOutlined />}
            style={{ backgroundColor: token.colorPrimary }}
          />
          <Flex vertical>
            <Text strong>{record.full_name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.nickname ? `${record.nickname} | ` : ""}
              {record.employee_code}
            </Text>
          </Flex>
        </Space>
      ),
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: "แผนก/ตำแหน่ง",
      key: "department",
      width: 200,
      render: (_, record) => (
        <Flex vertical>
          <Text>{record.department}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.position}
          </Text>
        </Flex>
      ),
      sorter: (a, b) => a.department.localeCompare(b.department),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 150,
      align: "center",
      render: (_, record) => {
        const isComplete = record.hours_gap <= 0;
        const isOT = record.total_hours > 8;

        // กำหนดสีและ Icon ตามสถานะ
        let tagColor = isComplete ? "success" : "error";
        let tagIcon = isComplete ? (
          <CheckCircleTwoTone twoToneColor={token.colorSuccess} />
        ) : (
          <ExclamationCircleTwoTone twoToneColor={token.colorError} />
        );

        if (isOT) {
          tagColor = "warning"; // สีส้ม
          tagIcon = <FireFilled style={{ color: "#fa8c16" }} />;
        }

        return (
          <Tag
            color={tagColor}
            icon={tagIcon}
            style={{ borderRadius: 12, padding: "0 12px" }}
          >
            {isOT ? "เกิน 8 ชั่วโมง" : record.status_label}
          </Tag>
        );
      },
      sorter: (a, b) => a.hours_gap - b.hours_gap,
    },
    {
      title: "เวลาที่บันทึก",
      key: "progress",
      width: 180,
      align: "center",
      render: (_, record) => (
        <Flex vertical align="center">
          <Text
            strong
            style={{
              color:
                record.total_hours > 8
                  ? token.colorWarning
                  : record.hours_gap > 0
                    ? token.colorError
                    : token.colorSuccess,
            }}
          >
            {record.progress_text}
          </Text>
          <Badge
            status={
              record.total_hours > 8
                ? "warning"
                : record.hours_gap > 0
                  ? "error"
                  : "success"
            }
            text={`${record.completion_rate}%`}
          />
        </Flex>
      ),
      sorter: (a, b) => a.completion_rate - b.completion_rate,
    },
    {
      title: "รายละเอียดงาน",
      key: "entries",
      render: (_, record) => (
        <Flex vertical gap={8}>
          {record.entries.length > 0 ? (
            record.entries.map((entry, idx) => (
              <Card
                key={idx}
                size="small"
                styles={{ body: { padding: "8px 12px" } }}
                style={{
                  backgroundColor: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Flex vertical gap={4}>
                  <Flex justify="space-between">
                    <Space>
                      <ProjectOutlined style={{ color: token.colorPrimary }} />
                      <Text strong style={{ fontSize: 13 }}>
                        {entry.project_name}
                      </Text>
                    </Space>
                    <Tag color="processing" style={{ margin: 0 }}>
                      {entry.hours} ชม.
                    </Tag>
                  </Flex>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ฟีเจอร์: {entry.feature_name}
                  </Text>
                  <Text style={{ fontSize: 13, whiteSpace: "pre-line" }}>
                    {entry.description || "-"}
                  </Text>
                  {entry.backlogDescription.note && (
                    <Text italic type="warning" style={{ fontSize: 12 }}>
                      หมายเหตุ: {entry.backlogDescription.note}
                    </Text>
                  )}
                </Flex>
              </Card>
            ))
          ) : (
            <Text type="secondary" italic>
              ไม่พบข้อมูลการบันทึกงาน
            </Text>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <Flex vertical gap={24} style={{ padding: 24 }}>
          {/* Header */}
          <HeaderBar
            icon={<ClockCircleOutlined />}
            title="รายงานการลงเวลาประจำวัน"
            subTitle={
              metadata
                ? `ช่วงวันที่: ${metadata.range.label_th}`
                : "ตรวจสอบความเรียบร้อยในการกรอกไทม์ชีทรายวัน"
            }
            extra={
              <Button
                type="primary"
                icon={<ClockCircleOutlined />}
                onClick={requestFetchDailyReport}
                loading={loading}
                shape="round"
                size="large"
              >
                รีเฟรชข้อมูล
              </Button>
            }
          />

          {/* Summary Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <SummaryCard
                title="พนักงานทั้งหมด"
                value={summaryStats.totalMembers}
                icon={<UserOutlined />}
                color={token.colorPrimary}
                iconBg={token.colorPrimaryBg}
                suffix="คน"
                isLoading={loading}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <SummaryCard
                title="กรอกครบถ้วน"
                value={summaryStats.completedMembers}
                icon={<CalendarOutlined />}
                color={token.colorSuccess}
                iconBg={token.colorSuccessBg}
                suffix="คน"
                isLoading={loading}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <SummaryCard
                title="ยังไม่ครบ"
                value={summaryStats.incompleteMembers}
                icon={<FieldTimeOutlined />}
                color={token.colorError}
                iconBg={token.colorErrorBg}
                suffix="คน"
                isLoading={loading}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <SummaryCard
                title="ชั่วโมงรวม"
                value={summaryStats.totalHours}
                icon={<ClockCircleOutlined />}
                color={token.colorInfo}
                iconBg={token.colorInfoBg}
                suffix="ชม."
                isLoading={loading}
              />
            </Col>
          </Row>

          {/* Filters */}
          <Card styles={{ body: { padding: 24 } }}>
            <Flex vertical gap={16}>
              <Space size={8}>
                <FilterOutlined style={{ fontSize: "1rem", fontWeight: 600 }} />
                <Text strong style={{ fontSize: "1rem" }}>
                  ตัวกรอง
                </Text>
              </Space>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Flex vertical gap={8}>
                    <Text type="secondary">ค้นหาพนักงาน</Text>
                    <Input
                      placeholder="ระบุชื่อ, นามสกุล, ชื่อเล่น หรือรหัสพนักงาน"
                      prefix={
                        <SearchOutlined
                          style={{ color: token.colorTextPlaceholder }}
                        />
                      }
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      allowClear
                    />
                  </Flex>
                </Col>
                <Col xs={24} md={12}>
                  <Flex vertical gap={8}>
                    <Text type="secondary">ช่วงวันที่่</Text>
                    <RangePicker
                      style={{ width: "100%" }}
                      value={dateRange}
                      onChange={(dates) =>
                        dates && setDateRange([dates[0]!, dates[1]!])
                      }
                      format="DD/MM/YYYY"
                    />
                  </Flex>
                </Col>
                <Col xs={24} md={12}>
                  <Flex vertical gap={8}>
                    <Text type="secondary">แผนก</Text>
                    <Select
                      mode="multiple"
                      style={{ width: "100%" }}
                      placeholder="เลือกแผนก"
                      options={departments.map((d) => ({
                        label: d.name_th,
                        value: d.id,
                      }))}
                      value={departmentIds}
                      onChange={setDepartmentIds}
                      allowClear
                    />
                  </Flex>
                </Col>
                <Col xs={24} md={12}>
                  <Flex
                    justify="flex-end"
                    align="flex-end"
                    style={{ height: "100%" }}
                  >
                    <Space>
                      <Button
                        icon={<ClearOutlined />}
                        onClick={() => {
                          setKeyword("");
                          setDepartmentIds([7, 9]);
                          setDateRange([dayjs(), dayjs()]);
                        }}
                      >
                        ล้างการค้นหา
                      </Button>
                      <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={requestFetchDailyReport}
                        loading={loading}
                      >
                        ค้นหา
                      </Button>
                    </Space>
                  </Flex>
                </Col>
              </Row>
            </Flex>
          </Card>

          {/* Table */}
          <Card styles={{ body: { padding: 16 } }}>
            <Flex vertical gap={16}>
              <Flex justify="space-between" align="center">
                <Space size={12}>
                  <UnorderedListOutlined
                    style={{ fontSize: "1rem", color: token.colorPrimary }}
                  />
                  <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                    ตารางสรุปการลงเวลาประจำวัน
                  </Title>
                  {!loading && (
                    <Badge
                      count={filteredRecords.length}
                      style={{ backgroundColor: token.colorInfo }}
                    />
                  )}
                </Space>
              </Flex>

              <Table
                columns={columns}
                dataSource={filteredRecords}
                loading={loading}
                rowKey="admin_id"
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total) => `ทั้งหมด ${total} รายการ`,
                }}
              />
            </Flex>
          </Card>
        </Flex>

        <StatusModalComponent
          open={statusModal.open}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
        />
      </DashboardLayout>
    </PermissionLayout>
  );
}
