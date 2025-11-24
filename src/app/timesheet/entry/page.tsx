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
  Progress,
  Empty,
  Row,
  Col,
} from "antd";
import {
  CopyOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  FireOutlined,
  CodeSandboxOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { ColumnsType, ColumnType } from "antd/es/table";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import i18next from "i18next";
import { toast } from "sonner";

import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { TimesheetActions } from "@components/button/timesheet-actions";
import { TimesheetStatCard } from "@components/card/timesheet-stat-card";
import { TableSearch } from "@components/input-field/table-search";
import { DeleteConfirmationModal } from "@components/modal/delete-confirmation-modal";
import { DetailModal } from "@components/timesheet/detail-modal";
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
import { CreateModalForm } from "./create";
import { MonthlyRankBoard, MonthlyRankBoardRef } from "./monthly-rank-board";
import { HeaderBar } from "@/components/typhography/header-bar-component";

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

const statusMap: Record<
  string,
  { color: string; label_th: string; label_en: string }
> = {
  DONE: { color: "#4CAF50", label_th: "เสร็จสิ้น", label_en: "Done" },
  IN_PROGRESS: {
    color: "#FF9800",
    label_th: "กำลังดำเนินการ",
    label_en: "In Progress",
  },
  REVIEW: { color: "#2196F3", label_th: "รอรีวิว", label_en: "Review" },
  CANCELLED: { color: "#F44336", label_th: "ยกเลิก", label_en: "Cancelled" },
  DRAFT: { color: "#9E9E9E", label_th: "ร่าง", label_en: "Draft" },
};

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const cardVariants = {
  offscreen: {
    y: 50,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as "spring",
      bounce: 0.4,
      duration: 0.8,
    },
  },
};

