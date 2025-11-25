"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { InputRef, TableProps } from "antd";
import {
  Button,
  Card,
  Form,
  Space,
  Table,
  Tag,
  Typography,
  theme,
  Tooltip,
  Avatar,
  Row,
  Col,
  Divider,
  Progress,
} from "antd";
import {
  CopyOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType, ColumnType } from "antd/es/table";
import { motion } from "framer-motion"; // *ต้องติดตั้ง: npm install framer-motion

import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import i18next from "i18next";
import { toast } from "sonner";

// --- Components Imports ---
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { TimesheetActions } from "@components/button/timesheet-actions";
import { TimesheetStatCard } from "@components/card/timesheet-stat-card";
import { TableSearch } from "@components/input-field/table-search";
import { DeleteConfirmationModal } from "@components/modal/delete-confirmation-modal";
import { DetailModal } from "@components/timesheet/detail-modal";
import { WeeklySummary } from "@components/timesheet/weekly-summary";
import { CreateModalForm } from "./create"; // ตรวจสอบ Path ให้ถูกต้อง
import { MonthlyRankBoard, MonthlyRankBoardRef } from "./monthly-rank-board"; // ตรวจสอบ Path ให้ถูกต้อง
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

dayjs.extend(isBetween);

// --- Interfaces ---
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

type SearchableColumnKey =
  | "date"
  | "project_name"
  | "feature_name"
  | "status"
  | "hours"
  | "description";

type TableColumn = ColumnType<TimesheetEntry> & {
  key: keyof TimesheetEntry | string;
};

const DATE_FORMAT = "DD/MM/YYYY";
const DAILY_TARGET_HOURS = 8;

// --- Helper Functions ---

// สร้างสีจากข้อความ (สำหรับ Avatar โปรเจกต์)
const stringToColor = (string: string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "DONE":
      return {
        color: "success",
        icon: <CheckCircleOutlined />,
        text: "เสร็จสิ้น",
      };
    case "IN_PROGRESS":
      return {
        color: "processing",
        icon: <SyncOutlined spin />,
        text: "กำลังทำ",
      };
    case "REVIEW":
      return { color: "geekblue", icon: <EyeOutlined />, text: "รอตรวจสอบ" };
    case "CANCELLED":
      return { color: "error", icon: <CloseCircleOutlined />, text: "ยกเลิก" };
    default:
      return { color: "default", icon: <FileTextOutlined />, text: "ร่าง" };
  }
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "อรุณสวัสดิ์";
  if (hour < 18) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
};

