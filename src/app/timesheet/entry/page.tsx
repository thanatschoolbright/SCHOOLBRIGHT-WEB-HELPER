"use client";

import {
  ApartmentOutlined,
  AppstoreAddOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleFilled,
  CloudOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FireOutlined,
  InfoCircleOutlined,
  LockOutlined,
  MoonOutlined,
  MoreOutlined,
  PlusOutlined,
  ProjectOutlined,
  ReloadOutlined,
  RocketOutlined,
  SafetyCertificateFilled,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  SunOutlined,
  SyncOutlined,
  TagOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyFilled,
  UnlockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Dropdown,
  Empty,
  Flex,
  Form,
  FormInstance,
  Input,
  InputNumber,
  InputRef,
  Modal,
  Popover,
  Progress,
  Radio,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { ColumnType } from "antd/lib/table";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import isBetween from "dayjs/plugin/isBetween";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import PermissionLayout from "@/components/layouts/permission-layout";
import { TimesheetActions } from "@components/button/timesheet-actions";
import { TimesheetStatCard } from "@components/card/timesheet-stat-card";
import { TableSearch } from "@components/input-field/table-search";
import DashboardLayout from "@components/layouts/backend-layout";
import { DeleteConfirmationModal } from "@components/modal/delete-confirmation-modal";
import StatusModal from "@components/modal/status-modal";
import { DetailModal } from "@components/timesheet/detail-modal";
import { RankBoardHeader } from "@components/timesheet/rank-board-header";
import { RankCard } from "@components/timesheet/rank-card";
import { WeeklySummary } from "@components/timesheet/weekly-summary";

import { callApiService as axios } from "@services/axios-instance/sb-helper.axios";
import {
  setActiveRecord,
  setFormMode,
  setLoading,
  setModalType,
  setProjects,
  setSelectedRowKeys,
  setSubProjects,
} from "@stores/reducers/timesheet/timesheet-reducer";
import { useAppSelector } from "@stores/store";

import {
  useMonthlySummaryAPI,
  useTimesheetEntries,
  useTopUsage,
} from "@/hooks/use-timesheet-data";
import { ApiResponse, SummaryMetadata, SummaryRecord } from "@/types/timesheet";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import {
  useProjectData,
  useTimesheetActions,
} from "./hooks/use-timesheet-actions.data";
import {
  SearchableColumnKey,
  TimesheetEntry,
  TopUsage,
} from "./types/timesheet-entry.types";
import {
  DAILY_TARGET_HOURS,
  DATE_FORMAT,
  getStatusConfig,
} from "./utils/timesheet-entry.helpers";

dayjs.extend(isBetween);
dayjs.extend(buddhistEra);
dayjs.locale("th");

// ==========================================
// 1. HELPER COMPONENTS
// ==========================================

// --- My Work Modal ---
interface MyWorkItem {
  id: number;
  projectId: number;
  featureId: number | null;
  userId: number;
  position: string | null;
  project: {
    id: number;
    name: string;
    name_en: string | null;
    status: string;
  };
  feature: {
    id: number;
    name: string;
    name_en: string | null;
    status: string;
    ticket_number?: string | null;
  } | null;
}

interface MyWorkModalProps {
  open: boolean;
  onCancel: () => void;
  userId?: number;
}

const MyWorkModal: React.FC<MyWorkModalProps> = ({
  open,
  onCancel,
  userId,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MyWorkItem[]>([]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v1/timesheet/my-work?user_id=${userId}`,
      );
      setData(response.data?.data ?? []);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลงานคืนได้");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  const columns = [
    {
      title: t("timesheet_entry_page.table_project", "โครงการ"),
      dataIndex: ["project", "name"],
      key: "project",
      render: (text: string, record: MyWorkItem) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{text}</Typography.Text>
          {record.project.name_en && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.project.name_en}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: t("timesheet_entry_page.sub_task_feature", "งานย่อย / ฟีเจอร์"),
      dataIndex: ["feature", "name"],
      key: "feature",
      render: (text: string, record: MyWorkItem) =>
        text ? (
          <Space direction="vertical" size={0}>
            <Space size={4}>
              {record.feature?.ticket_number && (
                <Tag color="blue" bordered={false} style={{ margin: 0 }}>
                  {record.feature.ticket_number}
                </Tag>
              )}
              <Typography.Text>{text}</Typography.Text>
            </Space>
            {record.feature?.name_en && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {record.feature.name_en}
              </Typography.Text>
            )}
          </Space>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
    {
      title: t("timesheet_entry_page.position_role", "ตำแหน่ง / บทบาท"),
      dataIndex: "position",
      key: "position",
      render: (text: string) =>
        text || (
          <Typography.Text type="secondary">
            {t("timesheet_entry_page.not_specified", "ไม่ได้ระบุ")}
          </Typography.Text>
        ),
    },
    {
      title: t("timesheet_entry_page.table_status", "สถานะ"),
      key: "status",
      render: (_: any, record: MyWorkItem) => (
        <Space>
          <Tag
            color={record.project.status === "open" ? "processing" : "default"}
          >
            Project: {record.project.status.toUpperCase()}
          </Tag>
          {record.feature && (
            <Tag color={record.feature.status === "open" ? "cyan" : "default"}>
              Feature: {record.feature.status.toUpperCase()}
            </Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title={
        <Space size={12}>
          <div className="p-2 rounded-xl  text-blue-500">
            <UserOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {t("timesheet_entry_page.my_work", "งานของฉัน")}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t(
                "timesheet_entry_page.my_work_description",
                "รายการโครงการและฟีเจอร์ที่คุณได้รับมอบหมาย",
              )}
            </Typography.Text>
          </div>
        </Space>
      }
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="close" onClick={onCancel}>
          ปิด
        </Button>,
      ]}
    >
      <div className="py-4">
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: t(
              "timesheet_entry_page.no_assigned_work",
              "ไม่พบข้อมูลงานที่ได้รับมอบหมาย",
            ),
          }}
        />
      </div>
    </Modal>
  );
};

// --- Page Header ---
interface PageHeaderProps {
  admin_name: string;
  admin_id?: number;
  on_add_click: () => void;
  on_add_multi_click: () => void;
  on_bulk_all_click: () => void;
  on_my_work_click: () => void;
  token: any;
}
const PageHeader: React.FC<PageHeaderProps> = ({
  admin_name,
  admin_id,
  on_add_click,
  on_add_multi_click,
  on_bulk_all_click,
  on_my_work_click,
  token,
}) => {
  const { t } = useTranslation();
  const { Text } = Typography;
  // Custom greeting logic
  const getGreeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) t("timesheet_entry_page.good_morning", "สวัสดีตอนเช้า");
    if (hour < 17)
      return t("timesheet_entry_page.good_afternoon", "สวัสดีตอนบ่าย");
    return t("timesheet_entry_page.good_evening", "สวัสดีตอนเย็น");
  };

  const greeting = getGreeting();
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
      "noopener,noreferrer",
    );
  };
  return (
    <Card
      style={{
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
      styles={{ body: { padding: "32px 40px" } }}
    >
      {/* Decorative Orbs */}
      <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full filter blur-2xl" />
      <div className="absolute -bottom-[60px] -left-5 w-[180px] h-[180px] rounded-full filter blur-2xl" />

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
                {greeting}, คุณ{admin_name}
              </Typography.Title>
            </Space>
            <Typography.Text type="secondary" style={{ fontSize: 16 }}>
              {t(
                "timesheet_entry_page.manage_your_work_time_here",
                "จัดการเวลาทำงานของคุณได้ที่นี่",
              )}{" "}
              •{" "}
              <span style={{ color: token.colorSuccess }}>
                {t(
                  "timesheet_entry_page.ready_to_work",
                  "พร้อมลุยงานวันนี้หรือยัง?",
                )}{" "}
                <RocketOutlined />
              </span>
            </Typography.Text>
            {admin_id && (
              <div
                style={{
                  marginTop: 8,
                  padding: "4px 12px",
                  borderRadius: 8,
                  width: "fit-content",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: `1px dashed ${token.colorBorder}`,
                }}
              >
                <SafetyCertificateFilled
                  style={{ color: token.colorSuccess, fontSize: 14 }}
                />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  เชื่อมต่อโดยใช้ <strong>admin_id: {admin_id}</strong>
                </Typography.Text>
                <Divider type="vertical" />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  ข้อมูลหน้านี้ถูกเชื่อมต่อโดยการใช้ข้อมูลจาก admin_id จาก{" "}
                  <strong>Profile ของคุณ</strong>
                </Typography.Text>
              </div>
            )}
          </Flex>
        </Col>
        <Col>
          <Space size="middle">
            {/* My Work Button with "New" Badge */}
            <Badge
              count="ใหม่"
              size="small"
              color={token.colorInfo}
              offset={[-8, 8]}
              style={{ fontWeight: 600, fontSize: 10, padding: "0 6px" }}
            >
              <Tooltip title="งานของฉัน (My Work)">
                <Button
                  size="large"
                  shape="circle"
                  icon={<UserOutlined />}
                  onClick={on_my_work_click}
                  className="hover:scale-105 transition-transform"
                  style={{
                    height: 48,
                    width: 48,
                    borderRadius: 24,
                    border: `1px solid ${token.colorBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </Tooltip>
            </Badge>

            {/* Primary Action Button */}
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={on_add_click}
              style={{
                height: 48,
                paddingLeft: 24,
                paddingRight: 12,
                borderRadius: 24,
                fontSize: 16,
                fontWeight: 600,
                boxShadow: `0 4px 14px ${token.colorPrimary}60`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span className="mr-2">
                {t("timesheet_entry_page.log_time", "ลงเวลาทำงาน")}
              </span>
            </Button>

            {/* Secondary Actions Dropdown */}
            <Dropdown
              trigger={["click"]}
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: "bulk",
                    label: (
                      <Space>
                        <span>
                          {t(
                            "timesheet_entry_page.bulk_entry",
                            "ลงแบบทุกคน (Bulk)",
                          )}
                        </span>
                        <Badge
                          count="ใหม่"
                          color={token.colorError}
                          size="small"
                        />
                      </Space>
                    ),
                    icon: <TeamOutlined />,
                    onClick: on_bulk_all_click,
                  },
                  {
                    key: "multi",
                    label: (
                      <Space>
                        <span>
                          {t(
                            "timesheet_entry_page.multi_entry",
                            "ลงเวลาหลายรายการ",
                          )}
                        </span>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          {t("timesheet_entry_page.coming_soon", "(เร็วๆนี้)")}
                        </Text>
                      </Space>
                    ),
                    icon: <AppstoreAddOutlined />,
                    onClick: on_add_multi_click,
                    disabled: true,
                  },
                  { type: "divider" },
                  {
                    key: "guide",
                    label: "คู่มือการใช้งาน",
                    icon: <BookOutlined />,
                    onClick: handleOpenGuide,
                  },
                ],
              }}
            >
              <Button
                size="large"
                shape="circle"
                icon={<MoreOutlined />}
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 24,
                  border: `1px solid ${token.colorBorder}`,
                }}
              />
            </Dropdown>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

// --- Monthly Rank Board ---
const API_RANK_ENDPOINT = "/api/v1/timesheet/entry/check/summary-month";
const API_FIND_RANK_ENDPOINT = "/api/v1/timesheet/find-ranking";
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

const useMonthlyRankData = (adminId?: number) => {
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
        // ✅ ใช้ endpoint ใหม่ที่รับ user_id เพื่อลดขนาด response (Optimization)
        const endpoint = adminId ? API_FIND_RANK_ENDPOINT : API_RANK_ENDPOINT;
        const payload: any = {
          month: selectedMonth.format("M"),
          year: selectedMonth.format("YYYY"),
        };

        if (adminId) {
          payload.user_id = adminId;
        }

        const response = await axios.post<ApiResponse>(endpoint, payload, {
          headers: { "Content-Type": "application/json" },
        });

        if (adminId) {
          // find-ranking API จะตอบกลับมาเป็น { record, metadata }
          const record = (response.data?.data as any)?.record;
          setRecords(record ? [record] : []);
        } else {
          // summary-month API จะตอบกลับมาเป็น { records, metadata }
          setRecords(response.data?.data?.records ?? []);
        }

        setMetadata(response.data?.data?.metadata ?? null);

        if (showToast)
          toast.success("อัปเดตข้อมูลล่าสุดแล้ว", { id: "monthly-rank-toast" });
      } catch (error: any) {
        setRecords([]);
        if (showToast)
          toast.error(
            error?.response?.data?.message_th ||
              "เกิดข้อผิดพลาดในการโหลดข้อมูล",
            { id: "monthly-rank-toast" },
          );
      } finally {
        setLoading(false);
      }
    },
    [selectedMonth, adminId],
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
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const {
      records,
      metadata,
      loading,
      refetch,
      selectedMonth,
      setSelectedMonth,
    } = useMonthlyRankData(currentAdminId);
    const [viewMode, setViewMode] = useState<MonthlyRankVariant>(variant);

    useImperativeHandle(ref, () => ({ refetch }));
    const handleVariantChange = (val: MonthlyRankVariant) => {
      setViewMode(val);
      onVariantChange?.(val);
    };

    const visibleRecords = useMemo(() => {
      if (currentAdminId) {
        const selfRecord = records.find(
          (record) => record.admin_id === currentAdminId,
        );
        return selfRecord ? [selfRecord] : [];
      }
      return records.slice(0, MAX_RANK_ROWS);
    }, [currentAdminId, records]);

    const isCompact = viewMode === "compact";
    const monthLabel =
      metadata?.range?.label_th ?? selectedMonth.format("MMMM BBBB");
    const generatedAt = metadata?.generated_at
      ? dayjs(metadata.generated_at).format("DD/MM/BBBB HH:mm:ss")
      : null;

    return (
      <Card
        hoverable
        style={{
          height: "100%",
          borderRadius: 24,
          border: `1px solid ${token.colorBorderSecondary}`,
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
        <div className="absolute -top-10 -right-10 w-[150px] h-[150px] rounded-full pointer-events-none filter blur-[40px]" />
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
                <div className="p-2 rounded-xl">
                  <TrophyFilled />
                </div>
                <span style={{ color: token.colorTextHeading }}>
                  {currentAdminId
                    ? t("timesheet_entry_page.your_rank", "อันดับของคุณ")
                    : t(
                        "timesheet_entry_page.employee_of_the_month",
                        "พนักงานดีเด่น",
                      )}
                </span>
              </Typography.Title>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 12, marginTop: 4, display: "block" }}
              >
                <FireOutlined style={{ color: token.colorError }} />{" "}
                {t(
                  "timesheet_entry_page.who_is_most_diligent",
                  "ใครขยันที่สุดในเดือนนี้?",
                )}
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
                    ),
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
            {t("timesheet_entry_page.update_data", "อัปเดตข้อมูล")}
          </Button>
        </div>
      </Card>
    );
  },
);
MonthlyRankBoard.displayName = "MonthlyRankBoard";

