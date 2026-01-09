"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Form,
  Space,
  Divider,
  theme,
  Typography,
  Button,
  Badge,
  Card,
  Row,
  Col,
  Statistic,
  Skeleton,
  Empty,
  Segmented,
  Tooltip,
  Modal,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Avatar,
  Progress,
  Table,
  InputRef,
  Alert,
  FormInstance,
  Flex,
} from "antd";
import { TableProps, ColumnType } from "antd/lib/table";
import { motion, AnimatePresence } from "framer-motion";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/th";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  PlusOutlined,
  BookOutlined,
  AppstoreAddOutlined,
  TrophyFilled,
  ReloadOutlined,
  ExpandAltOutlined,
  CompressOutlined,
  ProjectOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TagOutlined,
  EditOutlined,
  SaveOutlined,
  DeleteOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  UserOutlined,
  CopyOutlined,
  FireOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  StopOutlined,
  TeamOutlined,
  LockOutlined,
  UnlockOutlined,
  SunOutlined,
  CloudOutlined,
  MoonOutlined,
} from "@ant-design/icons";

import DashboardLayout from "@components/layouts/backend-layout";
import PermissionLayout from "@/components/layouts/permission-layout";
import { DetailModal } from "@components/timesheet/detail-modal";
import { DeleteConfirmationModal } from "@components/modal/delete-confirmation-modal";
import { RankBoardHeader } from "@components/timesheet/rank-board-header";
import { RankCard } from "@components/timesheet/rank-card";
import { WeeklySummary } from "@components/timesheet/weekly-summary";
import { TimesheetStatCard } from "@components/card/timesheet-stat-card";
import { TimesheetActions } from "@components/button/timesheet-actions";
import { TableSearch } from "@components/input-field/table-search";

import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
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

import {
  useDailySummary,
  useTimesheetEntries,
  useTopUsage,
  useWeeklySummary,
} from "@/hooks/use-timesheet-data";
import {
  useTimesheetActions,
  useProjectData,
} from "./hooks/use-timesheet-actions.data";
import { ApiResponse, SummaryMetadata, SummaryRecord } from "@/types/timesheet";
import {
  TimesheetEntry,
  TopUsage,
  SearchableColumnKey,
} from "./types/timesheet-entry.types";
import {
  DAILY_TARGET_HOURS,
  DATE_FORMAT,
  stringToColor,
  getStatusConfig,
} from "./utils/timesheet-entry.helpers";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";

dayjs.extend(isBetween);
dayjs.locale("th");

// ==========================================
// 1. HELPER COMPONENTS
// ==========================================