// --- Main Page Component ---
export default function Page() {
  const dispatch = useDispatch();
  const i18n = i18next;
  const [form] = Form.useForm();
  const isMountedRef = useRef(true);
  const rankBoardRef = useRef<MonthlyRankBoardRef>(null);

  // Enterprise Theme Token
  const { token } = theme.useToken();

  // Redux
  const authState = useAppSelector((state) => state.callAdminLogin);
  const timesheetState = useAppSelector((state) => state.timesheet);

  const adminId = useMemo(
    () => Number(authState?.response?.data?.user_data?.admin_id) || undefined,
    [authState?.response?.data?.user_data?.admin_id]
  );
  const adminName = authState?.response?.data?.user_data?.firstname || "User";

  // Local State
  const [actionLoading, setActionLoading] = useState(false);
  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  // Hooks Data
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // --- API Handlers ---
  const GET_PROJECTS_FUNCTION = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const response = await axios.post("/api/v1/timesheet/project/read/", {
        limit: 100,
        page: 1,
      });
      if (!isMountedRef.current) return;
      dispatch(setProjects(response.data?.data ?? []));
    } catch (error: any) {
      console.error("GET_PROJECTS_FUNCTION", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

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
          { limit: 100, page: 1, project_id: Number(projectId) }
        );
        const items = response.data?.data?.items ?? [];
        if (isMountedRef.current) dispatch(setSubProjects(items));
        toast.success("โหลดรายการฟีเจอร์สำเร็จ", { id: TOAST_ID });
        return items;
      } catch (error: any) {
        console.error("GET_SUB_PROJECTS_FUNCTION", error);
        if (isMountedRef.current) dispatch(setSubProjects([]));
        toast.error("โหลดรายการฟีเจอร์ไม่สำเร็จ", {
          id: TOAST_ID,
          description: error?.message,
        });
        return [];
      }
    },
    [dispatch]
  );

  useEffect(() => {
    GET_PROJECTS_FUNCTION();
  }, [GET_PROJECTS_FUNCTION]);

  // --- UI Action Handlers ---
  const closeModal = useCallback(() => {
    dispatch(setModalType(null));
    dispatch(setActiveRecord(null));
    dispatch(setFormMode("create"));
    form.resetFields();
  }, [dispatch, form]);

  const openCreateForm = useCallback(() => {
    dispatch(setFormMode("create"));
    dispatch(setActiveRecord(null));
    dispatch(setSubProjects([]));
    form.setFieldsValue({
      project_id: undefined,
      sub_project_id: undefined,
      description: "",
      work_hour: undefined,
      status: "IN_PROGRESS",
      date: dayjs(),
    });
    dispatch(setModalType("form"));
  }, [dispatch, form]);

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
        date: dayjs(),
      });
      dispatch(setModalType("form"));
    },
    [dispatch, GET_SUB_PROJECTS_FUNCTION, form]
  );

  const openDetailModal = useCallback(
    (record: TimesheetEntry) => {
      dispatch(setActiveRecord(record));
      dispatch(setModalType("detail"));
    },
    [dispatch]
  );

  const openDeleteModal = useCallback(() => {
    dispatch(setModalType("delete"));
  }, [dispatch]);

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
      toast.error("บันทึกข้อมูลล้มเหลว", {
        id: TOAST_ID,
        description: error?.message,
      });
    } finally {
      if (isMountedRef.current) setActionLoading(false);
    }
  }, [timesheetState, adminId, closeModal, refetchEntries, form]);

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
      toast.error("ลบรายการล้มเหลว", {
        id: TOAST_ID,
        description: error?.message,
      });
    } finally {
      if (isMountedRef.current) setActionLoading(false);
    }
  }, [
    adminId,
    closeModal,
    refetchEntries,
    timesheetState?.selectedRowKeys,
    dispatch,
  ]);

  // --- Table Configuration ---
  const getColumnSearchProps = useCallback(
    (dataIndex: SearchableColumnKey, title: string): TableColumn => ({
      key: dataIndex,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        const value = (selectedKeys[0] as string | undefined) ?? "";
        return (
          <TableSearch
            value={value}
            placeholder={`ค้นหา ${title}`}
            inputRef={
              searchInputRefs.current[dataIndex]
                ? { current: searchInputRefs.current[dataIndex] }
                : undefined
            }
            onChange={(inputValue) =>
              setSelectedKeys(inputValue ? [inputValue] : [])
            }
            onConfirm={() => confirm()}
            onReset={() => {
              clearFilters?.();
              confirm({ closeDropdown: true });
            }}
          />
        );
      },
      filterIcon: (filtered) => (
        <SearchOutlined
          style={{ color: filtered ? token.colorPrimary : undefined }}
        />
      ),
      onFilter: (value, record) => {
        const raw = record[dataIndex];
        if (raw === undefined || raw === null) return false;
        if (dataIndex === "date")
          return dayjs(raw).format(DATE_FORMAT).includes(String(value));
        return String(raw).toLowerCase().includes(String(value).toLowerCase());
      },
      filterDropdownProps: {
        onOpenChange: (visible) => {
          if (visible)
            setTimeout(() => searchInputRefs.current[dataIndex]?.select(), 100);
        },
      },
    }),
    [token.colorPrimary]
  );

  // Modern Enterprise Columns Definition
  const columns = useMemo<ColumnsType<TimesheetEntry>>(
    () => [
      {
        title: "วันที่",
        dataIndex: "date",
        width: 100,
        align: "center",
        responsive: ["md"], // ซ่อนบนมือถือ
        sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (value: string) => (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              lineHeight: 1.2,
            }}
          >
            <Typography.Text strong style={{ fontSize: 16 }}>
              {dayjs(value).format("DD")}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(value).format("MMM YY")}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: "โครงการ",
        dataIndex: "project_name",
        width: 280,
        sorter: (a, b) => a.project_name.localeCompare(b.project_name),
        render: (value: string, record) => {
          const avatarColor = stringToColor(value);
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar
                shape="square"
                size={38}
                style={{
                  backgroundColor: `${avatarColor}20`,
                  color: avatarColor,
                  border: `1px solid ${avatarColor}40`,
                  borderRadius: 8,
                }}
              >
                {value ? value.charAt(0).toUpperCase() : <UserOutlined />}
              </Avatar>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Typography.Text
                  strong
                  ellipsis
                  style={{ maxWidth: 200, fontSize: 14 }}
                >
                  {value}
                </Typography.Text>
                {record.feature_name ? (
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11 }}
                    ellipsis
                  >
                    <ProjectOutlined style={{ fontSize: 10, marginRight: 4 }} />
                    {record.feature_name}
                  </Typography.Text>
                ) : (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    -
                  </Typography.Text>
                )}
              </div>
            </div>
          );
        },
        ...getColumnSearchProps("project_name", "ชื่อโปรเจ็ค"),
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        width: 130,
        align: "center",
        sorter: (a, b) => (a.status ?? "").localeCompare(b.status ?? ""),
        render: (value: string) => {
          const config = getStatusConfig(value);
          const option = STATUS_OPTIONS.find((item) => item.value === value);
          const label = option
            ? i18n.language === "th"
              ? option.label_th
              : option.label_en
            : config.text;
          return (
            <Tag
              color={config.color}
              icon={config.icon}
              style={{
                borderRadius: 12,
                border: "none",
                fontWeight: 600,
                fontSize: 11,
                padding: "2px 8px",
              }}
            >
              {label}
            </Tag>
          );
        },
      },
      {
        title: "เวลา (ชม.)",
        dataIndex: "hours",
        width: 160,
        sorter: (a, b) => Number(a.hours) - Number(b.hours),
        render: (value: number) => {
          const percent = (value / DAILY_TARGET_HOURS) * 100;
          const statusColor =
            value > DAILY_TARGET_HOURS
              ? token.colorWarning
              : value >= DAILY_TARGET_HOURS
              ? token.colorSuccess
              : token.colorPrimary;
          return (
            <div style={{ paddingRight: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Typography.Text
                  strong
                  style={{ color: statusColor, fontSize: 13 }}
                >
                  {Number(value).toFixed(2)}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  / {DAILY_TARGET_HOURS} ชม.
                </Typography.Text>
              </div>
              <Progress
                percent={percent > 100 ? 100 : percent}
                steps={8}
                size={["100%", 4]}
                strokeColor={statusColor}
                showInfo={false}
                trailColor={token.colorFillSecondary}
              />
            </div>
          );
        },
      },
      {
        title: "คำอธิบาย",
        dataIndex: "description",
        ellipsis: true,
        responsive: ["lg"],
        render: (value: string | null) => (
          <Typography.Text
            type="secondary"
            ellipsis
            style={{ maxWidth: 200, fontSize: 13 }}
          >
            {value || "-"}
          </Typography.Text>
        ),
      },
      {
        title: "",
        key: "actions",
        fixed: "right",
        width: 100,
        align: "center",
        render: (_value, record) => (
          <Space.Compact size="small">
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                size="small"
                icon={
                  <EditOutlined style={{ color: token.colorTextSecondary }} />
                }
                onClick={(e) => {
                  e.stopPropagation();
                  openEditForm(record);
                }}
              />
            </Tooltip>
            <Tooltip title="คัดลอก">
              <Button
                type="text"
                size="small"
                icon={
                  <CopyOutlined style={{ color: token.colorTextSecondary }} />
                }
                onClick={(e) => {
                  e.stopPropagation();
                  openCopyForm(record);
                }}
              />
            </Tooltip>
          </Space.Compact>
        ),
      },
    ],
    [getColumnSearchProps, openCopyForm, openEditForm, i18n.language, token]
  );

  const rowSelection: TableProps<TimesheetEntry>["rowSelection"] = {
    selectedRowKeys: timesheetState?.selectedRowKeys,
    onChange: (keys) => dispatch(setSelectedRowKeys(keys)),
    columnWidth: 40,
  };

  // --- Render ---
  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            padding: "24px 32px",
            minHeight: "100vh",
            background: token.colorBgLayout,
          }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* 1. Header Section */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorBgLayout} 100%)`,
                padding: "24px",
                borderRadius: token.borderRadiusLG,
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <div>
                <Typography.Title
                  level={3}
                  style={{ margin: 0, fontWeight: 700 }}
                >
                  {getGreeting()}, คุณ{adminName} 👋
                </Typography.Title>
                <Typography.Text type="secondary">
                  จัดการเวลาทำงานและติดตามความคืบหน้าของโครงการได้ที่นี่
                </Typography.Text>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={openCreateForm}
                style={{
                  borderRadius: 8,
                  height: 44,
                  paddingInline: 24,
                }}
              >
                ลงเวลาใหม่
              </Button>
            </div>

            {/* 2. Stats Section */}
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={14}>
                <div style={{ height: "100%" }}>
                  <MonthlyRankBoard
                    ref={rankBoardRef}
                    currentAdminId={adminId}
                    variant="wide"
                  />
                </div>
              </Col>
              <Col xs={24} xl={10}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <WeeklySummary
                      weeklySummary={weeklySummary}
                      targetHours={DAILY_TARGET_HOURS}
                      loading={tableLoading}
                    />
                  </Col>
                  <Col span={12}>
                    {topProjectUsage ? (
                      <TimesheetStatCard
                        title="โปรเจ็คยอดนิยม"
                        value={topProjectUsage.hours}
                        color="#52c41a"
                        loading={tableLoading}
                        description={topProjectUsage.name}
                      />
                    ) : (
                      <Card loading style={{ height: 140, borderRadius: 16 }} />
                    )}
                  </Col>
                  <Col span={12}>
                    {topFeatureUsage ? (
                      <TimesheetStatCard
                        title="ฟีเจอร์ยอดนิยม"
                        value={topFeatureUsage.hours}
                        color="#ff4d4f"
                        loading={tableLoading}
                        description={topFeatureUsage.name}
                      />
                    ) : (
                      <Card loading style={{ height: 140, borderRadius: 16 }} />
                    )}
                  </Col>
                </Row>
              </Col>
            </Row>

            <Divider dashed style={{ margin: "8px 0" }} />

            {/* 3. Main Data Table (Modern & Compact) */}
            <Card
              variant="outlined"
              style={{
                borderRadius: 16,
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                overflow: "hidden",
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
              styles={{ body: { padding: 0 } }}
              title={
                <div
                 
                  className="p-4 flex items-center my-3"
                >
                  <div
                   className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mb-2"
                  >
                    <ClockCircleOutlined
                      style={{ color: token.colorPrimary, fontSize: 18 }}
                    />
                  </div>
                  <div>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      รายการลงเวลาล่าสุด
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      ประวัติการทำงานทั้งหมดของคุณ
                    </Typography.Text>
                  </div>
                </div>
              }
              extra={
                <div style={{ padding: "20px 24px 0" }}>
                  <TimesheetActions
                    selectedCount={timesheetState?.selectedRowKeys?.length}
                    loading={actionLoading}
                    refreshLoading={tableLoading}
                    onRefresh={refetchEntries}
                    onAdd={openCreateForm}
                    onDelete={openDeleteModal}
                  />
                </div>
              }
            >
             <div className="p-6">
               <Table<TimesheetEntry>
                rowKey={(record) => String(record.id)}
                columns={columns}
                dataSource={entries}
                loading={tableLoading}
                rowSelection={rowSelection}
                size="middle" // Compact Size
                pagination={{
                  current: currentPage,
                  pageSize,
                  total: totalItems,
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    if (size && size !== pageSize) setPageSize(size);
                  },
                  showSizeChanger: true,
                  size: "small",
                  pageSizeOptions: ["10", "20", "50", "100"],
                  showTotal: (total, range) => (
                    <span
                      style={{ color: token.colorTextSecondary, fontSize: 12 }}
                    >
                      {range[0]}-{range[1]} / {total}
                    </span>
                  ),
                  style: { padding: "12px 24px" },
                }}
                scroll={{ x: 800 }}
                onRow={(record) => ({
                  onClick: () => openDetailModal(record),
                  style: { cursor: "pointer" },
                })}
                style={{ marginTop: 8 }}
              />
             </div>
            </Card>
          </Space>

          {/* --- Modals --- */}
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

          <DetailModal
            open={
              timesheetState.modalType === "detail" &&
              !!timesheetState.activeRecord
            }
            onCancel={closeModal}
            record={timesheetState.activeRecord}
          />

          <DeleteConfirmationModal
            open={timesheetState.modalType === "delete"}
            onCancel={closeModal}
            onConfirm={DELETE_TIMESHEET_FUNCTION}
            selectedCount={timesheetState.selectedRowKeys.length}
            loading={actionLoading}
          />
        </motion.div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
