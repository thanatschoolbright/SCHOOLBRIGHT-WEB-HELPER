"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
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
} from "@ant-design/icons";
import type { ColumnsType, ColumnType } from "antd/es/table";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { toast } from "sonner";
import { useDispatch } from "react-redux";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { TimesheetActions } from "@components/button/timesheet-actions";
import { TimesheetStatCard } from "@components/card/timesheet-stat-card";
import { TableSearch } from "@components/input-field/table-search";
import { DeleteConfirmationModal } from "@components/modal/delete-confirmation-modal";
import { DetailModal } from "@components/timesheet/detail-modal";
import {
  useTimesheetEntries,
  useTopUsage,
  useDailySummary,
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
import { HeaderBar } from "@/components/typhography/header-bar-component";

import { CreateModalForm } from "./create";
import { MonthlyRankBoard, MonthlyRankBoardRef } from "./monthly-rank-board";

dayjs.extend(isBetween);

// Type Definitions
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

// Constants
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
  offscreen: { y: 50, opacity: 0 },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, bounce: 0.4, duration: 0.8 },
  },
};

// --- Child Presentational Components ---

const TimesheetHeader: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="flex items-center justify-between">
    <HeaderBar
      title="การลงเวลาทำงาน"
      subTitle="จัดการและติดตามเวลาทำงานอย่างมีประสิทธิภาพ"
      icon={<TeamOutlined />}
    />
    <Button
      type="primary"
      icon={<PlusOutlined />}
      size="large"
      className="!rounded-lg"
      onClick={onAdd}
    >
      เพิ่มรายการ
    </Button>
  </div>
);

interface DashboardMetricsProps {
  rankBoardRef: React.Ref<MonthlyRankBoardRef>;
  adminId?: number;
  topProjectUsage: { name: string; hours: number } | null;
  topFeatureUsage: { name: string; hours: number } | null;
  loading: boolean;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  rankBoardRef,
  adminId,
  topProjectUsage,
  topFeatureUsage,
  loading,
}) => (
  <Row gutter={[24, 24]} align="stretch">
    <Col xs={24} lg={12} xl={10}>
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
    <Col xs={24} sm={12} lg={6} xl={7}>
      {topProjectUsage && (
        <motion.div
          className="h-full"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.3 }}
          variants={cardVariants}
        >
          <TimesheetStatCard
            title="โปรเจ็คยอดนิยม"
            value={topProjectUsage.hours}
            color="#52c41a"
            loading={loading}
            description={topProjectUsage.name}
            icon={<FireOutlined />}
          />
        </motion.div>
      )}
    </Col>
    <Col xs={24} sm={12} lg={6} xl={7}>
      {topFeatureUsage && (
        <motion.div
          className="h-full"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.3 }}
          variants={cardVariants}
        >
          <TimesheetStatCard
            title="ฟีเจอร์ยอดนิยม"
            value={topFeatureUsage.hours}
            color="#ff4d4f"
            loading={loading}
            description={topFeatureUsage.name}
            icon={<CodeSandboxOutlined />}
          />
        </motion.div>
      )}
    </Col>
  </Row>
);

interface WeeklySummaryData {
  dateKey: string;
  totalHours: number;
  percent: number;
  isCompleted: boolean;
  label: string;
}