// --- Page Header ---
interface PageHeaderProps {
  adminName: string;
  onAddClick: () => void;
  onAddMultiClick: () => void;
  onBulkAllClick: () => void;
  token: any;
}
const PageHeader: React.FC<PageHeaderProps> = ({
  adminName,
  onAddClick,
  onAddMultiClick,
  onBulkAllClick,
  token,
}) => {
  // Custom greeting logic specifically for Thai to ensure no English slips through
  const getThaiGreeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return "สวัสดีตอนเช้า";
    if (hour < 17) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
  };

  const greeting = getThaiGreeting();
  const timeIcon =
    dayjs().hour() < 18 ? (
      dayjs().hour() < 12 ? (
        <SunOutlined />
      ) : (
        <CloudOutlined />
      )
    ) : (
      <MoonOutlined />
    );

  const handleOpenGuide = () => {
    window.open(
      "https://docs.google.com/document/d/1bfkhcYs_X79c5j2uZ5pH-C5QAeIjN91aSVNNZEf2guI/edit?usp=sharing",
      "_blank",
      "noopener,noreferrer"
    );
  };
  const isDark = token.colorBgBase === "#0B0F19";
  return (
    <Card
      bordered={false}
      style={{
        background: isDark
          ? `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorPrimary}25 100%)`
          : `linear-gradient(135deg, ${token.colorBgContainer} 40%, ${token.colorPrimary}08 100%)`,
        borderRadius: 24,
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.4)"
          : "0 8px 30px rgba(0,0,0,0.04)",
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
      bodyStyle={{ padding: "32px 40px" }}
    >
      {/* Decorative Orbs */}
      <div
        className="absolute -top-10 -right-10 w-60 h-60 rounded-full filter blur-2xl"
        style={{
          background: `radial-gradient(circle, ${token.colorPrimary}30 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -bottom-[60px] -left-5 w-[180px] h-[180px] rounded-full filter blur-2xl"
        style={{
          background: `radial-gradient(circle, ${token.colorInfo}20 0%, transparent 70%)`,
        }}
      />

      <Row justify="space-between" align="middle" gutter={[24, 24]}>
        <Col flex="auto">
          <Flex vertical gap={6}>
            <Space align="center" size={12}>
              <div
                className="text-[32px]"
                style={{
                  color:
                    dayjs().hour() < 18 ? token.colorWarning : token.colorInfo,
                }}
              >
                {timeIcon}
              </div>
              <Typography.Title
                level={2}
                style={{
                  margin: 0,
                  fontWeight: 800,
                  color: token.colorTextHeading,
                }}
              >
                {greeting}, คุณ{adminName}
              </Typography.Title>
            </Space>
            <Typography.Text type="secondary" style={{ fontSize: 16 }}>
              จัดการเวลาทำงานของคุณได้ที่นี่ •{" "}
              <span style={{ color: token.colorSuccess }}>
                พร้อมลุยงานวันนี้หรือยัง? <RocketOutlined />
              </span>
            </Typography.Text>
          </Flex>
        </Col>
        <Col>
          <Space size="middle">
            <Tooltip title="คู่มือการใช้งาน">
              <Button
                size="large"
                shape="circle"
                icon={<BookOutlined />}
                onClick={handleOpenGuide}
                style={{ border: `1px solid ${token.colorBorder}` }}
              />
            </Tooltip>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={onAddClick}
              style={{
                height: 48,
                paddingLeft: 24,
                paddingRight: 24,
                borderRadius: 24,
                fontSize: 16,
                fontWeight: 600,
                boxShadow: `0 4px 14px ${token.colorPrimary}60`,
              }}
            >
              ลงเวลาทำงาน
            </Button>
            <Badge
              count="พบกันเร็วๆนี้"
              offset={[-15, 5]}
              color={token.colorTextDisabled}
            >
              <Button
                size="large"
                icon={<AppstoreAddOutlined />}
                onClick={onAddMultiClick}
                disabled={true}
                style={{
                  height: 48,
                  borderRadius: 24,
                  background: token.colorFillSecondary,
                  border: "none",
                  color: token.colorTextDisabled,
                }}
              >
                ลงเวลาหลายรายการ
              </Button>
            </Badge>
            <Badge count="ใหม่" offset={[-5, 5]} color={token.colorError}>
              <Tooltip title="ลง Timesheet ให้พนักงานทุกคน (ต้องใช้รหัสผ่าน)">
                <Button
                  size="large"
                  icon={<TeamOutlined />}
                  onClick={onBulkAllClick}
                  style={{
                    height: 48,
                    borderRadius: 24,
                    background: `linear-gradient(135deg, ${token.colorWarning}15 0%, ${token.colorError}15 100%)`,
                    border: `1px solid ${token.colorWarning}40`,
                    color: token.colorWarning,
                    fontWeight: 600,
                  }}
                >
                  ลงแบบทุกคน
                </Button>
              </Tooltip>
            </Badge>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

// --- Monthly Rank Board ---
const API_RANK_ENDPOINT = "/api/v1/timesheet/entry/check/summary-month";
const MAX_RANK_ROWS = 8;
type MonthlyRankVariant = "compact" | "wide";

interface MonthlyRankBoardRef {
  refetch: () => void;
}
interface MonthlyRankBoardProps {
  currentAdminId?: number;
  variant?: MonthlyRankVariant;
  onVariantChange?: (variant: MonthlyRankVariant) => void;
}

const useMonthlyRankData = () => {
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [metadata, setMetadata] = useState<SummaryMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());

  const fetchData = useCallback(
    async (showToast = false) => {
      setLoading(true);
      if (showToast)
        toast.loading("กำลังอัปเดตข้อมูล...", { id: "monthly-rank-toast" });
      try {
        const response = await axios.post<ApiResponse>(
          API_RANK_ENDPOINT,
          {
            month: selectedMonth.format("M"),
            year: selectedMonth.format("YYYY"),
          },
          { headers: { "Content-Type": "application/json" } }
        );
        setRecords(response.data?.data?.records ?? []);
        setMetadata(response.data?.data?.metadata ?? null);
        if (showToast)
          toast.success("อัปเดตข้อมูลล่าสุดแล้ว", { id: "monthly-rank-toast" });
      } catch (error: any) {
        if (showToast)
          toast.error(
            error?.response?.data?.message_th ||
              "เกิดข้อผิดพลาดในการโหลดข้อมูล",
            { id: "monthly-rank-toast" }
          );
      } finally {
        setLoading(false);
      }
    },
    [selectedMonth]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  return {
    records,
    metadata,
    loading,
    refetch: () => fetchData(true),
    selectedMonth,
    setSelectedMonth,
  };
};

const MonthlyRankBoard = forwardRef<MonthlyRankBoardRef, MonthlyRankBoardProps>(
  ({ currentAdminId, variant = "wide", onVariantChange }, ref) => {
    const { token } = theme.useToken();
    const {
      records,
      metadata,
      loading,
      refetch,
      selectedMonth,
      setSelectedMonth,
    } = useMonthlyRankData();
    const [viewMode, setViewMode] = useState<MonthlyRankVariant>(variant);

    useImperativeHandle(ref, () => ({ refetch }));
    const handleVariantChange = (val: MonthlyRankVariant) => {
      setViewMode(val);
      onVariantChange?.(val);
    };

    const visibleRecords = useMemo(() => {
      if (currentAdminId) {
        const selfRecord = records.find(
          (record) => record.admin_id === currentAdminId
        );
        return selfRecord ? [selfRecord] : [];
      }
      return records.slice(0, MAX_RANK_ROWS);
    }, [currentAdminId, records]);

    const isCompact = viewMode === "compact";
    const monthLabel =
      metadata?.range?.label_th ?? selectedMonth.format("MMMM YYYY");
    const generatedAt = metadata?.generated_at
      ? dayjs(metadata.generated_at).format("D MMM BB HH:mm")
      : null;

    const isDark = token.colorBgBase === "#0B0F19";
    return (
      <Card
        hoverable
        style={{
          height: "100%",
          borderRadius: 24,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: isDark
            ? "0 10px 40px -10px rgba(0,0,0,0.4)"
            : "0 10px 40px -10px rgba(0,0,0,0.08)",
          background: isDark
            ? `linear-gradient(165deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`
            : `linear-gradient(165deg, #ffffff 0%, ${token.colorFillAlter} 100%)`,
          overflow: "hidden",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        styles={{
          body: {
            padding: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-[150px] h-[150px] rounded-full pointer-events-none filter blur-[40px]"
          style={{
            background: token.colorPrimary,
            opacity: 0.08,
          }}
        />
        <div className="p-6 pb-4">
          <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
            <div>
              <Typography.Title
                level={4}
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 700,
                }}
              >
                <div
                  className="p-2 rounded-xl"
                  style={{
                    background: `${token.colorWarning}20`,
                    color: token.colorWarning,
                  }}
                >
                  <TrophyFilled />
                </div>
                <span style={{ color: token.colorTextHeading }}>
                  {currentAdminId ? "อันดับของคุณ" : "พนักงานดีเด่น"}
                </span>
              </Typography.Title>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 12, marginTop: 4, display: "block" }}
              >
                <FireOutlined style={{ color: token.colorError }} />{" "}
                ใครขยันที่สุดในเดือนนี้?
              </Typography.Text>
            </div>
          </div>
          <RankBoardHeader
            monthLabel={monthLabel}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            loading={loading}
            isCompact={isCompact}
            generatedAt={null}
            onRefresh={() => {}}
          />
        </div>

        <div className="px-6 pb-6 flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {Array.from({ length: currentAdminId ? 1 : 4 }).map(
                    (_, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          padding: "12px",
                          background: token.colorBgContainer,
                          borderRadius: 16,
                        }}
                      >
                        <Skeleton.Avatar active size={40} shape="circle" />
                        <div className="flex-1">
                          <Skeleton.Input
                            active
                            style={{
                              width: "40%",
                              height: 16,
                              borderRadius: 4,
                              marginBottom: 6,
                            }}
                          />
                          <Skeleton.Input
                            active
                            style={{
                              width: "70%",
                              height: 12,
                              borderRadius: 4,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </Space>
              </motion.div>
            ) : visibleRecords.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 180,
                  textAlign: "center",
                }}
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <Typography.Text strong>ไม่พบข้อมูล</Typography.Text>
                      <Typography.Text type="secondary">
                        {currentAdminId
                          ? "คุณไม่มีบันทึกเวลาในเดือนนี้"
                          : "ยังไม่มีการจัดอันดับในเดือนนี้"}
                      </Typography.Text>
                    </div>
                  }
                />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      when: "beforeChildren",
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {visibleRecords.map((record, index) => (
                    <motion.div
                      key={record.admin_id}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 },
                      }}
                    >
                      <RankCard
                        record={record}
                        isCompact={isCompact}
                        isCurrentUser={record.admin_id === currentAdminId}
                        rank={String(index + 1)}
                      />
                    </motion.div>
                  ))}
                </Space>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Action */}
        <div
          style={{
            padding: "12px 24px",
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={refetch}
            style={{ color: token.colorTextSecondary }}
          >
            อัปเดตข้อมูล
          </Button>
        </div>
      </Card>
    );
  }
);
MonthlyRankBoard.displayName = "MonthlyRankBoard";

// --- Stats Grid ---
interface StatsGridProps {
  adminId: number | undefined;
  rankBoardRef: React.RefObject<MonthlyRankBoardRef>;
  weeklySummary: any[];
  topProjectUsage: TopUsage | null;
  topFeatureUsage: TopUsage | null;
  loading: boolean;
}
const StatsGrid: React.FC<StatsGridProps> = ({
  adminId,
  rankBoardRef,
  weeklySummary,
  topProjectUsage,
  topFeatureUsage,
  loading,
}) => {
  const { token } = theme.useToken();
  const [variant, setVariant] = useState<"compact" | "wide">("compact");
  // Adjusted spans for better balance
  const leftColSpan = 8;
  const rightColSpan = 16;

  return (
    <Row gutter={[24, 24]} style={{ alignItems: "stretch" }}>
      {/* Rank Board Column */}
      <Col
        xs={24}
        lg={9}
        xl={7}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <MonthlyRankBoard
          ref={rankBoardRef}
          currentAdminId={adminId}
          variant="compact"
          onVariantChange={setVariant}
        />
      </Col>

      {/* Stats Right Column */}
      <Col xs={24} lg={15} xl={17}>
        <Flex vertical gap={24} style={{ height: "100%" }}>
          {/* Weekly Chart */}
          <div className="flex-1">
            <WeeklySummary
              weeklySummary={weeklySummary}
              targetHours={DAILY_TARGET_HOURS}
              loading={loading}
            />
          </div>

          {/* Small Stat Cards Row */}
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <TimesheetStatCard
                title={
                  <Space>
                    โครงการยอดนิยม <RocketOutlined />
                  </Space>
                }
                value={topProjectUsage ? topProjectUsage.hours : 0}
                color={token.colorPrimary}
                loading={loading}
                description={
                  topProjectUsage ? topProjectUsage.name : "ยังไม่มีข้อมูล"
                }
              />
            </Col>
            <Col xs={24} sm={12}>
              <TimesheetStatCard
                title={
                  <Space>
                    ฟีเจอร์มาแรง <FireOutlined />
                  </Space>
                }
                value={topFeatureUsage ? topFeatureUsage.hours : 0}
                color={token.colorError}
                loading={loading}
                description={
                  topFeatureUsage ? topFeatureUsage.name : "ยังไม่มีข้อมูล"
                }
              />
            </Col>
          </Row>
        </Flex>
      </Col>
    </Row>
  );
};