//** Enhanced Weekly Summary Component */
const EnhancedWeeklySummary = ({
  entries,
  targetHours,
  loading,
}: {
  entries: TimesheetEntry[];
  targetHours: number;
  loading: boolean;
}) => {
  const dailySummary = useMemo(() => {
    const summary: { [key: string]: number } = {};
    if (entries) {
      entries.forEach((entry) => {
        const date = dayjs(entry.date).format("YYYY-MM-DD");
        summary[date] = (summary[date] || 0) + Number(entry.hours);
      });
    }
    return Object.entries(summary).map(([day, hours]) => ({ day, hours }));
  }, [entries]);

  const weeklySummary = useMemo(() => {
    const startOfWeek = dayjs().startOf("isoWeek"); // Ensures week starts on Monday
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = startOfWeek.add(i, "day");
      const dayStr = currentDay.format("YYYY-MM-DD");
      const summaryForDay = dailySummary.find((d) => d.day === dayStr);
      weekData.push({
        day: dayStr,
        hours: summaryForDay ? summaryForDay.hours : 0,
      });
    }
    return weekData;
  }, [dailySummary]);

  const weekDays = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount: 0.2 }}
    >
      <Card
        bordered={false}
        className="!rounded-xl !shadow-sm hover:!shadow-lg !transition-shadow"
        loading={loading}
      >
        <Typography.Title level={4} className="!mb-4">
          ภาพรวมการทำงานรายสัปดาห์
        </Typography.Title>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {weeklySummary.map((summary, index) => {
            const percentage = Math.min(
              (summary.hours / targetHours) * 100,
              100
            );
            const isTargetMet = summary.hours >= targetHours;
            const isFuture = dayjs(summary.day).isAfter(dayjs(), "day");
            const isToday = dayjs(summary.day).isSame(dayjs(), "day");

            return (
              <div key={`${summary.day}-${index}`} className="text-center">
                <Typography.Text
                  strong
                  className={`!text-sm ${
                    isToday ? "!text-blue-500" : "!text-gray-600"
                  }`}
                >
                  {weekDays[index]}
                </Typography.Text>
                <Typography.Text
                  className={`!block !text-xs ${
                    isToday ? "!text-blue-500" : "!text-gray-400"
                  } !mb-2`}
                >
                  {dayjs(summary.day).format("D MMM")}
                </Typography.Text>
                <Progress
                  type="circle"
                  percent={percentage}
                  size={80}
                  strokeWidth={8}
                  format={(percent) => (
                    <span className="font-bold text-lg">
                      {summary.hours}
                      <span className="text-xs">h</span>
                    </span>
                  )}
                  strokeColor={
                    isTargetMet ? "#52c41a" : isFuture ? "#f0f0f0" : "#1677ff"
                  }
                  trailColor="#f0f0f0"
                />
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
};

export default function Page() {
  const dispatch = useDispatch();
  const i18n = i18next;
  const [form] = Form.useForm();
  const isMountedRef = useRef(true);
  const rankBoardRef = useRef<MonthlyRankBoardRef>(null);

  const authState = useAppSelector((state) => state.callAdminLogin);
  const timesheetState = useAppSelector((state) => state.timesheet);

  const adminId = useMemo(
    () => Number(authState?.response?.data?.user_data?.admin_id) || undefined,
    [authState?.response?.data?.user_data?.admin_id]
  );

  const [actionLoading, setActionLoading] = useState(false);
  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

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

  const { topProjectUsage, topFeatureUsage } = useTopUsage(entries);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      status: undefined,
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
      console.error("SUBMIT_TIMESHEET_FUNCTION", error);
      toast.error("บันทึกข้อมูลล้มเหลว", {
        id: TOAST_ID,
        description: error?.message ?? "Unexpected error",
      });
    } finally {
      if (isMountedRef.current) setActionLoading(false);
    }
  }, [
    timesheetState?.activeRecord?.id,
    timesheetState?.formMode,
    adminId,
    closeModal,
    refetchEntries,
    form,
  ]);

  const DELETE_TIMESHEET_FUNCTION = useCallback(async () => {
    if (!timesheetState.selectedRowKeys.length) return;
    const TOAST_ID = "bulk-delete";
    try {
      setActionLoading(true);
      toast.loading("กำลังลบรายการ...", { id: TOAST_ID });
      await axios.post(
        "/api/v1/timesheet/entry/delete/",
        { ids: timesheetState.selectedRowKeys.map(Number), by: adminId },
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
      if (isMountedRef.current) setActionLoading(false);
    }
  }, [
    adminId,
    closeModal,
    refetchEntries,
    timesheetState?.selectedRowKeys,
    dispatch,
  ]);

  const getColumnSearchProps = useCallback(
    (dataIndex: SearchableColumnKey, title: string): TableColumn => ({
      key: dataIndex,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <TableSearch
          value={(selectedKeys[0] as string | undefined) ?? ""}
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
      ),
      filterIcon: (filtered) => <SearchOutlined />,
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
    []
  );

  const columns = useMemo<ColumnsType<TimesheetEntry>>(
    () => [
      {
        title: "วันที่",
        dataIndex: "date",
        width: 140,
        defaultSortOrder: "descend",
        sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (value: string) => (
          <Typography.Text strong>
            {dayjs(value).format(DATE_FORMAT)}
          </Typography.Text>
        ),
        ...getColumnSearchProps("date", "วันที่"),
      },
      {
        title: "ชื่อโปรเจ็ค",
        dataIndex: "project_name",
        sorter: (a, b) => a.project_name.localeCompare(b.project_name),
        render: (value: string) => (
          <Typography.Text strong>{value ?? "-"}</Typography.Text>
        ),
        ...getColumnSearchProps("project_name", "ชื่อโปรเจ็ค"),
      },
      {
        title: "ชื่อฟีเจอร์",
        dataIndex: "feature_name",
        sorter: (a, b) =>
          (a.feature_name ?? "").localeCompare(b.feature_name ?? ""),
        render: (value: string | null) => (
          <Typography.Text type={value ? undefined : "secondary"}>
            {value || "-"}
          </Typography.Text>
        ),
        ...getColumnSearchProps("feature_name", "ชื่อฟีเจอร์"),
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        sorter: (a, b) => (a.status ?? "").localeCompare(b.status ?? ""),
        render: (value: string) => {
          const statusInfo = statusMap[value] || {
            color: "default",
            label_th: value,
            label_en: value,
          };
          const label =
            i18n.language === "th" ? statusInfo.label_th : statusInfo.label_en;
          return (
            <Tag
              color={statusInfo.color}
              className="!rounded-md !font-semibold !border-none"
            >
              {label}
            </Tag>
          );
        },
        ...getColumnSearchProps("status", "สถานะ"),
      },
      {
        title: "ชั่วโมง",
        dataIndex: "hours",
        align: "right",
        sorter: (a, b) => Number(a.hours) - Number(b.hours),
        render: (value: number) => (
          <Typography.Text strong className="!text-blue-500">
            {Number(value) || 0} ชม.
          </Typography.Text>
        ),
        ...getColumnSearchProps("hours", "ชั่วโมง"),
      },
      {
        title: "คำอธิบาย",
        dataIndex: "description",
        sorter: (a, b) =>
          (a.description ?? "").localeCompare(b.description ?? ""),
        render: (value: string | null) => (
          <Typography.Text
            ellipsis={{ tooltip: value || "ไม่มีคำอธิบาย" }}
            type={value ? undefined : "secondary"}
            className="max-w-[200px]"
          >
            {value || "-"}
          </Typography.Text>
        ),
        ...getColumnSearchProps("description", "คำอธิบาย"),
      },
      {
        title: "จัดการ",
        key: "actions",
        fixed: "right",
        width: 140,
        render: (_value, record) => (
          <Space size="small">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openDetailModal(record)}
              size="small"
              className="!rounded-md"
            />
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditForm(record)}
              size="small"
              className="!rounded-md"
            />
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => openCopyForm(record)}
              size="small"
              className="!rounded-md"
            />
          </Space>
        ),
      },
    ],
    [
      getColumnSearchProps,
      openCopyForm,
      openDetailModal,
      openEditForm,
      i18n.language,
    ]
  );

  const rowSelection: TableProps<TimesheetEntry>["rowSelection"] = {
    selectedRowKeys: timesheetState?.selectedRowKeys,
    onChange: (keys) => dispatch(setSelectedRowKeys(keys as React.Key[])),
  };

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <motion.div
          className="p-6 min-h-screen bg-gray-50"
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={{ duration: 0.5 }}
        >
          <Space direction="vertical" size="large" className="w-full">
            <HeaderBar
              title="การลงเวลาทำงาน"
              subTitle="จัดการและติดตามเวลาทำงานอย่างมีประสิทธิภาพ"
              icon={<TeamOutlined />}
              actions={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  className="!rounded-lg"
                  onClick={openCreateForm}
                >
                  เพิ่มรายการ
                </Button>
              }
            />

            <Row gutter={[24, 24]} align="stretch">
              {/* Monthly Rank Board */}
              <Col xs={24} lg={14}>
                <motion.div
                  className="h-full"
                  initial="offscreen"
                  whileInView="onscreen"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={cardVariants}
                >
                  <MonthlyRankBoard
                    ref={rankBoardRef}
                    currentAdminId={adminId}
                    variant="wide"
                  />
                </motion.div>
              </Col>

              {/* Stat Cards */}
              <Col xs={24} lg={10}>
                <Space direction="vertical" size="large" className="w-full">
                  {topProjectUsage && (
                    <motion.div
                      initial="offscreen"
                      whileInView="onscreen"
                      viewport={{ once: true, amount: 0.3 }}
                      variants={cardVariants}
                    >
                      <TimesheetStatCard
                        title="โปรเจ็คยอดนิยม"
                        value={topProjectUsage.hours}
                        color="#52c41a"
                        loading={tableLoading}
                        description={topProjectUsage.name}
                        icon={<FireOutlined />}
                      />
                    </motion.div>
                  )}
                  {topFeatureUsage && (
                    <motion.div
                      initial="offscreen"
                      whileInView="onscreen"
                      viewport={{ once: true, amount: 0.3 }}
                      variants={cardVariants}
                    >
                      <TimesheetStatCard
                        title="ฟีเจอร์ยอดนิยม"
                        value={topFeatureUsage.hours}
                        color="#ff4d4f"
                        loading={tableLoading}
                        description={topFeatureUsage.name}
                        icon={<CodeSandboxOutlined />}
                      />
                    </motion.div>
                  )}
                </Space>
              </Col>
            </Row>

            <EnhancedWeeklySummary
              entries={entries}
              targetHours={DAILY_TARGET_HOURS}
              loading={tableLoading}
            />

            <motion.div
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.1 }}
            >
              <Card
                bordered={false}
                className="!rounded-xl !shadow-sm hover:!shadow-lg !transition-shadow"
                title={
                  <Typography.Title level={4} className="!m-0">
                    รายการลงเวลา
                  </Typography.Title>
                }
                loading={tableLoading && entries.length === 0}
                extra={
                  <TimesheetActions
                    selectedCount={timesheetState?.selectedRowKeys?.length}
                    loading={actionLoading}
                    refreshLoading={tableLoading}
                    onRefresh={refetchEntries}
                    onDelete={openDeleteModal}
                  />
                }
              >
                <Table<TimesheetEntry>
                  rowKey="id"
                  columns={columns}
                  dataSource={entries}
                  loading={tableLoading}
                  rowSelection={rowSelection}
                  pagination={{
                    current: currentPage,
                    pageSize,
                    total: totalItems,
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      if (size && size !== pageSize) setPageSize(size);
                    },
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    showTotal: (total, range) =>
                      `แสดง ${range[0]}-${range[1]} จาก ${total} รายการ`,
                  }}
                  scroll={{ x: 1000 }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="ยังไม่มีข้อมูลการลงเวลา"
                      >
                        <Button
                          type="primary"
                          onClick={openCreateForm}
                          className="!rounded-lg"
                        >
                          สร้างรายการแรกของคุณ
                        </Button>
                      </Empty>
                    ),
                  }}
                />
              </Card>
            </motion.div>
          </Space>

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