const EnhancedWeeklySummary: React.FC<{
  weeklySummary: WeeklySummaryData[];
  loading: boolean;
}> = ({ weeklySummary, loading }) => {
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
            const isFuture = dayjs(summary.dateKey).isAfter(dayjs(), "day");
            const isToday = dayjs(summary.dateKey).isSame(dayjs(), "day");

            return (
              <div key={summary.dateKey} className="text-center">
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
                  {dayjs(summary.dateKey).format("D MMM")}
                </Typography.Text>

                <Progress
                  type="circle"
                  percent={summary.percent > 100 ? 100 : summary.percent}
                  size={80}
                  strokeWidth={8}
                  format={() => (
                    <span className="font-bold text-lg">
                      {summary.totalHours}
                      <span className="text-xs">h</span>
                    </span>
                  )}
                  strokeColor={
                    summary.isCompleted
                      ? "#52c41a"
                      : isFuture
                      ? "#f0f0f0"
                      : "#1677ff"
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

interface TimesheetTableProps {
  entries: TimesheetEntry[];
  columns: ColumnsType<TimesheetEntry>;
  loading: boolean;
  actionLoading: boolean;
  selectedRowKeys: React.Key[];
  pagination: { current: number; pageSize: number; total: number };
  onPaginationChange: (page: number, size?: number) => void;
  onRowSelectionChange: (keys: React.Key[]) => void;
  onRefresh: () => void;
  onAdd: () => void;
  onDelete: () => void;
}

const TimesheetTable: React.FC<TimesheetTableProps> = ({
  entries,
  columns,
  loading,
  actionLoading,
  selectedRowKeys,
  pagination,
  onPaginationChange,
  onRowSelectionChange,
  onRefresh,
  onAdd,
  onDelete,
}) => (
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
      loading={loading && entries.length === 0}
      extra={
        <TimesheetActions
          selectedCount={selectedRowKeys.length}
          loading={actionLoading}
          refreshLoading={loading}
          onRefresh={onRefresh}
          onAdd={onAdd}
          onDelete={onDelete}
        />
      }
    >
      <Table<TimesheetEntry>
        rowKey="id"
        columns={columns}
        dataSource={entries}
        loading={loading}
        rowSelection={{ selectedRowKeys, onChange: onRowSelectionChange }}
        pagination={{
          ...pagination,
          onChange: onPaginationChange,
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
              <Button type="primary" onClick={onAdd} className="!rounded-lg">
                สร้างรายการแรกของคุณ
              </Button>
            </Empty>
          ),
        }}
      />
    </Card>
  </motion.div>
);

// --- Main Page Component (Controller) ---

export default function Page() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
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
  const dailySummary = useDailySummary(entries);
  const weeklySummary = useWeeklySummary(dailySummary);

  const GET_PROJECTS_FUNCTION = useCallback(async () => {
    // ... (logic remains the same)
  }, [dispatch]);

  const GET_SUB_PROJECTS_FUNCTION = useCallback(
    async (projectId: number) => {
      // ... (logic remains the same)
    },
    [dispatch]
  );

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
      // ... (logic remains the same)
    },
    [dispatch, GET_SUB_PROJECTS_FUNCTION, form]
  );

  const openCopyForm = useCallback(
    async (record: TimesheetEntry) => {
      // ... (logic remains the same)
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
    // ... (logic remains the same)
  }, [
    timesheetState?.activeRecord?.id,
    timesheetState?.formMode,
    adminId,
    closeModal,
    refetchEntries,
    form,
  ]);

  const DELETE_TIMESHEET_FUNCTION = useCallback(async () => {
    // ... (logic remains the same)
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
      filterIcon: () => <SearchOutlined />,
      onFilter: (value, record) => {
        const raw = record[dataIndex];
        if (raw == null) return false;
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
          const label = statusInfo.label_th;
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
              onClick={() => { openEditForm(record).catch(console.error); }}
              size="small"
              className="!rounded-md"
            />
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => { openCopyForm(record).catch(console.error); }}
              size="small"
              className="!rounded-md"
            />
          </Space>
        ),
      },
    ],
    [getColumnSearchProps, openCopyForm, openDetailModal, openEditForm]
  );

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        {/* Page animation wrapper */}
        <motion.div
          className="p-6 min-h-screen "
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={{ duration: 0.5 }}
        >
          <Space direction="vertical" size="large" className="w-full">
            {/* Renders the main page title and primary action button ('Add Entry'). */}
            <TimesheetHeader onAdd={openCreateForm} />

            {/* Displays high-level metrics: rank board and top usage cards. */}
            <DashboardMetrics
              rankBoardRef={rankBoardRef}
              adminId={adminId}
              topProjectUsage={topProjectUsage}
              topFeatureUsage={topFeatureUsage}
              loading={tableLoading}
            />

            {/* Visualizes the user's logged hours for the current week against a daily target. */}
            <EnhancedWeeklySummary
              weeklySummary={weeklySummary}
              loading={tableLoading}
            />

            {/* The main data grid for viewing, filtering, and managing timesheet entries. */}
            <TimesheetTable
              entries={entries}
              columns={columns}
              loading={tableLoading}
              actionLoading={actionLoading}
              selectedRowKeys={timesheetState.selectedRowKeys}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalItems,
              }}
              onPaginationChange={(page, size) => {
                setCurrentPage(page);
                if (size) setPageSize(size);
              }}
              onRowSelectionChange={(keys) =>
                dispatch(setSelectedRowKeys(keys))
              }
              onRefresh={refetchEntries}
              onAdd={openCreateForm}
              onDelete={openDeleteModal}
            />
          </Space>

          {/* Renders a modal form for creating or editing a timesheet entry. */}
          <CreateModalForm
            open={timesheetState?.modalType === "form"}
            onCancel={closeModal}
            onSubmit={SUBMIT_TIMESHEET_FUNCTION}
            form={form}
            projects={timesheetState.projects}
            subProject={timesheetState.subProjects}
            fetchSubProjects={(id) => GET_SUB_PROJECTS_FUNCTION(Number(id))}
            i18n={{}} // TODO: Replace with actual i18n object if available
            disabled={actionLoading}
          />

          {/* Displays the full details of a selected timesheet entry in a read-only modal. */}
          <DetailModal
            open={
              timesheetState.modalType === "detail" &&
              !!timesheetState.activeRecord
            }
            onCancel={closeModal}
            record={timesheetState.activeRecord}
          />

          {/* A confirmation dialog to prevent accidental deletion of one or more entries. */}
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