// --- Timesheet Table ---
interface TimesheetTableProps {
  entries: TimesheetEntry[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  selectedRowKeys: any[];
  actionLoading: boolean;
  onPageChange: (page: number, size?: number) => void;
  onRowSelect: (keys: any[]) => void;
  onRowClick: (record: TimesheetEntry) => void;
  onEdit: (record: TimesheetEntry) => void;
  onCopy: (record: TimesheetEntry) => void;
  onRefresh: () => void;
  onAdd: () => void;
  onDelete: () => void;
}
const TimesheetTable: React.FC<TimesheetTableProps> = ({
  entries,
  loading,
  currentPage,
  pageSize,
  totalItems,
  selectedRowKeys,
  actionLoading,
  onPageChange,
  onRowSelect,
  onRowClick,
  onEdit,
  onCopy,
  onRefresh,
  onAdd,
  onDelete,
}) => {
  const { token } = theme.useToken();
  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  const getColumnSearchProps = useCallback(
    (
      dataIndex: SearchableColumnKey,
      title: string
    ): Partial<ColumnType<TimesheetEntry>> => ({
      key: dataIndex,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: any) => {
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
            onChange={(v) => setSelectedKeys(v ? [v] : [])}
            onConfirm={() => confirm()}
            onReset={() => {
              clearFilters?.();
              confirm({ closeDropdown: true });
            }}
          />
        );
      },
      filterIcon: (filtered: boolean) => (
        <SearchOutlined
          style={{ color: filtered ? token.colorPrimary : undefined }}
        />
      ),
      onFilter: (value: any, record: TimesheetEntry) => {
        const raw = record[dataIndex];
        if (raw === undefined || raw === null) return false;
        // Case-insensitive search
        if (dataIndex === "date")
          return dayjs(raw).format(DATE_FORMAT).includes(String(value));
        return String(raw).toLowerCase().includes(String(value).toLowerCase());
      },
      filterDropdownProps: {
        onOpenChange: (visible: boolean) => {
          if (visible)
            setTimeout(() => searchInputRefs.current[dataIndex]?.select(), 100);
        },
      },
    }),
    [token.colorPrimary]
  );

  const columns = useMemo<any>(
    () => [
      {
        title: (
          <Space>
            <CalendarOutlined style={{ color: token.colorPrimary }} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: token.colorTextSecondary }}
            >
              วันที่
            </span>
          </Space>
        ),
        dataIndex: "date",
        width: 110,
        align: "center",
        responsive: ["md"],
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (value: string) => {
          const day = dayjs(value).day();
          const dayColors = [
            { bg: "#FFF1F0", text: "#F5222D", border: "#FFA39E" }, // Sun
            { bg: "#FCFFE6", text: "#A0D911", border: "#EAFF8F" }, // Mon
            { bg: "#FFF0F6", text: "#EB2F96", border: "#FFADD2" }, // Tue
            { bg: "#F6FFED", text: "#52C41A", border: "#B7EB8F" }, // Wed
            { bg: "#FFF7E6", text: "#FA8C16", border: "#FFD591" }, // Thu
            { bg: "#E6F7FF", text: "#1890FF", border: "#91D5FF" }, // Fri
            { bg: "#F9F0FF", text: "#722ED1", border: "#D3ADF7" }, // Sat
          ];
          const color = dayColors[day];
          const isDark = token.colorBgBase === "#0B0F19";

          return (
            <div
              className="flex flex-col items-center justify-center w-[64px] h-[64px] rounded-2xl mx-auto border border-solid transition-transform hover:scale-105"
              style={{
                background: isDark ? `${color.text}20` : color.bg,
                borderColor: isDark ? `${color.border}40` : color.border,
                boxShadow: isDark ? "none" : `0 4px 12px ${color.text}10`,
              }}
            >
              <Typography.Text
                strong
                className="text-2xl leading-none"
                style={{ color: isDark ? color.border : color.text }}
              >
                {dayjs(value).format("DD")}
              </Typography.Text>
              <Typography.Text
                className="text-[10px] uppercase font-bold tracking-tighter"
                style={{
                  color: isDark ? color.border : color.text,
                  opacity: 0.8,
                }}
              >
                {dayjs(value).format("MMM YYYY")}
              </Typography.Text>
            </div>
          );
        },
      },
      {
        title: (
          <Space>
            <ProjectOutlined style={{ color: token.colorInfo }} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: token.colorTextSecondary }}
            >
              โครงการ / งาน
            </span>
          </Space>
        ),
        dataIndex: "project_name",
        width: 350,
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          a.project_name.localeCompare(b.project_name),
        ...getColumnSearchProps("project_name", "โครงการ"),
        render: (value: string, record: TimesheetEntry) => {
          const avatarColor = stringToColor(value);
          const isDark = token.colorBgBase === "#0B0F19";
          return (
            <div className="flex items-center gap-4 py-2">
              <div className="relative group">
                <div
                  className="absolute inset-0 rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity"
                  style={{ background: avatarColor }}
                />
                <Avatar
                  shape="square"
                  size={52}
                  src={`https://api.dicebear.com/9.x/identicon/svg?seed=${
                    record.project_id
                  }&backgroundColor=${avatarColor.replace("#", "")}`}
                  className="relative border-2 border-solid rounded-2xl p-1"
                  style={{
                    backgroundColor: isDark ? "#1f1f1f" : "#ffffff",
                    borderColor: `${avatarColor}40`,
                  }}
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Typography.Text
                    strong
                    className="text-base truncate max-w-[200px]"
                    style={{ color: token.colorTextHeading }}
                  >
                    {value}
                  </Typography.Text>
                  {record.category_type && (
                    <Tag
                      bordered={false}
                      className="text-[10px] px-1.5 py-0 leading-none h-4 flex items-center"
                      style={{
                        background:
                          record.category_type === "EXTERNAL"
                            ? `${token.colorSuccess}15`
                            : `${token.colorInfo}15`,
                        color:
                          record.category_type === "EXTERNAL"
                            ? token.colorSuccess
                            : token.colorInfo,
                      }}
                    >
                      {record.category_type}
                    </Tag>
                  )}
                </div>
                {record.feature_name ? (
                  <div className="flex items-center gap-2 opacity-80">
                    <div className="w-1 h-3 rounded-full bg-cyan-500" />
                    <Typography.Text
                      className="text-[13px] truncate"
                      type="secondary"
                    >
                      {record.feature_name}
                    </Typography.Text>
                  </div>
                ) : (
                  <Typography.Text
                    className="text-[12px] italic opacity-40"
                    type="secondary"
                  >
                    ไม่มีระบุฟีเจอร์
                  </Typography.Text>
                )}
              </div>
            </div>
          );
        },
      },
      {
        title: (
          <Space>
            <CheckCircleOutlined style={{ color: token.colorSuccess }} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: token.colorTextSecondary }}
            >
              สถานะ
            </span>
          </Space>
        ),
        dataIndex: "status",
        width: 140,
        align: "center",
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          (a.status ?? "").localeCompare(b.status ?? ""),
        render: (value: string) => {
          const config = getStatusConfig(value);
          const label =
            STATUS_OPTIONS.find((s) => s.value === value)?.label_th ||
            config.text;

          // Resolve Ant Design color presets to actual hex/theme colors
          const colorMap: Record<string, string> = {
            success: token.colorSuccess,
            processing: token.colorPrimary,
            error: token.colorError,
            warning: token.colorWarning,
            geekblue: "#2f54eb",
            gold: "#faad14",
            magenta: "#eb2f96",
            default: "#8c8c8c",
          };

          const statusColor = colorMap[config.color] || colorMap.default;

          let StatusIcon: any = ExclamationCircleFilled;
          let bgStyle = {};
          let iconBg = `${statusColor}15`;

          switch (value) {
            case "IN_PROGRESS":
              StatusIcon = SyncOutlined;
              bgStyle = {
                background: `linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}05 100%)`,
              };
              iconBg = statusColor;
              break;
            case "COMPLETED":
            case "DONE":
            case "APPROVED":
              StatusIcon = CheckCircleFilled;
              bgStyle = { background: `${statusColor}10` };
              iconBg = `${statusColor}20`;
              break;
            case "REJECTED":
            case "CANCELLED":
              StatusIcon = CloseCircleFilled;
              bgStyle = { background: `${statusColor}10` };
              iconBg = `${statusColor}20`;
              break;
            case "DRAFT":
            case "PENDING":
              StatusIcon = ClockCircleOutlined;
              bgStyle = { borderStyle: "dashed", background: "transparent" };
              iconBg = `${statusColor}10`;
              break;
            default:
              StatusIcon = TagOutlined;
              bgStyle = { background: `${statusColor}10` };
              iconBg = `${statusColor}15`;
          }

          const isDark = token.colorBgBase === "#0B0F19";

          return (
            <div
              className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-bold text-[13px] whitespace-nowrap min-w-[130px] transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group border border-solid"
              style={{
                borderColor: `${statusColor}30`,
                color: isDark ? statusColor : statusColor,
                ...bgStyle,
                boxShadow: isDark ? "none" : `0 2px 8px ${statusColor}10`,
              }}
            >
              <div
                className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-transform group-hover:rotate-12"
                style={{
                  background: iconBg,
                  color: value === "IN_PROGRESS" ? "#fff" : statusColor,
                  boxShadow:
                    value === "IN_PROGRESS"
                      ? `0 0 10px ${statusColor}40`
                      : "none",
                }}
              >
                {value === "IN_PROGRESS" ? (
                  <SyncOutlined spin style={{ fontSize: 14 }} />
                ) : (
                  <StatusIcon style={{ fontSize: 14 }} />
                )}
              </div>
              <span className="tracking-tight">{label}</span>

              {/* Subtle hover glow */}
              <div
                className="absolute inset-x-0 bottom-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: statusColor }}
              />
            </div>
          );
        },
      },
      {
        title: (
          <Space>
            <ClockCircleOutlined style={{ color: token.colorWarning }} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: token.colorTextSecondary }}
            >
              ระยะเวลา
            </span>
          </Space>
        ),
        dataIndex: "hours",
        width: 150,
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          Number(a.hours || 0) - Number(b.hours || 0),
        render: (value: number) => {
          const hours = Number(value) || 0;
          let color = token.colorTextHeading;
          if (hours >= 8) color = token.colorSuccess;
          else if (hours >= 4) color = token.colorPrimary;
          else if (hours > 0) color = token.colorWarning;

          return (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                style={{
                  background: `${color}10`,
                  color: color,
                  border: `1px solid ${color}20`,
                }}
              >
                <ThunderboltOutlined className="text-lg" />
              </div>
              <div className="flex flex-col">
                <span
                  className="font-black text-lg leading-none"
                  style={{ color }}
                >
                  {hours.toFixed(2)}
                </span>
                <span
                  className="text-[10px] font-bold opacity-60 uppercase"
                  style={{ color }}
                >
                  Hours
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "actions",
        fixed: "right",
        width: 110,
        align: "center",
        render: (_: any, r: TimesheetEntry) => (
          <div className="flex justify-center gap-2">
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                size="large"
                className="flex items-center justify-center hover:scale-110 transition-transform"
                icon={<EditOutlined style={{ color: token.colorWarning }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(r);
                }}
                style={{
                  background: `${token.colorWarning}15`,
                  borderRadius: 14,
                  width: 40,
                  height: 40,
                }}
              />
            </Tooltip>
            <Tooltip title="คัดลอก">
              <Button
                type="text"
                size="large"
                className="flex items-center justify-center hover:scale-110 transition-transform"
                icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(r);
                }}
                style={{
                  background: `${token.colorSuccess}15`,
                  borderRadius: 14,
                  width: 40,
                  height: 40,
                }}
              />
            </Tooltip>
          </div>
        ),
      },
    ],
    [onEdit, onCopy, getColumnSearchProps, token]
  );

  const isDark = token.colorBgBase === "#0B0F19";
  return (
    <Card
      bordered={false}
      title={
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
              boxShadow: `0 4px 12px ${token.colorPrimary}60`,
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 24, color: "white" }} />
          </div>
          <div>
            <Typography.Title
              level={4}
              style={{
                margin: 0,
                fontWeight: 700,
                color: token.colorTextHeading,
              }}
            >
              บันทึกเวลาทำงาน
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              จัดการและตรวจสอบรายการลงเวลาทั้งหมดของคุณ
            </Typography.Text>
          </div>
        </div>
      }
      extra={
        <TimesheetActions
          selectedCount={selectedRowKeys?.length}
          loading={actionLoading}
          refreshLoading={loading}
          onRefresh={onRefresh}
          onAdd={onAdd}
          onDelete={onDelete}
        />
      }
      className="glass-effect"
      style={{
        borderRadius: 24,
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.4)"
          : "0 8px 30px rgba(0,0,0,0.04)",
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
      bodyStyle={{ padding: 0 }}
    >
      <style jsx global>{`
        .ant-table-wrapper .ant-table-thead > tr > th {
          background: ${isDark
            ? token.colorFillQuaternary
            : token.colorFillAlter} !important;
          border-bottom: 2px solid ${token.colorPrimary}20 !important;
          padding-top: 20px !important;
          padding-bottom: 20px !important;
        }
        .ant-table-row {
          transition: all 0.3s ease !important;
        }
        .ant-table-row:hover > td {
          background: ${token.colorPrimary}05 !important;
        }
        .ant-table-row:hover .actions-group {
          opacity: 1 !important;
          transform: scale(1.05);
        }
      `}</style>
      <Table<TimesheetEntry>
        rowKey={(r) => String(r.id)}
        columns={columns}
        dataSource={entries}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: onRowSelect,
          columnWidth: 48,
        }}
        scroll={{ x: 900 }}
        pagination={{
          current: currentPage,
          pageSize,
          total: totalItems,
          onChange: onPageChange,
          showSizeChanger: true,
          itemRender: (_, type, element) => {
            if (type === "prev")
              return (
                <Button type="text" size="small">
                  ก่อนหน้า
                </Button>
              );
            if (type === "next")
              return (
                <Button type="text" size="small">
                  ถัดไป
                </Button>
              );
            return element;
          },
        }}
        onRow={(r) => ({
          onClick: () => onRowClick(r),
          style: { cursor: "pointer" },
        })}
      />
    </Card>
  );
};

