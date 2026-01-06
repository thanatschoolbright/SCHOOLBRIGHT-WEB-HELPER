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
  token: any;
}
const PageHeader: React.FC<PageHeaderProps> = ({
  adminName,
  onAddClick,
  onAddMultiClick,
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
  const timeEmoji =
    dayjs().hour() < 18 ? (dayjs().hour() < 12 ? "☀️" : "🌤️") : "🌙";

  const handleOpenGuide = () => {
    window.open(
      "https://docs.google.com/document/d/1bfkhcYs_X79c5j2uZ5pH-C5QAeIjN91aSVNNZEf2guI/edit?usp=sharing",
      "_blank",
      "noopener,noreferrer"
    );
  };
  return (
    <Card
      bordered={false}
      style={{
        background: `linear-gradient(120deg, ${token.colorBgContainer} 60%, ${token.colorPrimary}15 100%)`,
        borderRadius: 24,
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
        overflow: "hidden",
        position: "relative",
      }}
      bodyStyle={{ padding: "32px 40px" }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${token.colorPrimary}20 0%, transparent 70%)`,
        }}
      />

      <Row justify="space-between" align="middle" gutter={[24, 24]}>
        <Col flex="auto">
          <Flex vertical gap={6}>
            <Space align="center" size={12}>
              <div style={{ fontSize: 32 }}>{timeEmoji}</div>
              <Typography.Title
                level={2}
                style={{
                  margin: 0,
                  fontWeight: 800,
                  background: `linear-gradient(45deg, ${token.colorText}, ${token.colorPrimary})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {greeting}, คุณ{adminName}
              </Typography.Title>
            </Space>
            <Typography.Text type="secondary" style={{ fontSize: 16 }}>
              จัดการเวลาทำงานของคุณได้ที่นี่ •{" "}
              <span style={{ color: token.colorSuccess }}>
                พร้อมลุยงานวันนี้หรือยัง? 🚀
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
            <Badge count="ใหม่" offset={[-5, 5]} color={token.colorError}>
              <Button
                size="large"
                icon={<AppstoreAddOutlined />}
                onClick={onAddMultiClick}
                style={{
                  height: 48,
                  borderRadius: 24,
                  background: token.colorFillSecondary,
                  border: "none",
                  color: token.colorText,
                }}
              >
                ลงเวลาหลายรายการ
              </Button>
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

    return (
      <Card
        hoverable
        style={{
          height: "100%",
          borderRadius: 24,
          border: "none",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
          background: `linear-gradient(165deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`,
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
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: token.colorPrimary,
            opacity: 0.08,
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        <div style={{ padding: "24px 24px 16px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
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
                  style={{
                    padding: 8,
                    borderRadius: 12,
                    background: `${token.colorWarning}20`,
                    color: token.colorWarning,
                  }}
                >
                  <TrophyFilled />
                </div>
                <span
                  style={{
                    background: `linear-gradient(90deg, ${token.colorText} 0%, ${token.colorTextSecondary} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {currentAdminId ? "อันดับของคุณ" : "พนักงานดีเด่น"}
                </span>
              </Typography.Title>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 12, marginTop: 4, display: "block" }}
              >
                🔥 ใครขยันที่สุดในเดือนนี้?
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

        <div
          style={{
            padding: "0 24px 24px 24px",
            flex: 1,
            overflowY: "auto",
            position: "relative",
          }}
        >
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
                        <div style={{ flex: 1 }}>
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
                  {visibleRecords.map((record) => (
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
                        rank={record.rank}
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
          <div style={{ flex: 1 }}>
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
                title="โครงการยอดนิยม 🚀"
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
                title="ฟีเจอร์มาแรง 🔥"
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
          <span
            style={{
              color: token.colorTextSecondary,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            วันที่
          </span>
        ),
        dataIndex: "date",
        width: 90,
        align: "center",
        responsive: ["md"],
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (value: string) => (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              borderRadius: 16,
              background: token.colorFillQuaternary,
              border: `1px solid ${token.colorBorderSecondary}`,
              margin: "0 auto",
            }}
          >
            <Typography.Text
              strong
              style={{ fontSize: 20, color: token.colorPrimary, lineHeight: 1 }}
            >
              {dayjs(value).format("DD")}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {dayjs(value).format("MMM")}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: (
          <span
            style={{
              color: token.colorTextSecondary,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            โครงการ / งาน
          </span>
        ),
        dataIndex: "project_name",
        width: 320,
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          a.project_name.localeCompare(b.project_name),
        ...getColumnSearchProps("project_name", "โครงการ"),
        render: (value: string, record: TimesheetEntry) => {
          const avatarColor = stringToColor(value);
          const isTop = false; // Mock logic
          return (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                padding: "8px 0",
              }}
            >
              <div style={{ position: "relative" }}>
                <Avatar
                  shape="square"
                  size={48}
                  src={`https://api.dicebear.com/9.x/icons/svg?seed=${record.project_id}`}
                  style={{
                    backgroundColor: `${avatarColor}15`,
                    border: `1px solid ${avatarColor}30`,
                    borderRadius: 14,
                    padding: 8,
                  }}
                />
                {isTop && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -5,
                      right: -5,
                      background: "orange",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      border: "2px solid white",
                    }}
                  >
                    🔥
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  height: 48,
                }}
              >
                <Typography.Text
                  strong
                  style={{ fontSize: 16, color: token.colorTextHeading }}
                  ellipsis
                >
                  {value}
                </Typography.Text>
                {record.feature_name ? (
                  <Space size={4} style={{ marginTop: 2 }}>
                    <Tag
                      color="cyan"
                      style={{
                        margin: 0,
                        borderRadius: 4,
                        fontSize: 10,
                        border: "none",
                        lineHeight: "16px",
                      }}
                    >
                      ฟีเจอร์
                    </Tag>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 13 }}
                      ellipsis
                    >
                      {record.feature_name}
                    </Typography.Text>
                  </Space>
                ) : (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    -
                  </Typography.Text>
                )}
              </div>
            </div>
          );
        },
      },
      {
        title: (
          <span
            style={{
              color: token.colorTextSecondary,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            สถานะ
          </span>
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

          let StatusIcon: any = ExclamationCircleFilled;
          let isSpin = false;
          let bgStyle = {};

          switch (value) {
            case "IN_PROGRESS":
              StatusIcon = SyncOutlined;
              isSpin = true;
              bgStyle = {
                background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${config.color}15 100%)`,
              };
              break;
            case "COMPLETED":
            case "DONE":
            case "APPROVED":
              StatusIcon = CheckCircleFilled;
              bgStyle = { background: `${config.color}10` };
              break;
            case "REJECTED":
            case "CANCELLED":
              StatusIcon = CloseCircleFilled;
              bgStyle = { background: `${config.color}10` };
              break;
            case "DRAFT":
            case "PENDING":
              StatusIcon = ClockCircleOutlined;
              bgStyle = { borderStyle: "dashed" };
              break;
            default:
              StatusIcon = TagOutlined;
          }

          return (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                columnGap: 8,
                padding: "6px 14px",
                borderRadius: 30,
                border: `1.5px solid ${config.color}40`,
                color: config.color,
                fontWeight: 600,
                fontSize: 13,
                boxShadow: `0 4px 10px -4px ${config.color}60`,
                transition: "all 0.3s ease",
                cursor: "default",
                minWidth: 120,
                ...bgStyle,
              }}
              className="status-badge"
            >
              <StatusIcon spin={isSpin} style={{ fontSize: 16 }} />
              {label}
            </div>
          );
        },
      },
      {
        title: (
          <span
            style={{
              color: token.colorTextSecondary,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ระยะเวลา
          </span>
        ),
        dataIndex: "hours",
        width: 180,
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          Number(a.hours || 0) - Number(b.hours || 0),
        render: (value: number) => {
          const hours = Number(value) || 0;
          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingRight: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: token.colorFillSecondary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: token.colorTextTertiary,
                }}
              >
                <ClockCircleOutlined style={{ fontSize: 16 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: token.colorTextHeading,
                    lineHeight: 1.2,
                  }}
                >
                  {hours.toFixed(2)}
                </span>
                <span style={{ fontSize: 11, color: token.colorTextSecondary }}>
                  ชั่วโมง
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "actions",
        fixed: "right",
        width: 100,
        align: "center",
        render: (_: any, r: TimesheetEntry) => (
          <Space.Compact
            size="middle"
            className="actions-group"
            style={{ opacity: 0.8, transition: "0.3s" }}
          >
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                shape="circle"
                icon={<EditOutlined style={{ color: token.colorWarning }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(r);
                }}
                style={{ background: token.colorFillQuaternary }}
              />
            </Tooltip>
            <Tooltip title="คัดลอก">
              <Button
                type="text"
                shape="circle"
                icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(r);
                }}
                style={{ background: token.colorFillQuaternary }}
              />
            </Tooltip>
          </Space.Compact>
        ),
      },
    ],
    [onEdit, onCopy, getColumnSearchProps, token]
  );

  return (
    <Card
      bordered={false}
      title={
        <div className="flex items-center gap-4">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 12px ${token.colorPrimary}40`,
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 24, color: "white" }} />
          </div>
          <div>
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              บันทึกเวลาทำงาน
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ตารางแสดงรายการลงเวลาทั้งหมด
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
      style={{
        borderRadius: 24,
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
      bodyStyle={{ padding: 0 }}
    >
      <style jsx global>{`
        .ant-table-wrapper .ant-table-thead > tr > th {
          background: ${token.colorBgContainer} !important;
          border-bottom: 2px solid ${token.colorFillSecondary} !important;
          padding-top: 20px !important;
          padding-bottom: 20px !important;
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
            ⚡ ลงเวลาทำงาน
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
        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
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
  const authState = useAppSelector((state) => state.callAdminLogin);
  const timesheetState = useAppSelector((state) => state.timesheet);

  // State
  const [multiEntryModalOpen, setMultiEntryModalOpen] = useState(false);
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
            background: token.colorBgLayout,
          }}
        >
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <PageHeader
              adminName={adminName}
              onAddClick={openCreateForm}
              onAddMultiClick={openMultiEntryForm}
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
        </motion.div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