// --- Stats Grid ---
interface StatsGridProps {
  admin_id: number | undefined;
  rank_board_ref: React.RefObject<MonthlyRankBoardRef>;
  monthly_summary: any[];
  top_project_usage: TopUsage | null;
  top_feature_usage: TopUsage | null;
  loading: boolean;
  monthly_summary_loading?: boolean;
  monthly_stats?: any;
  selected_date?: dayjs.Dayjs;
  on_date_change?: (date: dayjs.Dayjs) => void;
}
const StatsGrid: React.FC<StatsGridProps> = ({
  admin_id,
  rank_board_ref,
  monthly_summary,
  top_project_usage,
  top_feature_usage,
  loading,
  monthly_summary_loading = false,
  monthly_stats = null,
  selected_date,
  on_date_change,
}) => {
  const { t } = useTranslation();
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
          ref={rank_board_ref}
          currentAdminId={admin_id}
          variant="compact"
          onVariantChange={setVariant}
        />
      </Col>

      {/* Stats Right Column */}
      <Col xs={24} lg={15} xl={17}>
        <Flex vertical gap={24} style={{ height: "100%" }}>
          {/* Weekly Chart */}
          <div className="flex-1">
            <Badge.Ribbon
              text="ปรับปรุงใหม่"
              color={token.colorInfo}
              style={{
                padding: "0 12px",
                height: 24,
                lineHeight: "24px",
                top: -10,
                right: -10,
              }}
            >
              <Card
                style={{
                  height: "100%",
                  borderRadius: 24,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  overflow: "hidden",
                }}
                styles={{ body: { padding: 0 } }}
              >
                <WeeklySummary
                  monthly_summary={monthly_summary}
                  targetHours={DAILY_TARGET_HOURS}
                  loading={monthly_summary_loading}
                  stats={monthly_stats}
                  selected_date={selected_date}
                  on_date_change={on_date_change}
                />
              </Card>
            </Badge.Ribbon>
          </div>

          {/* Small Stat Cards Row */}
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <TimesheetStatCard
                title={
                  <Space>
                    {t(
                      "timesheet_entry_page.popular_projects",
                      "โครงการยอดนิยม",
                    )}{" "}
                    <RocketOutlined />
                  </Space>
                }
                value={top_project_usage ? top_project_usage.hours : 0}
                color={token.colorPrimary}
                loading={loading}
                description={
                  top_project_usage
                    ? top_project_usage.name
                    : t("timesheet_entry_page.no_data", "ยังไม่มีข้อมูล")
                }
              />
            </Col>
            <Col xs={24} sm={12}>
              <TimesheetStatCard
                title={
                  <Space>
                    {t("timesheet_entry_page.top_features", "ฟีเจอร์มาแรง")}{" "}
                    <FireOutlined />
                  </Space>
                }
                value={top_feature_usage ? top_feature_usage.hours : 0}
                color={token.colorError}
                loading={loading}
                description={
                  top_feature_usage
                    ? top_feature_usage.name
                    : t("timesheet_entry_page.no_data", "ยังไม่มีข้อมูล")
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
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const ALL_TIMESHEET_COLUMNS = useMemo(
    () => [
      { key: "date", label: t("timesheet_entry_page.table_date", "วันที่") },
      {
        key: "project_name",
        label: t("timesheet_entry_page.project_and_task", "โครงการ / งาน"),
      },
      { key: "status", label: t("timesheet_entry_page.table_status", "สถานะ") },
      {
        key: "description",
        label: t("timesheet_entry_page.table_description", "รายละเอียด"),
      },
      { key: "hours", label: t("timesheet_entry_page.table_hours", "เวลา") },
      {
        key: "actions",
        label: t("timesheet_entry_page.table_actions", "จัดการ"),
      },
    ],
    [t],
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("timesheet-visible-columns");
      return saved
        ? JSON.parse(saved)
        : ["date", "project_name", "status", "description", "hours", "actions"];
    }
    return [
      "date",
      "project_name",
      "status",
      "description",
      "hours",
      "actions",
    ];
  });

  useEffect(() => {
    localStorage.setItem(
      "timesheet-visible-columns",
      JSON.stringify(visibleColumns),
    );
  }, [visibleColumns]);

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  const getColumnSearchProps = useCallback(
    (
      dataIndex: SearchableColumnKey,
      title: string,
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
            placeholder={
              t("timesheet_entry_page.search_placeholder", "ค้นหา") +
              ` ${title}`
            }
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
    [token.colorPrimary],
  );

  const columns = useMemo<any>(
    () => [
      {
        title: (
          <Space>
            <CalendarOutlined style={{ color: token.colorPrimary }} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: token.colorText }}
            >
              {t("timesheet_entry_page.table_date", "วันที่")}
            </span>
          </Space>
        ),
        dataIndex: "date",
        width: 70,
        align: "center",
        responsive: ["md"],
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (value: string) => {
          // สีดำพื้นขาว ตัวอักษรขาว
          return (
            <div
              className="flex flex-col items-center justify-center w-[64px] h-[64px] rounded-2xl mx-auto border border-solid transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{
                borderColor: token.colorBorder,
              }}
            >
              <Typography.Text
                strong
                className="text-2xl leading-none"
                style={{ color: token.colorText }}
              >
                {dayjs(value).format("DD")}
              </Typography.Text>
              <Typography.Text
                className="text-[10px] uppercase font-bold tracking-tight mt-1"
                style={{ color: token.colorTextSecondary }}
              >
                {dayjs(value).format("MMM BBBB")}
              </Typography.Text>
            </div>
          );
        },
      },
      {
        title: (
          <Space>
            <ProjectOutlined style={{ color: token.colorPrimary }} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: token.colorText }}
            >
              {t("timesheet_entry_page.project_and_task", "โครงการ / งาน")}
            </span>
          </Space>
        ),
        dataIndex: "project_name",
        width: 320,
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          a.project_name.localeCompare(b.project_name),
        sortDirections: ["descend", "ascend"],
        ...getColumnSearchProps(
          "project_name",
          t("timesheet_entry_page.table_project", "โครงการ"),
        ),
        render: (value: string, record: TimesheetEntry) => {
          // ลบ Avatar ไอค่อนออก
          return (
            <div className="flex flex-col justify-center min-w-0 overflow-hidden py-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Typography.Text
                  strong
                  className="text-[15px] truncate max-w-[180px]"
                >
                  {value}
                </Typography.Text>
                {record.category_type && (
                  <Tag
                    bordered={false}
                    color={
                      record.category_type === "EXTERNAL"
                        ? "success"
                        : "processing"
                    }
                    className="text-[10px] m-0 px-1.5 leading-tight rounded-md"
                  >
                    {record.category_type}
                  </Tag>
                )}
              </div>
              <Typography.Text
                type="secondary"
                className="text-[12px] flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full" />
                <span className="truncate">
                  {record.feature_name || "General Task"}
                </span>
              </Typography.Text>
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
              style={{ color: token.colorText }}
            >
              {t("timesheet_entry_page.table_status", "สถานะ")}
            </span>
          </Space>
        ),
        dataIndex: "status",
        width: 140,
        align: "center",
        render: (value: string) => {
          const config = getStatusConfig(value);
          const label =
            STATUS_OPTIONS.find((s) => s.value === value)?.label_th ||
            config.text;

          // Dynamic colors and icons based on status
          const statusMap: any = {
            IN_PROGRESS: {
              icon: <SyncOutlined spin />,
              color: token.colorPrimary,
              bg: `${token.colorPrimary}15`,
            },
            COMPLETED: {
              icon: <CheckCircleFilled />,
              color: token.colorSuccess,
              bg: `${token.colorSuccess}15`,
            },
            APPROVED: {
              icon: <SafetyCertificateFilled />,
              color: token.colorSuccess,
              bg: `${token.colorSuccess}15`,
            },
            REJECTED: {
              icon: <CloseCircleFilled />,
              color: token.colorError,
              bg: `${token.colorError}15`,
            },
            DRAFT: {
              icon: <ClockCircleOutlined />,
              color: token.colorTextDescription,
              bg: `${token.colorFillSecondary}`,
            },
          };

          const current = statusMap[value] || {
            icon: <TagOutlined />,
            color: token.colorWarning,
            bg: `${token.colorWarning}15`,
          };

          return (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold border border-solid"
              style={{
                color: current.color,

                borderColor: `${current.color}30`,
              }}
            >
              {current.icon}
              <span>{label}</span>
            </div>
          );
        },
      },
      {
        title: (
          <Space>
            <FileTextOutlined style={{ color: token.colorInfo }} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: token.colorText }}
            >
              {t("timesheet_entry_page.table_description", "รายละเอียด")}
            </span>
          </Space>
        ),
        dataIndex: "description",
        width: 280,
        render: (value: string) => (
          <Tooltip title={value} placement="topLeft" mouseEnterDelay={0.5}>
            <div className="group relative">
              <Typography.Paragraph
                ellipsis={{ rows: 2 }}
                className="text-[13px] m-0 pr-4 leading-relaxed italic"
                style={{ color: token.colorTextSecondary }}
              >
                {value || (
                  <span className="opacity-30">
                    {t(
                      "timesheet_entry_page.no_description",
                      "ไม่มีรายละเอียดระบุไว้",
                    )}
                  </span>
                )}
              </Typography.Paragraph>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
                <InfoCircleOutlined style={{ fontSize: 12 }} />
              </div>
            </div>
          </Tooltip>
        ),
      },
      {
        title: (
          <Space>
            <ClockCircleOutlined style={{ color: token.colorWarning }} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: token.colorText }}
            >
              {t("timesheet_entry_page.table_hours", "เวลา")}
            </span>
          </Space>
        ),
        dataIndex: "hours",
        width: 130,
        align: "right",
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          Number(a.hours || 0) - Number(b.hours || 0),
        render: (value: number) => {
          const hours = Number(value) || 0;
          const isSuccess = hours >= 8;
          return (
            <div className="inline-flex items-end gap-1">
              <span
                className="text-xl font-black leading-none"
                style={{
                  color: isSuccess
                    ? token.colorSuccess
                    : token.colorTextHeading,
                }}
              >
                {hours.toFixed(1)}
              </span>
              <span className="text-[10px] font-bold mb-0.5 opacity-50 uppercase">
                {t("timesheet_entry_page.hrs", "ชม.")}
              </span>
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
          <Space size="middle">
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                size="small"
                shape="circle"
                icon={<EditOutlined style={{ color: token.colorWarning }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(r);
                }}
                className=""
              />
            </Tooltip>
            <Tooltip title="คัดลอก">
              <Button
                type="text"
                size="small"
                shape="circle"
                icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(r);
                }}
                className=""
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [onEdit, onCopy, getColumnSearchProps, token],
  );

  const filteredColumns = useMemo(
    () =>
      columns.filter(
        (col: any) =>
          visibleColumns.includes(col.dataIndex as string) ||
          visibleColumns.includes(col.key as string),
      ),
    [columns, visibleColumns],
  );

  return (
    <Card
      title={
        <div className="flex items-center gap-4 m-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center m"
            style={{
              boxShadow: `0 4px 12px ${token.colorPrimary}60`,
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <Typography.Title level={4}>
              {t("timesheet_entry_page.timesheet_log")}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t("timesheet_entry_page.manage_and_check_timesheet")}
            </Typography.Text>
          </div>
        </div>
      }
      extra={
        <Space size="middle">
          <Popover
            content={
              <div
                className="flex flex-col gap-3 min-w-[200px] p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-1 pb-2 border-0 border-b border-solid border-slate-100">
                  <Typography.Text strong style={{ fontSize: 14 }}>
                    ตั้งค่าการแสดงผลคอลัมน์
                  </Typography.Text>
                  <Tooltip title="รีเซ็ต">
                    <Button
                      type="text"
                      size="small"
                      icon={<ReloadOutlined style={{ fontSize: 12 }} />}
                      onClick={() =>
                        setVisibleColumns(
                          ALL_TIMESHEET_COLUMNS.map((c) => c.key),
                        )
                      }
                    />
                  </Tooltip>
                </div>
                <Checkbox.Group
                  value={visibleColumns}
                  onChange={(checkedValues) =>
                    setVisibleColumns(checkedValues as string[])
                  }
                  className="w-full"
                >
                  <Flex vertical gap={10}>
                    {ALL_TIMESHEET_COLUMNS.map((col) => (
                      <Checkbox
                        key={col.key}
                        value={col.key}
                        className="p-1 rounded-md transition-colors w-full"
                      >
                        <span style={{ fontSize: 13 }}>{col.label}</span>
                      </Checkbox>
                    ))}
                  </Flex>
                </Checkbox.Group>
              </div>
            }
            trigger="click"
            placement="bottomRight"
            arrow={false}
          >
            <Tooltip title="ตั้งค่าแสดงคอลัมน์">
              <Button
                icon={<SettingOutlined />}
                size="large"
                style={{
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              />
            </Tooltip>
          </Popover>
          <TimesheetActions
            selectedCount={selectedRowKeys?.length}
            loading={actionLoading}
            refreshLoading={loading}
            onRefresh={onRefresh}
            onAdd={onAdd}
            onDelete={onDelete}
          />
        </Space>
      }
      className="glass-effect"
      style={{
        margin: "24px 0",
        borderRadius: 24,
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
      styles={{ body: { padding: 0 } }}
    >
      <Table<TimesheetEntry>
        rowKey={(r) => String(r.id)}
        columns={filteredColumns}
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
                  {t("timesheet_entry_page.prev", "ก่อนหน้า")}
                </Button>
              );
            if (type === "next")
              return (
                <Button type="text" size="small">
                  {t("timesheet_entry_page.next", "ถัดไป")}
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
  ticket_number?: any;
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
  record?: TimesheetEntry | null;
  afterClose?: () => void;
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
  record,
  afterClose,
}) => {
  const { t } = useTranslation("timesheet");
  const { token } = theme.useToken();
  const [searchMode, setSearchMode] = useState<"hierarchy" | "direct">(
    "hierarchy",
  );
  const [subProjectOptionsSearch, setSubProjectOptionsSearch] = useState<any[]>(
    [],
  );
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<any>(null);

  const handleSearchSubProject = (value: string) => {
    if (searchRef.current) clearTimeout(searchRef.current);
    if (!value) {
      setSubProjectOptionsSearch([]);
      return;
    }
    setSearching(true);
    searchRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(
          `/api/v1/timesheet/project/sub-project/search?q=${encodeURIComponent(
            value,
          )}`,
        );
        if (res.data?.data) {
          setSubProjectOptionsSearch(
            res.data.data.map((item: any) => ({
              label: item.display_label,
              value: item.id,
              item: item,
            })),
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  useEffect(() => {
    if (open) {
      if (formMode === "create") {
        form.resetFields();
        form.setFieldsValue({
          status: "IN_PROGRESS",
          date: dayjs(),
          work_hour: 8,
        });
      } else if ((formMode === "edit" || formMode === "copy") && record) {
        form.setFieldsValue({
          project_id: Number(record.project_id),
          sub_project_id: record.feature_id
            ? Number(record.feature_id)
            : undefined,
          description: record.description ?? "",
          work_hour: Number(record.hours) || undefined,
          status: record.status,
          date: formMode === "copy" ? dayjs() : dayjs(record.date),
        });
      }
    }
  }, [open, formMode, form, record]);

  useEffect(() => {
    if (!open) return;
    if (searchMode === "hierarchy") {
      form.setFieldsValue({ sub_project_search: undefined });
    } else {
      form.setFieldsValue({ project_id: undefined, sub_project_id: undefined });
    }
  }, [searchMode, form, open]);

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
    [projects, token],
  );
  const subProjectOptions = useMemo(
    () =>
      subProject.map((s) => ({
        label: (
          <Space>
            <ApartmentOutlined style={{ color: token.colorWarning }} />
            {s.ticket_number && (
              <Tag color="blue" bordered={false}>
                {s.ticket_number}
              </Tag>
            )}
            {s.name}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              (ID: {s.id})
            </Typography.Text>
          </Space>
        ),
        value: Number(s.id),
        labelString: s.name,
      })),
    [subProject, token],
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
    [i18n.language],
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
            <ThunderboltOutlined /> {t("logWorkTime", "ลงเวลาทำงาน")}
          </Typography.Title>
        </Space>
      }
      onCancel={onCancel}
      width={900}
      centered
      footer={null}
      forceRender
      afterClose={afterClose}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Card
          style={{
            marginBottom: 24,
            borderRadius: token.borderRadiusLG,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Typography.Text
              strong
              style={{
                color: token.colorPrimary,
              }}
            >
              <ProjectOutlined className="mr-2" />{" "}
              {t("responsibleProject", "โครงการที่รับผิดชอบ")}
            </Typography.Text>
            <Radio.Group
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="hierarchy">
                {t("selectByProject", "เลือกตามโครงการ")}
              </Radio.Button>
              <Radio.Button value="direct">
                {t("searchSubTask", "ค้นหางานย่อย")}
              </Radio.Button>
            </Radio.Group>
          </div>

          <Row
            gutter={16}
            style={{ display: searchMode === "hierarchy" ? "flex" : "none" }}
          >
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <span>{t("mainProject", "โครงการหลัก")}</span>
                    <Tooltip
                      title={t(
                        "searchProjectTip",
                        "ค้นหาได้ทั้ง ชื่อโครงการ และ Project ID",
                      )}
                    >
                      <InfoCircleOutlined
                        style={{ color: token.colorTextSecondary }}
                      />
                    </Tooltip>
                  </Space>
                }
                name="project_id"
                rules={[{ required: searchMode === "hierarchy" }]}
              >
                <Select
                  placeholder="เลือกโครงการ..."
                  options={projectOptions}
                  onChange={(v) => {
                    form.setFieldsValue({ sub_project_id: undefined });
                    if (v) fetchSubProjects(String(v));
                  }}
                  showSearch
                  filterOption={(input, option) => {
                    const labelStr = (option?.labelString ?? "").toLowerCase();
                    const inputStr = input.toLowerCase();
                    const valueStr = String(option?.value).toLowerCase();
                    return (
                      labelStr.includes(inputStr) || valueStr.includes(inputStr)
                    );
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <span>{t("subTaskFeature", "งานย่อย / ฟีเจอร์")}</span>
                    <Tooltip
                      title={t(
                        "searchSubTaskTip",
                        "ค้นหาได้ทั้ง ชื่องานย่อย และ Feature ID",
                      )}
                    >
                      <InfoCircleOutlined
                        style={{ color: token.colorTextSecondary }}
                      />
                    </Tooltip>
                  </Space>
                }
                name="sub_project_id"
                rules={[{ required: searchMode === "hierarchy" }]}
                dependencies={["project_id"]}
              >
                <Select
                  placeholder="เลือกงานย่อย..."
                  options={subProjectOptions}
                  disabled={!form.getFieldValue("project_id")}
                  showSearch
                  filterOption={(input, option) => {
                    const labelStr = (option?.labelString ?? "").toLowerCase();
                    const inputStr = input.toLowerCase();
                    const valueStr = String(option?.value).toLowerCase();
                    return (
                      labelStr.includes(inputStr) || valueStr.includes(inputStr)
                    );
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: searchMode === "direct" ? "block" : "none" }}>
            <Form.Item
              label={t("searchSubTask", "ค้นหางานย่อย")}
              name="sub_project_search"
              rules={[
                {
                  required: searchMode === "direct",
                  message: t(
                    "pleaseSelectSubTask",
                    "กรุณาค้นหาและเลือกงานย่อย",
                  ),
                },
                {
                  validator: async (_, value) => {
                    if (searchMode === "direct") {
                      const projectId = form.getFieldValue("project_id");
                      const subProjectId = form.getFieldValue("sub_project_id");
                      if (!projectId || !subProjectId) {
                        return Promise.reject(
                          new Error(
                            t("selectFromList", "กรุณาเลือกงานย่อยจากรายการ"),
                          ),
                        );
                      }
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Select
                showSearch
                placeholder={t(
                  "searchPlaceholderDirect",
                  "พิมพ์ชื่องานย่อย, โครงการหลัก หรือ ID...",
                )}
                options={subProjectOptionsSearch}
                onSearch={handleSearchSubProject}
                loading={searching}
                filterOption={false}
                notFoundContent={
                  searching
                    ? t("searching", "กำลังค้นหา...")
                    : t("notFound", "ไม่พบข้อมูล")
                }
                onChange={(value, option: any) => {
                  if (option?.item) {
                    form.setFieldsValue({
                      project_id: option.item.main_project_id,
                      sub_project_id: option.item.id,
                    });
                    fetchSubProjects(String(option.item.main_project_id));
                  }
                }}
                suffixIcon={<SearchOutlined />}
              />
            </Form.Item>
          </div>
        </Card>
        <div
          style={{
            padding: 24,
            borderRadius: token.borderRadiusLG,
          }}
        >
          <Row gutter={20}>
            <Col xs={12} sm={8}>
              <Form.Item
                label={t("date", "วันที่")}
                name="date"
                rules={[{ required: true }]}
              >
                <DatePicker format="DD/MM/BBBB" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item
                label={t("durationHours", "ระยะเวลา (ชม.)")}
                name="work_hour"
                rules={[
                  { required: true },
                  { type: "number", min: 0.1, max: 24 },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || value <= 8) {
                        return Promise.resolve();
                      }
                      return Promise.resolve(); // Warning is handled by extra content
                    },
                  }),
                ]}
                extra={
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) =>
                      prev.work_hour !== curr.work_hour
                    }
                  >
                    {({ getFieldValue }) => {
                      const hours = getFieldValue("work_hour");
                      return hours > 8 ? (
                        <Typography.Text
                          type="warning"
                          style={{ fontSize: 12 }}
                        >
                          <ExclamationCircleOutlined />{" "}
                          {t(
                            "over8HoursWarning",
                            "คุณกำลังกรอกเวลาเกิน 8 ชั่วโมง",
                          )}
                        </Typography.Text>
                      ) : null;
                    }}
                  </Form.Item>
                }
              >
                <InputNumber style={{ width: "100%" }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label={t("status", "สถานะ")} name="status">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Form.Item
            label={t("workDescription", "รายละเอียดการทำงาน")}
            name="description"
          >
            <Input.TextArea
              rows={4}
              showCount
              maxLength={500}
              placeholder={t(
                "workDescriptionPlaceholder",
                "ระบุรายละเอียดงานที่ทำ...",
              )}
            />
          </Form.Item>
        </div>
        <Flex justify="end" gap={8} style={{ marginTop: 24 }}>
          <Button onClick={onCancel}>{t("cancel", "ยกเลิก")}</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={disabled}
            icon={<SaveOutlined />}
          >
            {t("saveData", "บันทึกข้อมูล")}
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
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
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
    [projects],
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
      forceRender
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
    } else {
      // Reset forms when modal opens to ensure clean state
      form.resetFields();
      passwordForm.resetFields();
    }
  }, [open, form, passwordForm]);

  // Handle state after modal is completely closed
  const handleAfterClose = () => {
    // Final cleanup after close animation
  };

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
    [projects, token],
  );

  const subProjectOptions = useMemo(
    () =>
      subProject.map((s) => ({
        label: (
          <Space>
            <ApartmentOutlined style={{ color: token.colorWarning }} />
            {s.ticket_number && (
              <Tag color="blue" bordered={false}>
                {s.ticket_number}
              </Tag>
            )}
            {s.name}
          </Space>
        ),
        value: Number(s.id),
        labelString: s.name,
      })),
    [subProject, token],
  );

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((s) => ({
        label: <Tag color={getStatusConfig(s.value).color}>{s.label_th}</Tag>,
        value: s.value,
      })),
    [],
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
              : item,
          ),
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
                : item,
            ),
          );
        } catch (error: any) {
          // Update status to error
          const errorMsg =
            error?.response?.data?.message_th ||
            error?.message ||
            "เกิดข้อผิดพลาด";
          setProgressList((prev) =>
            prev.map((item) =>
              item.admin_id === user.admin_id
                ? {
                    ...item,
                    status: "error",
                    message: errorMsg,
                  }
                : item,
            ),
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
        `ส่งข้อมูลเสร็จสิ้น! สำเร็จ ${completedCount} จาก ${users.length} คน`,
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

  return (
    <Modal
      open={open}
      title={
        !isUnlocked ? (
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
        ) : (
          <Space>
            <div
              className="p-2 rounded-xl"
              style={{
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
        )
      }
      onCancel={onCancel}
      width={isUnlocked ? 900 : 500}
      centered
      footer={null}
      maskClosable={!isProcessing}
      closable={!isProcessing}
      forceRender
      afterClose={handleAfterClose}
    >
      {/* 1. Unlock View */}
      <div style={{ display: !isUnlocked ? "block" : "none" }}>
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
      </div>

      {/* 2. Main View (Unlocked) */}
      <div style={{ display: isUnlocked ? "block" : "none" }}>
        {/* Processing Progress View */}
        {isProcessing && (
          <div className="mb-6">
            <Card className="rounded-2xl">
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

        {/* Form View (hidden when processing to keep connected) */}
        <div style={{ display: !isProcessing ? "block" : "none" }}>
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
              style={{
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
                    <DatePicker format="DD/MM/BBBB" style={{ width: "100%" }} />
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
                    border: "none",
                    fontWeight: 600,
                  }}
                >
                  ลงเวลาให้ทุกคน ({users.length} คน)
                </Button>
              </Space>
            </Flex>
          </Form>
        </div>
      </div>

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
  const authState = useAppSelector((state) => state.callAdminLogin);
  const timesheetState = useAppSelector((state) => state.timesheet);

  // State
  const [multiEntryModalOpen, setMultiEntryModalOpen] = useState(false);
  const [bulkAllUsersModalOpen, setBulkAllUsersModalOpen] = useState(false);
  const [myWorkModalOpen, setMyWorkModalOpen] = useState(false);
  const [subProjectsCache, setSubProjectsCache] = useState<
    Record<string, any[]>
  >({});

  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const admin_id = useMemo(
    () => Number(authState?.response?.data?.user_data?.admin_id) || undefined,
    [authState?.response?.data?.user_data?.admin_id],
  );
  const admin_name = authState?.response?.data?.user_data?.firstname || "User";

  const {
    entries,
    loading: table_loading,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    refetch: refetch_entries,
  } = useTimesheetEntries(admin_id);

  const [selected_summary_date, set_selected_summary_date] =
    useState<dayjs.Dayjs>(dayjs());

  const {
    monthlySummary: monthly_summary,
    stats: monthly_stats,
    loading: monthly_summary_loading,
    refetch: refetch_monthly_summary,
  } = useMonthlySummaryAPI(
    admin_id,
    selected_summary_date.month() + 1,
    selected_summary_date.year(),
  );

  const {
    topProjectUsage: top_project_usage,
    topFeatureUsage: top_feature_usage,
  } = useTopUsage(entries);
  const { actionLoading, submitTimesheet, deleteTimesheet } =
    useTimesheetActions(
      admin_id,
      isMountedRef,
      () => {
        refetch_entries();
        refetch_monthly_summary();
      },
      () => rankBoardRef.current?.refetch(),
      setStatusModal,
    );
  const { fetchProjects, fetchSubProjects } = useProjectData(
    isMountedRef,
    dispatch,
    setProjects,
    setSubProjects,
    setLoading,
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
  }, [dispatch]);

  const handleAfterClose = useCallback(() => {
    // No-op: form reset is handled by useEffect in CreateModalForm
  }, []);

  const openCreateForm = useCallback(() => {
    dispatch(setFormMode("create"));
    dispatch(setActiveRecord(null));
    dispatch(setSubProjects([]));
    // form.setFieldsValue removed - handled by CreateModalForm useEffect
    dispatch(setModalType("form"));
  }, [dispatch]);

  const openEditForm = useCallback(
    async (record: TimesheetEntry) => {
      dispatch(setFormMode("edit"));
      dispatch(setActiveRecord(record));
      await fetchSubProjects(Number(record.project_id));
      if (!isMountedRef.current) return;

      dispatch(setModalType("form"));
    },
    [dispatch, fetchSubProjects],
  );

  const openCopyForm = useCallback(
    async (record: TimesheetEntry) => {
      dispatch(setFormMode("copy"));
      dispatch(setActiveRecord(record));
      await fetchSubProjects(Number(record.project_id));
      if (!isMountedRef.current) return;

      dispatch(setModalType("form"));
    },
    [dispatch, fetchSubProjects],
  );

  const openDetailModal = useCallback(
    (record: TimesheetEntry) => {
      dispatch(setActiveRecord(record));
      dispatch(setModalType("detail"));
    },
    [dispatch],
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
        timesheetState.activeRecord?.id,
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
    [pageSize, setCurrentPage, setPageSize],
  );

  // Multi Entry Logic
  const openMultiEntryForm = useCallback(
    () => setMultiEntryModalOpen(true),
    [],
  );
  const closeMultiEntryModal = useCallback(() => {
    setMultiEntryModalOpen(false);
    setSubProjectsCache({});
  }, []);

  // Bulk All Users Entry Logic
  const openBulkAllUsersModal = useCallback(
    () => setBulkAllUsersModalOpen(true),
    [],
  );
  const closeBulkAllUsersModal = useCallback(
    () => setBulkAllUsersModalOpen(false),
    [],
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
    [fetchSubProjects, subProjectsCache, timesheetState.subProjects],
  );

  const handleSubmitMultipleTimesheets = useCallback(
    async (entries: any[]) => {
      if (!admin_id) return;
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
            undefined,
            { showModal: false },
          ),
        );
        const results = await Promise.all(promises);
        const successCount = results.filter((r) => r).length;
        toast.dismiss();
        if (successCount === entries.length) {
          toast.success(`บันทึกสำเร็จทั้งหมด ${successCount} รายการ`);
          closeMultiEntryModal();
        } else {
          toast.warning(
            `บันทึกสำเร็จ ${successCount} จาก ${entries.length} รายการ`,
          );
        }
      } catch {
        toast.dismiss();
        toast.error("เกิดข้อผิดพลาดในการบันทึก");
      }
    },
    [admin_id, submitTimesheet, closeMultiEntryModal],
  );

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <PageHeader
              admin_name={admin_name}
              admin_id={admin_id}
              on_add_click={openCreateForm}
              on_add_multi_click={openMultiEntryForm}
              on_bulk_all_click={openBulkAllUsersModal}
              on_my_work_click={() => setMyWorkModalOpen(true)}
              token={token}
            />
            <StatsGrid
              admin_id={admin_id}
              rank_board_ref={rankBoardRef}
              monthly_summary={monthly_summary as any}
              top_project_usage={top_project_usage}
              top_feature_usage={top_feature_usage}
              loading={table_loading}
              monthly_summary_loading={monthly_summary_loading}
              monthly_stats={monthly_stats}
              selected_date={selected_summary_date}
              on_date_change={set_selected_summary_date}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <TimesheetTable
                entries={entries}
                loading={table_loading}
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
                onRefresh={refetch_entries}
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
            record={timesheetState.activeRecord}
            afterClose={handleAfterClose}
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
            refetchEntries={refetch_entries}
            rankBoardRefetch={() => rankBoardRef.current?.refetch()}
          />
          <MyWorkModal
            open={myWorkModalOpen}
            onCancel={() => setMyWorkModalOpen(false)}
            userId={admin_id}
          />

          <StatusModal
            open={statusModal.open}
            type={statusModal.type}
            title={statusModal.title}
            message={statusModal.message}
            onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
          />
        </motion.div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