// --- Create Modal Form ---
interface ProjectData {
  id: number | string;
  name: string;
}
interface SubProjectData {
  id: number | string;
  name: string;
}
interface CreateModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  form: FormInstance;
  projects: ProjectData[];
  subProject: SubProjectData[];
  fetchSubProjects: (id: string) => void;
  i18n: any;
  disabled: boolean;
  formMode?: "create" | "edit" | "copy";
}

const CreateModalForm: React.FC<CreateModalProps> = ({
  open,
  onCancel,
  onSubmit,
  form,
  projects,
  subProject,
  fetchSubProjects,
  i18n,
  disabled,
  formMode = "create",
}) => {
  const { token } = theme.useToken();
  useEffect(() => {
    if (open && formMode === "create") {
      form.resetFields();
      form.setFieldsValue({ status: "IN_PROGRESS", date: dayjs() });
    }
  }, [open, formMode, form]);

  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: (
          <Space>
            <ProjectOutlined style={{ color: token.colorPrimary }} />
            {p.name}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              (ID: {p.id})
            </Typography.Text>
          </Space>
        ),
        value: Number(p.id),
        labelString: p.name,
      })),
    [projects, token]
  );
  const subProjectOptions = useMemo(
    () =>
      subProject.map((s) => ({
        label: (
          <Space>
            <ApartmentOutlined style={{ color: token.colorWarning }} />
            {s.name}
          </Space>
        ),
        value: Number(s.id),
        labelString: s.name,
      })),
    [subProject, token]
  );
  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((s) => ({
        label: (
          <Tag color={getStatusConfig(s.value).color}>
            {i18n.language === "th" ? s.label_th : s.label_en}
          </Tag>
        ),
        value: s.value,
      })),
    [i18n.language]
  );

  return (
    <Modal
      open={open}
      title={
        <Space>
          <Typography.Title
            level={3}
            style={{ margin: 0, color: token.colorPrimary }}
          >
            <ThunderboltOutlined /> ลงเวลาทำงาน
          </Typography.Title>
        </Space>
      }
      onCancel={onCancel}
      width={900}
      centered
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Card
          bordered={false}
          style={{
            background: `linear-gradient(135deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 100%)`,
            marginBottom: 24,
            borderRadius: token.borderRadiusLG,
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Typography.Text
                strong
                style={{
                  color: token.colorPrimary,
                  marginBottom: 16,
                  display: "block",
                }}
              >
                <ProjectOutlined className="mr-2" /> โครงการที่รับผิดชอบ
              </Typography.Text>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="โครงการหลัก"
                name="project_id"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="เลือกโครงการ..."
                  options={projectOptions}
                  onChange={(v) => {
                    form.setFieldsValue({ sub_project_id: undefined });
                    if (v) fetchSubProjects(String(v));
                  }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.labelString ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="งานย่อย / ฟีเจอร์"
                name="sub_project_id"
                rules={[{ required: true }]}
                dependencies={["project_id"]}
              >
                <Select
                  placeholder="เลือกงานย่อย..."
                  options={subProjectOptions}
                  disabled={!form.getFieldValue("project_id")}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.labelString ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <div
          style={{
            background: `${token.colorFillAlter}30`,
            padding: 24,
            borderRadius: token.borderRadiusLG,
          }}
        >
          <Row gutter={20}>
            <Col xs={12} sm={8}>
              <Form.Item
                label="วันที่"
                name="date"
                rules={[{ required: true }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item
                label="ระยะเวลา (ชม.)"
                name="work_hour"
                rules={[
                  { required: true },
                  { type: "number", min: 0.1, max: 24 },
                ]}
              >
                <InputNumber style={{ width: "100%" }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="สถานะ" name="status">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Form.Item label="รายละเอียดการทำงาน" name="description">
            <Input.TextArea
              rows={4}
              showCount
              maxLength={500}
              placeholder="ระบุรายละเอียดงานที่ทำ..."
            />
          </Form.Item>
        </div>
        <Flex justify="end" gap={8} style={{ marginTop: 24 }}>
          <Button onClick={onCancel}>ยกเลิก</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={disabled}
            icon={<SaveOutlined />}
          >
            บันทึกข้อมูล
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
};

// --- Multi Entry Modal ---
interface MultiEntryModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (entries: any[]) => Promise<void>;
  projects: ProjectData[];
  subProjects: Record<string, SubProjectData[]>;
  fetchSubProjects: (id: string) => Promise<void>;
  disabled: boolean;
}
const MultiEntryModal: React.FC<MultiEntryModalProps> = ({
  open,
  onCancel,
  onSubmit,
  projects,
  subProjects,
  fetchSubProjects,
  disabled,
}) => {
  const { token } = theme.useToken();
  const { t, i18n } = useTranslation("translate");
  const [form] = Form.useForm();
  interface MultiEntryItem {
    id: string;
    status: string;
    date: Dayjs;
    project_id?: number;
    sub_project_id?: number;
    work_hour?: number;
    description?: string;
  }
  const [entries, setEntries] = useState<MultiEntryItem[]>([
    { id: `entry-${Date.now()}`, status: "IN_PROGRESS", date: dayjs() },
  ]);

  const addEntry = () =>
    setEntries((prev) => [
      ...prev,
      { id: `entry-${Date.now()}`, status: "IN_PROGRESS", date: dayjs() },
    ]);
  const removeEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));
  const updateEntry = (id: string, field: string, value: any) =>
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );

  const handleProjectChange = async (id: string, projectId: any) => {
    updateEntry(id, "project_id", projectId);
    updateEntry(id, "sub_project_id", undefined);
    form.setFieldsValue({
      [`project_id_${id}`]: projectId,
      [`sub_project_id_${id}`]: undefined,
    });
    await fetchSubProjects(String(projectId));
  };

  const handleFormSubmit = async () => {
    try {
      await form.validateFields();
      await onSubmit(entries);
      setEntries([
        { id: `entry-${Date.now()}`, status: "IN_PROGRESS", date: dayjs() },
      ]);
      form.resetFields();
    } catch {}
  };

  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: p.name,
        value: p.id,
        labelString: p.name,
      })),
    [projects]
  );
  const getSubProjectOptions = (pid?: number) =>
    pid && subProjects[String(pid)]
      ? subProjects[String(pid)].map((s) => ({
          label: s.name,
          value: Number(s.id),
          labelString: s.name,
        }))
      : [];

  return (
    <Modal
      open={open}
      title={
        <Space>
          <AppstoreAddOutlined /> ลงเวลาหลายรายการ
        </Space>
      }
      onCancel={onCancel}
      width={1000}
      footer={null}
    >
      <Form form={form} layout="vertical">
        <Alert
          message="สามารถเพิ่มรายการได้ทีละหลายรายการ"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <Space direction="vertical" style={{ width: "100%" }}>
            {entries.map((entry, idx) => (
              <Card
                key={entry.id}
                size="small"
                title={`รายการที่ ${idx + 1}`}
                extra={
                  entries.length > 1 && (
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => removeEntry(entry.id)}
                    />
                  )
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="โครงการ"
                      name={`project_id_${entry.id}`}
                      rules={[{ required: true }]}
                    >
                      <Select
                        options={projectOptions}
                        showSearch
                        onChange={(v) => handleProjectChange(entry.id, v)}
                        optionFilterProp="label"
                        placeholder="เลือกโครงการ"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="งานย่อย"
                      name={`sub_project_id_${entry.id}`}
                      rules={[{ required: true }]}
                    >
                      <Select
                        options={getSubProjectOptions(entry.project_id as any)}
                        showSearch
                        disabled={!entry.project_id}
                        onChange={(v) =>
                          updateEntry(entry.id, "sub_project_id", v)
                        }
                        optionFilterProp="label"
                        placeholder="เลือกงานย่อย"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="วันที่"
                      name={`date_${entry.id}`}
                      rules={[{ required: true }]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        onChange={(v) => updateEntry(entry.id, "date", v)}
                        placeholder="เลือกวันที่"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="ชม."
                      name={`work_hour_${entry.id}`}
                      rules={[{ required: true }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        step={0.5}
                        onChange={(v) => updateEntry(entry.id, "work_hour", v)}
                        placeholder="0.0"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="สถานะ" name={`status_${entry.id}`}>
                      <Select
                        options={STATUS_OPTIONS.map((s) => ({
                          label: s.label_th,
                          value: s.value,
                        }))}
                        onChange={(v) => updateEntry(entry.id, "status", v)}
                        placeholder="เลือกสถานะ"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      label="รายละเอียด"
                      name={`description_${entry.id}`}
                    >
                      <Input.TextArea
                        rows={2}
                        onChange={(e) =>
                          updateEntry(entry.id, "description", e.target.value)
                        }
                        placeholder="รายละเอียดงาน..."
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </div>
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={addEntry}
          style={{ marginTop: 16 }}
        >
          เพิ่มรายการ
        </Button>
        <Divider />
        <Flex justify="end" gap={8}>
          <Button onClick={onCancel}>ยกเลิก</Button>
          <Button type="primary" onClick={handleFormSubmit} loading={disabled}>
            บันทึกทั้งหมด ({entries.length})
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
};

// --- Bulk Entry All Users Modal ---
interface UserFromStorage {
  admin_id: number;
  employee_code: string | null;
  firstname: string;
  lastname: string;
  nickname: string | null;
  position: string | null;
  email: string;
  backlog_email: string | null;
  tel: string | null;
}

interface BulkProgressItem {
  admin_id: number;
  name: string;
  employee_code: string | null;
  status: "pending" | "processing" | "success" | "error";
  message?: string;
}

interface BulkEntryAllUsersModalProps {
  open: boolean;
  onCancel: () => void;
  projects: ProjectData[];
  subProject: SubProjectData[];
  fetchSubProjects: (id: string) => void;
  refetchEntries: () => void;
  rankBoardRefetch?: () => void;
}

const BulkEntryAllUsersModal: React.FC<BulkEntryAllUsersModalProps> = ({
  open,
  onCancel,
  projects,
  subProject,
  fetchSubProjects,
  refetchEntries,
  rankBoardRefetch,
}) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressList, setProgressList] = useState<BulkProgressItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [users, setUsers] = useState<UserFromStorage[]>([]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setIsUnlocked(false);
      setIsProcessing(false);
      setProgressList([]);
      setCompletedCount(0);
      setUsers([]);
      form.resetFields();
      passwordForm.resetFields();
    }
  }, [open, form, passwordForm]);

  // Fetch users from localStorage when modal opens
  useEffect(() => {
    if (open && isUnlocked) {
      try {
        const usersData = localStorage.getItem("users");
        if (usersData) {
          const parsedUsers = JSON.parse(usersData);
          setUsers(Array.isArray(parsedUsers) ? parsedUsers : []);
        }
      } catch (error) {
        console.error("Error parsing users from localStorage:", error);
        toast.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      }
    }
  }, [open, isUnlocked]);

  const handlePasswordSubmit = () => {
    const password = passwordForm.getFieldValue("password");
    if (password === "LIGHT") {
      setIsUnlocked(true);
      toast.success("ปลดล็อคสำเร็จ! สามารถลงเวลาให้ทุกคนได้แล้ว", {
        icon: <CheckCircleOutlined style={{ color: token.colorSuccess }} />,
      });
    } else {
      toast.error("รหัสผ่านไม่ถูกต้อง");
    }
  };

  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: (
          <Space>
            <ProjectOutlined style={{ color: token.colorPrimary }} />
            {p.name}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              (ID: {p.id})
            </Typography.Text>
          </Space>
        ),
        value: Number(p.id),
        labelString: p.name,
      })),
    [projects, token]
  );

  const subProjectOptions = useMemo(
    () =>
      subProject.map((s) => ({
        label: (
          <Space>
            <ApartmentOutlined style={{ color: token.colorWarning }} />
            {s.name}
          </Space>
        ),
        value: Number(s.id),
        labelString: s.name,
      })),
    [subProject, token]
  );

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((s) => ({
        label: <Tag color={getStatusConfig(s.value).color}>{s.label_th}</Tag>,
        value: s.value,
      })),
    []
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (users.length === 0) {
        toast.error("ไม่พบข้อมูลผู้ใช้ในระบบ");
        return;
      }

      setIsProcessing(true);
      setCompletedCount(0);

      // Initialize progress list
      const initialProgress: BulkProgressItem[] = users.map((user) => ({
        admin_id: user.admin_id,
        name: `${user.firstname} ${user.lastname}`,
        employee_code: user.employee_code,
        status: "pending",
      }));
      setProgressList(initialProgress);

      // Process each user sequentially
      for (let i = 0; i < users.length; i++) {
        const user = users[i];

        // Update status to processing
        setProgressList((prev) =>
          prev.map((item) =>
            item.admin_id === user.admin_id
              ? { ...item, status: "processing", message: "กำลังส่งข้อมูล..." }
              : item
          )
        );

        try {
          const payload = {
            project_id: values.project_id,
            sub_project_id: values.sub_project_id,
            description: values.description ?? "",
            work_hour: values.work_hour,
            status: values.status,
            date: values.date ? values.date.toDate() : undefined,
            by: user.admin_id,
          };

          await axios.post("/api/v1/timesheet/entry/insert/", payload, {
            headers: { "Content-Type": "application/json" },
          });

          // Update status to success
          setProgressList((prev) =>
            prev.map((item) =>
              item.admin_id === user.admin_id
                ? { ...item, status: "success", message: "สำเร็จ" }
                : item
            )
          );
        } catch (error: any) {
          // Update status to error
          setProgressList((prev) =>
            prev.map((item) =>
              item.admin_id === user.admin_id
                ? {
                    ...item,
                    status: "error",
                    message: error?.message || "เกิดข้อผิดพลาด",
                  }
                : item
            )
          );
        }

        setCompletedCount((prev) => prev + 1);

        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const successCount = users.filter((_, idx) => {
        const item = progressList[idx];
        return item?.status === "success";
      }).length;

      toast.success(
        `ส่งข้อมูลเสร็จสิ้น! สำเร็จ ${completedCount} จาก ${users.length} คน`
      );
      refetchEntries();
      rankBoardRefetch?.();
    } catch (error) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
    } finally {
      setIsProcessing(false);
    }
  };

  const progressPercent =
    users.length > 0 ? Math.round((completedCount / users.length) * 100) : 0;

  // Password Gate UI
  if (!isUnlocked) {
    return (
      <Modal
        open={open}
        title={
          <Space>
            <div
              className="p-2 rounded-xl"
              style={{
                background: `${token.colorWarning}20`,
                color: token.colorWarning,
              }}
            >
              <LockOutlined style={{ fontSize: 20 }} />
            </div>
            <div>
              <Typography.Title level={4} className="m-0">
                ลงเวลาทำงานให้ทุกคน
              </Typography.Title>
              <Typography.Text type="secondary" className="text-[12px]">
                ต้องใช้รหัสผ่านเพื่อเข้าถึงฟีเจอร์นี้
              </Typography.Text>
            </div>
          </Space>
        }
        onCancel={onCancel}
        width={500}
        centered
        footer={null}
      >
        <div className="py-8 px-6 text-center">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background: `${token.colorWarning}20`,
            }}
          >
            <LockOutlined style={{ fontSize: 40, color: token.colorWarning }} />
          </div>

          <Typography.Title level={5} className="mb-2">
            ฟีเจอร์นี้ต้องใช้รหัสผ่านเพิ่มเติม
          </Typography.Title>
          <Typography.Text type="secondary" className="block mb-6">
            เพื่อป้องกันการใช้งานโดยไม่ได้ตั้งใจ กรุณาใส่รหัสผ่าน
          </Typography.Text>

          <Form form={passwordForm} onFinish={handlePasswordSubmit}>
            <Form.Item
              name="password"
              rules={[{ required: true, message: "กรุณาใส่รหัสผ่าน" }]}
            >
              <Input.Password
                size="large"
                placeholder="ใส่รหัสผ่าน..."
                prefix={<LockOutlined />}
                className="rounded-xl"
                onPressEnter={handlePasswordSubmit}
              />
            </Form.Item>
            <Button
              type="primary"
              size="large"
              block
              icon={<UnlockOutlined />}
              onClick={handlePasswordSubmit}
              className="h-12 rounded-xl font-semibold border-none"
              style={{
                background: token.colorWarning,
              }}
            >
              ปลดล็อค
            </Button>
          </Form>
        </div>
      </Modal>
    );
  }

  // Main Form UI (after unlocked)
  return (
    <Modal
      open={open}
      title={
        <Space>
          <div
            className="p-2 rounded-xl"
            style={{
              background: `${token.colorSuccess}20`,
              color: token.colorSuccess,
            }}
          >
            <TeamOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <Typography.Title
              level={4}
              className="m-0"
              style={{
                color: token.colorSuccess,
              }}
            >
              ลงเวลาทำงานให้ทุกคน
            </Typography.Title>
            <Typography.Text type="secondary" className="text-[12px]">
              พร้อมส่งข้อมูลให้เพื่อนร่วมงานทั้ง {users.length} คน
            </Typography.Text>
          </div>
        </Space>
      }
      onCancel={onCancel}
      width={900}
      centered
      footer={null}
      maskClosable={!isProcessing}
      closable={!isProcessing}
    >
      {/* Processing Progress View */}
      {isProcessing && (
        <div className="mb-6">
          <Card
            bordered={false}
            className="rounded-2xl"
            style={{
              background: token.colorPrimaryBg,
            }}
          >
            <Flex vertical align="center" gap={16}>
              <Progress
                type="circle"
                percent={progressPercent}
                strokeColor={{
                  "0%": token.colorPrimary,
                  "100%": token.colorSuccess,
                }}
                format={() => (
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {completedCount}/{users.length}
                    </div>
                    <div className="text-xs text-secondary-text">คน</div>
                  </div>
                )}
              />
              <Typography.Text strong>กำลังดำเนินการ...</Typography.Text>
            </Flex>
          </Card>

          {/* Progress List */}
          <div className="max-h-[300px] overflow-y-auto mt-4 px-2">
            <Space direction="vertical" style={{ width: "100%" }} size={8}>
              {progressList.map((item) => (
                <div
                  key={item.admin_id}
                  className="px-4 py-3 rounded-xl transition-all duration-300 border border-solid"
                  style={{
                    background:
                      item.status === "processing"
                        ? `${token.colorPrimaryBg}`
                        : item.status === "success"
                        ? `${token.colorSuccessBg}`
                        : item.status === "error"
                        ? `${token.colorErrorBg}`
                        : token.colorFillQuaternary,
                    borderColor:
                      item.status === "processing"
                        ? token.colorPrimary
                        : item.status === "success"
                        ? token.colorSuccess
                        : item.status === "error"
                        ? token.colorError
                        : token.colorBorder,
                  }}
                >
                  <Flex justify="space-between" align="center">
                    <Space>
                      {item.status === "pending" && (
                        <ClockCircleOutlined
                          style={{ color: token.colorTextSecondary }}
                        />
                      )}
                      {item.status === "processing" && (
                        <SyncOutlined
                          spin
                          style={{ color: token.colorPrimary }}
                        />
                      )}
                      {item.status === "success" && (
                        <CheckCircleFilled
                          style={{ color: token.colorSuccess }}
                        />
                      )}
                      {item.status === "error" && (
                        <CloseCircleFilled
                          style={{ color: token.colorError }}
                        />
                      )}
                      <div>
                        <Typography.Text strong>{item.name}</Typography.Text>
                        {item.employee_code && (
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 12, marginLeft: 8 }}
                          >
                            ({item.employee_code})
                          </Typography.Text>
                        )}
                      </div>
                    </Space>
                    <Typography.Text
                      style={{
                        color:
                          item.status === "processing"
                            ? token.colorPrimary
                            : item.status === "success"
                            ? token.colorSuccess
                            : item.status === "error"
                            ? token.colorError
                            : token.colorTextSecondary,
                        fontSize: 12,
                      }}
                    >
                      {item.status === "pending" && "รอดำเนินการ"}
                      {item.status === "processing" &&
                        `กำลังส่งข้อมูลของ ${item.name}${
                          item.employee_code ? ` (${item.employee_code})` : ""
                        }`}
                      {item.status === "success" &&
                        `ส่งข้อมูลของ ${item.name}${
                          item.employee_code ? ` (${item.employee_code})` : ""
                        } สำเร็จ`}
                      {item.status === "error" && item.message}
                    </Typography.Text>
                  </Flex>
                </div>
              ))}
            </Space>
          </div>
        </div>
      )}

      {/* Form View (when not processing) */}
      {!isProcessing && (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: "IN_PROGRESS", date: dayjs() }}
        >
          <Alert
            message={
              <Space>
                <InfoCircleOutlined />
                <span>
                  ระบบจะลง Timesheet ให้พนักงานทุกคน ({users.length} คน)
                  ด้วยข้อมูลเดียวกัน
                </span>
              </Space>
            }
            type="warning"
            showIcon={false}
            style={{ marginBottom: 24, borderRadius: 12 }}
          />

          <Card
            bordered={false}
            style={{
              background: `linear-gradient(135deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 100%)`,
              marginBottom: 24,
              borderRadius: token.borderRadiusLG,
            }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Typography.Text
                  strong
                  style={{
                    color: token.colorPrimary,
                    marginBottom: 16,
                    display: "block",
                  }}
                >
                  <ProjectOutlined className="mr-2" /> โครงการที่รับผิดชอบ
                </Typography.Text>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="โครงการหลัก"
                  name="project_id"
                  rules={[{ required: true, message: "กรุณาเลือกโครงการ" }]}
                >
                  <Select
                    placeholder="เลือกโครงการ..."
                    options={projectOptions}
                    onChange={(v) => {
                      form.setFieldsValue({ sub_project_id: undefined });
                      if (v) fetchSubProjects(String(v));
                    }}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.labelString ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="งานย่อย / ฟีเจอร์"
                  name="sub_project_id"
                  rules={[{ required: true, message: "กรุณาเลือกงานย่อย" }]}
                  dependencies={["project_id"]}
                >
                  <Select
                    placeholder="เลือกงานย่อย..."
                    options={subProjectOptions}
                    disabled={!form.getFieldValue("project_id")}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.labelString ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div
            style={{
              background: `${token.colorFillAlter}30`,
              padding: 24,
              borderRadius: token.borderRadiusLG,
            }}
          >
            <Row gutter={20}>
              <Col xs={12} sm={8}>
                <Form.Item
                  label="วันที่"
                  name="date"
                  rules={[{ required: true, message: "กรุณาเลือกวันที่" }]}
                >
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={12} sm={8}>
                <Form.Item
                  label="ระยะเวลา (ชม.)"
                  name="work_hour"
                  rules={[
                    { required: true, message: "กรุณาระบุจำนวนชั่วโมง" },
                    {
                      type: "number",
                      min: 0.1,
                      max: 24,
                      message: "ระบุ 0.1-24 ชั่วโมง",
                    },
                  ]}
                >
                  <InputNumber style={{ width: "100%" }} min={0} step={0.5} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="สถานะ" name="status">
                  <Select options={statusOptions} />
                </Form.Item>
              </Col>
            </Row>
            <Divider />
            <Form.Item label="รายละเอียดการทำงาน" name="description">
              <Input.TextArea
                rows={4}
                showCount
                maxLength={500}
                placeholder="ระบุรายละเอียดงานที่ทำ (จะใช้กับทุกคน)..."
              />
            </Form.Item>
          </div>

          <Flex
            justify="space-between"
            align="center"
            style={{ marginTop: 24 }}
          >
            <Typography.Text type="secondary">
              <TeamOutlined /> จะส่งให้ทั้งหมด {users.length} คน
            </Typography.Text>
            <Space>
              <Button onClick={onCancel}>ยกเลิก</Button>
              <Button
                type="primary"
                icon={<TeamOutlined />}
                onClick={handleSubmit}
                loading={isProcessing}
                style={{
                  background: `linear-gradient(135deg, ${token.colorWarning} 0%, ${token.colorSuccess} 100%)`,
                  border: "none",
                  fontWeight: 600,
                }}
              >
                ลงเวลาให้ทุกคน ({users.length} คน)
              </Button>
            </Space>
          </Flex>
        </Form>
      )}

      {/* Show close button after processing is done */}
      {!isProcessing && completedCount > 0 && (
        <Flex justify="center" style={{ marginTop: 16 }}>
          <Button onClick={onCancel} type="primary">
            ปิด
          </Button>
        </Flex>
      )}
    </Modal>
  );
};

