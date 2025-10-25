"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Card,
  Form,
  Space,
  Tag,
  Typography,
  Pagination,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Empty,
  Spin,
  Badge,
  Avatar,
  Progress,
  Collapse,
} from "antd";
import {
  CopyOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  FireOutlined,
  StarOutlined,
  RocketOutlined,
  TrophyOutlined,
  HeartOutlined,
  GiftOutlined,
  CrownOutlined,
  SunOutlined,
  MoonOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  PauseCircleOutlined,
  StopOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";

import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import i18next from "i18next";
import { toast } from "sonner";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { TimesheetActions } from "@components/button/timesheet-actions";
import { TimesheetStatCard } from "@components/card/timesheet-stat-card";
import { DeleteConfirmationModal } from "@components/modal/delete-confirmation-modal";
import { DetailModal } from "@components/timesheet/detail-modal";
import { WeeklySummary } from "@components/timesheet/weekly-summary";
import {
  useDailySummary,
  useTimesheetEntries,
  useTopUsage,
  useWeeklySummary,
} from "@/hooks/use-timesheet-data";
import { useAppSelector } from "@stores/store";
import {
  setActiveRecord,
  setFormMode,
  setLoading,
  setModalType,
  setProjects,
  setSelectedRowKeys,
  setSubProjects,
} from "@stores/reducers/timesheet/timesheet-reducer";
import { useDispatch } from "react-redux";

import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import { CreateModalForm } from "../entry/create";
import {
  MonthlyRankBoard,
  MonthlyRankBoardRef,
} from "../entry/monthly-rank-board";
import { useRouter } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";

dayjs.extend(isBetween);

export interface TimesheetEntry {
  id: number;
  date: string;
  project_id: number;
  project_name: string;
  feature_id?: number | null;
  feature_name?: string | null;
  status: string;
  hours: number;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

const DATE_FORMAT = "DD/MM/YYYY";
const DAILY_TARGET_HOURS = 8;

const statusColorMap: Record<string, string> = {
  DONE: "green",
  IN_PROGRESS: "orange",
  REVIEW: "blue",
  CANCELLED: "red",
  DRAFT: "default",
};

const statusIconMap: Record<string, any> = {
  DONE: CheckCircleOutlined,
  IN_PROGRESS: SyncOutlined,
  REVIEW: PlayCircleOutlined,
  CANCELLED: StopOutlined,
  DRAFT: PauseCircleOutlined,
};

export default function Page() {
  const dispatch = useDispatch();
  const router = useRouter();
  const i18n = i18next;
  const [form] = Form.useForm();
  const isMountedRef = useRef(true);
  const rankBoardRef = useRef<MonthlyRankBoardRef>(null);

  //** ดึงข้อมูล Admin ID จาก Redux Store */
  const authState = useAppSelector((state) => state.callAdminLogin);
  const timesheetState = useAppSelector((state) => state.timesheet);

  const adminId = useMemo(
    () => Number(authState?.response?.data?.user_data?.admin_id) || undefined,
    [authState?.response?.data?.user_data?.admin_id]
  );

  //** State สำหรับการจัดการ UI */
  const [actionLoading, setActionLoading] = useState(false);

  // Filter States
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined
  );
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [selectedProject, setSelectedProject] = useState<number | undefined>(
    undefined
  );

  //** ใช้ Custom Hooks สำหรับจัดการข้อมูล */
  const {
    entries,
    loading: tableLoading,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    refetch: refetchEntries,
  } = useTimesheetEntries(adminId);

  const dailySummary = useDailySummary(entries);
  const weeklySummary = useWeeklySummary(dailySummary);
  const { topProjectUsage, topFeatureUsage } = useTopUsage(entries);

  // Filtered entries based on search and filters
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Text search
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesText =
          entry.project_name.toLowerCase().includes(searchLower) ||
          entry.feature_name?.toLowerCase().includes(searchLower) ||
          entry.description?.toLowerCase().includes(searchLower);
        if (!matchesText) return false;
      }

      // Status filter
      if (selectedStatus && entry.status !== selectedStatus) {
        return false;
      }

      // Date range filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const entryDate = dayjs(entry.date);
        if (!entryDate.isBetween(dateRange[0], dateRange[1], "day", "[]")) {
          return false;
        }
      }

      // Project filter
      if (selectedProject && entry.project_id !== selectedProject) {
        return false;
      }

      return true;
    });
  }, [entries, searchText, selectedStatus, dateRange, selectedProject]);

  // Pagination for filtered data
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredEntries.slice(start, end);
  }, [filteredEntries, currentPage, pageSize]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  //** ฟังก์ชันเรียก API สำหรับโหลดโปรเจ็กต์ */
  const GET_PROJECTS_FUNCTION = useCallback(async () => {
    const TOAST_ID = "fetch-projects";
    try {
      toast.loading("กำลังโหลดรายการโปรเจ็ค...", { id: TOAST_ID });
      dispatch(setLoading(true));

      const response = await axios.post("/api/v1/timesheet/project/read/", {
        limit: 100,
        page: 1,
      });

      if (!isMountedRef.current) return;
      dispatch(setProjects(response.data?.data ?? []));
      toast.success("โหลดรายการโปรเจ็คสำเร็จ", { id: TOAST_ID });
    } catch (error: any) {
      console.error("GET_PROJECTS_FUNCTION", error);
      toast.error("โหลดรายการโปรเจ็คไม่สำเร็จ", {
        id: TOAST_ID,
        description: error?.message ?? "Unexpected error",
      });
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  //** ฟังก์ชันเรียก API สำหรับโหลดโปรเจ็กต์ย่อย */
  const GET_SUB_PROJECTS_FUNCTION = useCallback(
    async (projectId: number) => {
      if (!projectId) {
        dispatch(setSubProjects([]));
        return [];
      }

      const TOAST_ID = "fetch-sub-projects";
      try {
        toast.loading("กำลังโหลดรายการฟีเจอร์...", { id: TOAST_ID });

        const response = await axios.post(
          "/api/v1/timesheet/project/sub-project/read/",
          {
            limit: 100,
            page: 1,
            project_id: Number(projectId),
          }
        );

        const items = response.data?.data?.items ?? [];
        if (isMountedRef.current) {
          dispatch(setSubProjects(items));
        }

        toast.success("โหลดรายการฟีเจอร์สำเร็จ", { id: TOAST_ID });
        return items;
      } catch (error: any) {
        console.error("GET_SUB_PROJECTS_FUNCTION", error);
        if (isMountedRef.current) {
          dispatch(setSubProjects([]));
        }
        toast.error("โหลดรายการฟีเจอร์ไม่สำเร็จ", {
          id: TOAST_ID,
          description: error?.message ?? "Unexpected error",
        });
        return [];
      }
    },
    [dispatch]
  );

  useEffect(() => {
    GET_PROJECTS_FUNCTION();
  }, [GET_PROJECTS_FUNCTION]);

  //** ปิด modal และรีเซ็ตค่า */
  const closeModal = useCallback(() => {
    dispatch(setModalType(null));
    dispatch(setActiveRecord(null));
    dispatch(setFormMode("create"));
    form.resetFields();
  }, [dispatch, form]);

  //** เปิดฟอร์มโหมดสร้างใหม่ */
  const openCreateForm = useCallback(() => {
    dispatch(setFormMode("create"));
    dispatch(setActiveRecord(null));
    dispatch(setSubProjects([]));
    form.setFieldsValue({
      project_id: undefined,
      sub_project_id: undefined,
      description: "",
      work_hour: undefined,
      status: undefined,
      date: dayjs(),
    });
    dispatch(setModalType("form"));
  }, [dispatch, form]);

  //** เปิดฟอร์มโหมดแก้ไข */
  const openEditForm = useCallback(
    async (record: TimesheetEntry) => {
      dispatch(setFormMode("edit"));
      dispatch(setActiveRecord(record));
      await GET_SUB_PROJECTS_FUNCTION(Number(record.project_id));
      if (!isMountedRef.current) return;

      form.setFieldsValue({
        project_id: Number(record.project_id),
        sub_project_id: record.feature_id
          ? Number(record.feature_id)
          : undefined,
        description: record.description ?? "",
        work_hour: Number(record.hours) || undefined,
        status: record.status,
        date: dayjs(record.date),
      });
      dispatch(setModalType("form"));
    },
    [dispatch, GET_SUB_PROJECTS_FUNCTION, form]
  );

  //** เปิดฟอร์มโหมดคัดลอก */
  const openCopyForm = useCallback(
    async (record: TimesheetEntry) => {
      dispatch(setFormMode("copy"));
      dispatch(setActiveRecord(null));
      await GET_SUB_PROJECTS_FUNCTION(Number(record.project_id));
      if (!isMountedRef.current) return;

      form.setFieldsValue({
        project_id: Number(record.project_id),
        sub_project_id: record.feature_id
          ? Number(record.feature_id)
          : undefined,
        description: record.description ?? "",
        work_hour: Number(record.hours) || undefined,
        status: record.status,
        date: dayjs(record.date),
      });
      dispatch(setModalType("form"));
    },
    [dispatch, GET_SUB_PROJECTS_FUNCTION, form]
  );

  //** เปิด Modal รายละเอียด */
  const openDetailModal = useCallback(
    (record: TimesheetEntry) => {
      dispatch(setActiveRecord(record));
      dispatch(setModalType("detail"));
    },
    [dispatch]
  );

  //** เปิด Modal ยืนยันการลบ */
  const openDeleteModal = useCallback(() => {
    dispatch(setModalType("delete"));
  }, [dispatch]);

  //** บันทึกข้อมูลฟอร์ม */
  const SUBMIT_TIMESHEET_FUNCTION = useCallback(async () => {
    const TOAST_ID = "submit-form";
    try {
      const values = await form.validateFields();
      setActionLoading(true);

      toast.loading("กำลังบันทึกข้อมูล...", { id: TOAST_ID });

      const payload = {
        id:
          timesheetState.formMode === "edit"
            ? timesheetState.activeRecord?.id
            : undefined,
        project_id: values.project_id,
        sub_project_id: values.sub_project_id,
        description: values.description ?? "",
        work_hour: values.work_hour,
        status: values.status,
        date: values.date ? dayjs(values.date).toDate() : undefined,
        by: adminId,
      };

      await axios.post("/api/v1/timesheet/entry/insert/", payload, {
        headers: { "Content-Type": "application/json" },
      });

      toast.success("บันทึกข้อมูลสำเร็จ", { id: TOAST_ID });

      if (!isMountedRef.current) return;
      closeModal();
      refetchEntries();
      rankBoardRef.current?.refetch();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error("SUBMIT_TIMESHEET_FUNCTION", error);
      toast.error("บันทึกข้อมูลล้มเหลว", {
        id: TOAST_ID,
        description: error?.message ?? "Unexpected error",
      });
    } finally {
      if (isMountedRef.current) {
        setActionLoading(false);
      }
    }
  }, [
    timesheetState?.activeRecord?.id,
    timesheetState?.formMode,
    adminId,
    closeModal,
    refetchEntries,
    form,
  ]);

  //** ลบหลายรายการ */
  const DELETE_TIMESHEET_FUNCTION = useCallback(async () => {
    if (!timesheetState.selectedRowKeys.length) return;

    const TOAST_ID = "bulk-delete";
    try {
      setActionLoading(true);
      toast.loading("กำลังลบรายการ...", { id: TOAST_ID });

      await axios.post(
        "/api/v1/timesheet/entry/delete/",
        {
          ids: timesheetState.selectedRowKeys.map((key: any) => Number(key)),
          by: adminId,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success("ลบรายการสำเร็จ", { id: TOAST_ID });

      if (isMountedRef.current) {
        dispatch(setSelectedRowKeys([]));
        closeModal();
        refetchEntries();
        rankBoardRef.current?.refetch();
      }
    } catch (error: any) {
      console.error("DELETE_TIMESHEET_FUNCTION", error);
      toast.error("ลบรายการล้มเหลว", {
        id: TOAST_ID,
        description: error?.message ?? "Unexpected error",
      });
    } finally {
      if (isMountedRef.current) {
        setActionLoading(false);
      }
    }
  }, [
    adminId,
    closeModal,
    refetchEntries,
    timesheetState?.selectedRowKeys,
    dispatch,
  ]);

  const clearFilters = useCallback(() => {
    setSearchText("");
    setSelectedStatus(undefined);
    setDateRange(null);
    setSelectedProject(undefined);
    setCurrentPage(1);
  }, [setCurrentPage]);

  // Get unique projects for filter
  const projectOptions = useMemo(() => {
    return timesheetState.projects.map((project) => ({
      label: project.name,
      value: project.id,
    }));
  }, [timesheetState.projects]);

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <div
          style={{
            padding: "24px",
            minHeight: "100vh",
          }}
        >
          {/* ปุ่มย้อนกลับ */}
         <Space style={{ marginBottom: 24 }}>
             <Button
            type="default"
            icon={<FiArrowRight className="w-5 h-5 rotate-180" />}
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center" }}
          >
            ย้อนกลับ
          </Button>
         </Space>

          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* หัวข้อหน้า */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 8,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: 16,
                  padding: "24px 32px",
                  boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    padding: 16,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <RocketOutlined style={{ fontSize: 28, color: "white" }} />
                </div>
                <div>
                  <Typography.Title
                    level={4}
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: 24,
                      color: "white",
                    }}
                  >
                    การลงเวลาทำงาน
                  </Typography.Title>
                  <Typography.Text
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    จัดการและติดตามเวลาทำงานอย่างมีประสิทธิภาพ
                  </Typography.Text>
                </div>
              </div>
            </div>

            {/* การ์ดสถิติด้านบน */}
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                alignItems: "stretch",
              }}
            >
              {/* บอร์ดอันดับรายเดือน */}
              <MonthlyRankBoard
                ref={rankBoardRef}
                currentAdminId={adminId}
                variant="wide"
              />

              {/* การ์ดโปรเจ็คที่ใช้เวลามากที่สุด */}
              {topProjectUsage && (
                <TimesheetStatCard
                  title="โปรเจ็คยอดนิยม"
                  value={topProjectUsage.hours}
                  color="#52c41a"
                  loading={tableLoading}
                  description={topProjectUsage.name}
                />
              )}

              {/* การ์ดฟีเจอร์ที่ใช้เวลามากที่สุด */}
              {topFeatureUsage && (
                <TimesheetStatCard
                  title="ฟีเจอร์ยอดนิยม"
                  value={topFeatureUsage.hours}
                  color="#ff4d4f"
                  loading={tableLoading}
                  description={topFeatureUsage.name}
                />
              )}
            </div>

            {/* สรุปชั่วโมงรายสัปดาห์ */}
            <WeeklySummary
              weeklySummary={weeklySummary}
              targetHours={DAILY_TARGET_HOURS}
              loading={tableLoading}
            />

            {/* ฟิลเตอร์และค้นหา */}
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      background: "linear-gradient(45deg, #ff6b6b, #ffa500)",
                      padding: 8,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SearchOutlined style={{ color: "white", fontSize: 16 }} />
                  </div>
                  <Typography.Title
                    level={5}
                    style={{ margin: 0, fontWeight: 600 }}
                  >
                    ค้นหาและกรองข้อมูล
                  </Typography.Title>
                </div>
              }
              size="small"
              style={{
                borderRadius: 16,
                border: "1px solid var(--ant-border-color)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                background: "var(--ant-card-background)",
              }}
              extra={
                <Button
                  onClick={clearFilters}
                  size="small"
                  type="dashed"
                  icon={<ThunderboltOutlined />}
                  style={{ borderRadius: 8 }}
                >
                  ล้างตัวกรอง
                </Button>
              }
            >
              <Collapse
                bordered={false}
                style={{ background: "transparent" }}
                expandIcon={({ isActive }) => (
                  <FilterOutlined rotate={isActive ? 90 : 0} />
                )}
                items={[
                  {
                    key: "1",
                    label: "ตัวกรอง",
                    children: (
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Input
                            placeholder="ค้นหาโปรเจ็ค, ฟีเจอร์, หรือคำอธิบาย..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                          />
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Select
                            placeholder="เลือกสถานะ"
                            value={selectedStatus}
                            onChange={setSelectedStatus}
                            allowClear
                            style={{ width: "100%" }}
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <Select.Option
                                key={option.value}
                                value={option.value}
                              >
                                <Tag color={statusColorMap[option.value]}>
                                  {option.label_th}
                                </Tag>
                              </Select.Option>
                            ))}
                          </Select>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Select
                            placeholder="เลือกโปรเจ็ค"
                            value={selectedProject}
                            onChange={setSelectedProject}
                            allowClear
                            style={{ width: "100%" }}
                            options={projectOptions}
                          />
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <DatePicker.RangePicker
                            placeholder={["วันที่เริ่มต้น", "วันที่สิ้นสุด"]}
                            value={dateRange}
                            onChange={setDateRange}
                            format={DATE_FORMAT}
                            style={{ width: "100%" }}
                          />
                        </Col>
                      </Row>
                    ),
                  },
                ]}
              />
            </Card>

            {/* หัวข้อและปุ่มจัดการ */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                padding: "20px 24px",
                borderRadius: 16,
                marginBottom: 20,
                boxShadow: "0 8px 25px rgba(240, 147, 251, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    padding: 12,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ProjectOutlined style={{ fontSize: 28, color: "white" }} />
                </div>
                <div>
                  <Typography.Title
                    level={5}
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: 20,
                      color: "white",
                    }}
                  >
                    รายการลงเวลา
                  </Typography.Title>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Badge
                      count={filteredEntries.length}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.9)",
                        color: "#f5576c",
                        fontWeight: 600,
                      }}
                    />
                    <Typography.Text
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: 14,
                      }}
                    >
                      จากทั้งหมด {entries.length} รายการ
                    </Typography.Text>
                  </div>
                </div>
              </div>
              <TimesheetActions
                selectedCount={timesheetState?.selectedRowKeys?.length}
                loading={actionLoading}
                refreshLoading={tableLoading}
                onRefresh={refetchEntries}
                onAdd={openCreateForm}
                onDelete={openDeleteModal}
              />
            </div>

            {/* การ์ดรายการ Timesheet */}
            <Spin spinning={tableLoading}>
              {paginatedEntries.length === 0 ? (
                <Card
                  style={{
                    borderRadius: 16,
                    textAlign: "center",
                    padding: "40px 20px",
                    background: "var(--ant-card-background)",
                    border: "1px solid var(--ant-border-color)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <Empty
                    description={
                      <Typography.Text
                        style={{
                          fontSize: 16,
                          color: "var(--ant-text-color-secondary)",
                        }}
                      >
                        ไม่พบรายการลงเวลาที่ตรงกับเงื่อนไขการค้นหา
                      </Typography.Text>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {paginatedEntries.map((entry) => {
                    const statusOption = STATUS_OPTIONS.find(
                      (opt) => opt.value === entry.status
                    );
                    const statusLabel = statusOption
                      ? i18n.language === "th"
                        ? statusOption.label_th
                        : statusOption.label_en
                      : entry.status;

                    return (
                      <Col key={entry.id} xs={24} sm={12} lg={8} xl={6}>
                        <Card
                          hoverable
                          style={{
                            borderRadius: 16,
                            height: "100%",
                            background: "var(--ant-card-background)",
                            border: "1px solid var(--ant-border-color)",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                          }}
                          styles={{
                            body: {
                              padding: 16,
                            },
                          }}
                          actions={[
                            <Button
                              key="view"
                              type="text"
                              icon={<EyeOutlined />}
                              onClick={() => openDetailModal(entry)}
                            />,
                            <Button
                              key="edit"
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => openEditForm(entry)}
                            />,
                            <Button
                              key="copy"
                              type="text"
                              icon={<CopyOutlined />}
                              onClick={() => openCopyForm(entry)}
                            />,
                          ]}
                        >
                          {/* วันที่ */}
                          <div style={{ marginBottom: 12 }}>
                            <Typography.Text strong>
                              {dayjs(entry.date).format(DATE_FORMAT)}
                            </Typography.Text>
                          </div>

                          {/* โปรเจ็ค */}
                          <div style={{ marginBottom: 12 }}>
                            <Typography.Text
                              strong
                              ellipsis={{ tooltip: entry.project_name }}
                            >
                              {entry.project_name}
                            </Typography.Text>
                          </div>

                          {/* ฟีเจอร์ */}
                          {entry.feature_name && (
                            <div style={{ marginBottom: 12 }}>
                              <Typography.Text
                                type="secondary"
                                ellipsis={{ tooltip: entry.feature_name }}
                              >
                                {entry.feature_name}
                              </Typography.Text>
                            </div>
                          )}

                          {/* ชั่วโมงและสถานะ */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography.Text>
                              {entry.hours} ชั่วโมง
                            </Typography.Text>
                            <Tag color={statusColorMap[entry.status]}>
                              {statusLabel}
                            </Tag>
                          </div>

                          {/* คำอธิบาย */}
                          {entry.description && (
                            <div style={{ marginTop: 12 }}>
                              <Typography.Text
                                type="secondary"
                                ellipsis={{ tooltip: entry.description }}
                              >
                                {entry.description}
                              </Typography.Text>
                            </div>
                          )}
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </Spin>

            {/* Pagination */}
            {filteredEntries.length > 0 && (
              <Card
                style={{
                  borderRadius: 16,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
                }}
                styles={{
                  body: {
                    padding: "20px",

                    margin: 8,
                    borderRadius: 12,
                    backdropFilter: "blur(10px)",
                  },
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      background:
                        "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
                      padding: 8,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrophyOutlined style={{ color: "white", fontSize: 16 }} />
                  </div>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredEntries.length}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) =>
                      `แสดง ${range[0]}-${range[1]} จากทั้งหมด ${total} รายการ`
                    }
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      if (size && size !== pageSize) {
                        setPageSize(size);
                      }
                    }}
                    pageSizeOptions={["8", "16", "24", "32"]}
                  />
                </div>
              </Card>
            )}
          </Space>

          {/* Modal ฟอร์มสร้าง/แก้ไข */}
          <CreateModalForm
            open={timesheetState?.modalType === "form"}
            onCancel={closeModal}
            onSubmit={SUBMIT_TIMESHEET_FUNCTION}
            form={form}
            projects={timesheetState.projects}
            subProject={timesheetState.subProjects}
            fetchSubProjects={(id) => GET_SUB_PROJECTS_FUNCTION(Number(id))}
            i18n={i18n}
            disabled={actionLoading}
          />

          {/* Modal รายละเอียด */}
          <DetailModal
            open={
              timesheetState.modalType === "detail" &&
              !!timesheetState.activeRecord
            }
            onCancel={closeModal}
            record={timesheetState.activeRecord}
          />

          {/* Modal ยืนยันการลบ */}
          <DeleteConfirmationModal
            open={timesheetState.modalType === "delete"}
            onCancel={closeModal}
            onConfirm={DELETE_TIMESHEET_FUNCTION}
            selectedCount={timesheetState.selectedRowKeys.length}
            loading={actionLoading}
          />
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