// ==========================================
// 2. MAIN PAGE COMPONENT
// ==========================================

export default function TimesheetEntryPage() {
  const dispatch = useDispatch();
  const i18n = i18next;
  const [form] = Form.useForm();
  const isMountedRef = useRef(true);
  const rankBoardRef = useRef<MonthlyRankBoardRef>(null);
  const { token } = theme.useToken();
  const isDark = token.colorBgBase === "#0B0F19";
  const authState = useAppSelector((state) => state.callAdminLogin);
  const timesheetState = useAppSelector((state) => state.timesheet);

  // State
  const [multiEntryModalOpen, setMultiEntryModalOpen] = useState(false);
  const [bulkAllUsersModalOpen, setBulkAllUsersModalOpen] = useState(false);
  const [subProjectsCache, setSubProjectsCache] = useState<
    Record<string, any[]>
  >({});

  const adminId = useMemo(
    () => Number(authState?.response?.data?.user_data?.admin_id) || undefined,
    [authState?.response?.data?.user_data?.admin_id]
  );
  const adminName = authState?.response?.data?.user_data?.firstname || "User";

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
  const { actionLoading, submitTimesheet, deleteTimesheet } =
    useTimesheetActions(adminId, isMountedRef, refetchEntries, () =>
      rankBoardRef.current?.refetch()
    );
  const { fetchProjects, fetchSubProjects } = useProjectData(
    isMountedRef,
    dispatch,
    setProjects,
    setSubProjects,
    setLoading
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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
      await fetchSubProjects(Number(record.project_id));
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
    [dispatch, fetchSubProjects, form]
  );

  const openCopyForm = useCallback(
    async (record: TimesheetEntry) => {
      dispatch(setFormMode("copy"));
      dispatch(setActiveRecord(null));
      await fetchSubProjects(Number(record.project_id));
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
    [dispatch, fetchSubProjects, form]
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

  const handleSubmitTimesheet = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const success = await submitTimesheet(
        values,
        timesheetState.formMode,
        timesheetState.activeRecord?.id
      );
      if (success && isMountedRef.current) closeModal();
    } catch {}
  }, [form, submitTimesheet, timesheetState, closeModal]);

  const handleDeleteTimesheet = useCallback(async () => {
    const success = await deleteTimesheet(timesheetState.selectedRowKeys);
    if (success && isMountedRef.current) {
      dispatch(setSelectedRowKeys([]));
      closeModal();
    }
  }, [deleteTimesheet, timesheetState.selectedRowKeys, dispatch, closeModal]);

  const handlePageChange = useCallback(
    (page: number, size?: number) => {
      setCurrentPage(page);
      if (size && size !== pageSize) setPageSize(size);
    },
    [pageSize, setCurrentPage, setPageSize]
  );

  // Multi Entry Logic
  const openMultiEntryForm = useCallback(
    () => setMultiEntryModalOpen(true),
    []
  );
  const closeMultiEntryModal = useCallback(() => {
    setMultiEntryModalOpen(false);
    setSubProjectsCache({});
  }, []);

  // Bulk All Users Entry Logic
  const openBulkAllUsersModal = useCallback(
    () => setBulkAllUsersModalOpen(true),
    []
  );
  const closeBulkAllUsersModal = useCallback(
    () => setBulkAllUsersModalOpen(false),
    []
  );
  const fetchSubProjectsForMulti = useCallback(
    async (projectId: string) => {
      if (subProjectsCache[projectId]) return;
      await fetchSubProjects(Number(projectId));
      if (isMountedRef.current && timesheetState.subProjects)
        setSubProjectsCache((prev) => ({
          ...prev,
          [projectId]: timesheetState.subProjects,
        }));
    },
    [fetchSubProjects, subProjectsCache, timesheetState.subProjects]
  );

  const handleSubmitMultipleTimesheets = useCallback(
    async (entries: any[]) => {
      if (!adminId) return;
      toast.loading("กำลังบันทึก Timesheet ทั้งหมด...");
      try {
        const promises = entries.map((entry) =>
          submitTimesheet(
            {
              project_id: entry.project_id,
              sub_project_id: entry.sub_project_id,
              description: entry.description || "",
              work_hour: entry.work_hour,
              status: entry.status,
              date: entry.date,
            },
            "create",
            undefined
          )
        );
        const results = await Promise.all(promises);
        const successCount = results.filter((r) => r).length;
        toast.dismiss();
        if (successCount === entries.length) {
          toast.success(`บันทึกสำเร็จทั้งหมด ${successCount} รายการ`);
          closeMultiEntryModal();
        } else {
          toast.warning(
            `บันทึกสำเร็จ ${successCount} จาก ${entries.length} รายการ`
          );
        }
      } catch {
        toast.dismiss();
        toast.error("เกิดข้อผิดพลาดในการบันทึก");
      }
    },
    [adminId, submitTimesheet, closeMultiEntryModal]
  );

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            padding: "32px",
            minHeight: "100vh",
            background: isDark
              ? `radial-gradient(at 0% 0%, ${token.colorPrimary}10 0px, transparent 50%), 
                 radial-gradient(at 100% 0%, ${token.colorInfo}10 0px, transparent 50%),
                 ${token.colorBgLayout}`
              : `radial-gradient(at 0% 0%, ${token.colorPrimary}05 0px, transparent 50%), 
                 radial-gradient(at 100% 0%, ${token.colorInfo}05 0px, transparent 50%),
                 ${token.colorBgLayout}`,
            transition: "background 0.5s ease",
          }}
        >
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <PageHeader
              adminName={adminName}
              onAddClick={openCreateForm}
              onAddMultiClick={openMultiEntryForm}
              onBulkAllClick={openBulkAllUsersModal}
              token={token}
            />
            <StatsGrid
              adminId={adminId}
              rankBoardRef={rankBoardRef}
              weeklySummary={weeklySummary as any}
              topProjectUsage={topProjectUsage}
              topFeatureUsage={topFeatureUsage}
              loading={tableLoading}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <TimesheetTable
                entries={entries}
                loading={tableLoading}
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalItems}
                selectedRowKeys={timesheetState?.selectedRowKeys}
                actionLoading={actionLoading}
                onPageChange={handlePageChange}
                onRowSelect={(keys) => dispatch(setSelectedRowKeys(keys))}
                onRowClick={openDetailModal}
                onEdit={openEditForm}
                onCopy={openCopyForm}
                onRefresh={refetchEntries}
                onAdd={openCreateForm}
                onDelete={openDeleteModal}
              />
            </motion.div>
          </Space>

          <CreateModalForm
            open={timesheetState?.modalType === "form"}
            onCancel={closeModal}
            onSubmit={handleSubmitTimesheet}
            form={form}
            projects={timesheetState.projects}
            subProject={timesheetState.subProjects}
            fetchSubProjects={(id) => fetchSubProjects(Number(id))}
            i18n={i18n}
            disabled={actionLoading}
            formMode={timesheetState.formMode}
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
            onConfirm={handleDeleteTimesheet}
            selectedCount={timesheetState.selectedRowKeys.length}
            loading={actionLoading}
          />
          <MultiEntryModal
            open={multiEntryModalOpen}
            onCancel={closeMultiEntryModal}
            onSubmit={handleSubmitMultipleTimesheets}
            projects={timesheetState.projects}
            subProjects={subProjectsCache}
            fetchSubProjects={fetchSubProjectsForMulti}
            disabled={actionLoading}
          />
          <BulkEntryAllUsersModal
            open={bulkAllUsersModalOpen}
            onCancel={closeBulkAllUsersModal}
            projects={timesheetState.projects}
            subProject={timesheetState.subProjects}
            fetchSubProjects={(id) => fetchSubProjects(Number(id))}
            refetchEntries={refetchEntries}
            rankBoardRefetch={() => rankBoardRef.current?.refetch()}
          />
        </motion.div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
