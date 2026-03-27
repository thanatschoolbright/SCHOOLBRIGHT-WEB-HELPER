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
  ReadOutlined,
  ReloadOutlined,
  RightOutlined,
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
  setSubProjects,
} from "@stores/reducers/timesheet/timesheet-reducer";
import { useAppSelector } from "@stores/store";

import {
  useMonthlySummaryAPI,
  useTimesheetEntries,
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
  const { Text, Title } = Typography;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MyWorkItem[]>([]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/v1/timesheet/my-work?user_id=${String(userId)}`,
      );
      setData(response.data?.data ?? []);
    } catch (_error) {
      toast.error("ไม่สามารถโหลดข้อมูลงานคืนได้");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) {
      void fetchData();
    }
  }, [open, fetchData]);

  const columns = [
    {
      title: t("timesheet_entry_page.table_project", "โครงการ"),
      dataIndex: ["project", "name"],
      key: "project",
      render: (text: string, record: MyWorkItem) => (
        <Flex vertical gap={0}>
          <Text strong>{text}</Text>
          {record.project.name_en && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.project.name_en}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      title: t("timesheet_entry_page.sub_task_feature", "งานย่อย / ฟีเจอร์"),
      dataIndex: ["feature", "name"],
      key: "feature",
      render: (text: string, record: MyWorkItem) =>
        text ? (
          <Flex vertical gap={0}>
            <Space size={4} wrap>
              {record.feature?.ticket_number && (
                <Tag color="processing" bordered={false} style={{ margin: 0 }}>
                  {record.feature.ticket_number}
                </Tag>
              )}
              <Text>{text}</Text>
            </Space>
            {record.feature?.name_en && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.feature.name_en}
              </Text>
            )}
          </Flex>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: t("timesheet_entry_page.position_role", "ตำแหน่ง / บทบาท"),
      dataIndex: "position",
      key: "position",
      render: (text: string) =>
        text || (
          <Text type="secondary">
            {t("timesheet_entry_page.not_specified", "ไม่ได้ระบุ")}
          </Text>
        ),
    },
    {
      title: t("timesheet_entry_page.table_status", "สถานะ"),
      key: "status",
      render: (_text: string, record: MyWorkItem) => (
        <Flex gap={4} wrap="wrap">
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
        </Flex>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title={
        <Space size={12}>
          <UserOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          <Flex vertical gap={0}>
            <Title level={4} style={{ margin: 0 }}>
              {t("timesheet_entry_page.my_work", "งานของฉัน")}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t(
                "timesheet_entry_page.my_work_description",
                "รายการโครงการและฟีเจอร์ที่คุณได้รับมอบหมาย",
              )}
            </Text>
          </Flex>
        </Space>
      }
      onCancel={onCancel}
      width={1000}
      footer={<Button onClick={onCancel}>ปิด</Button>}
    >
      <Table
        dataSource={data}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        locale={{
          emptyText: t(
            "timesheet_entry_page.no_assigned_work",
            "ไม่พบข้อมูลงานที่ได้รับมอบหมาย",
          ),
        }}
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
};

// --- Guide Modal ---
interface GuideModalProps {
  open: boolean;
  onCancel: () => void;
}

const GuideModal: React.FC<GuideModalProps> = ({ open, onCancel }) => {
  const { token } = theme.useToken();
  const { Text, Title } = Typography;

  const sections = [
    {
      title: "นโยบายการบันทึกต้นทุน (Capitalization Policy)",
      icon: <FileTextOutlined style={{ color: token.colorPrimary }} />,
      links: [
        {
          label: "SB-TS-DOC-001 - นโยบายการบันทึกต้นทุนการพัฒนาซอฟต์แวร์",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?usp=sharing",
          tag: "Core Policy",
        } as any,
      ],
    },
    {
      title: "แนวทางและการปฏิบัติ (Guidelines)",
      icon: <BookOutlined style={{ color: token.colorInfo }} />,
      links: [
        {
          label: "การลงเวลาและแนวทางปฏิบัติทั่วไป",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.7kqb7kp659j6",
        },
      ],
    },
    {
      title: "คำแนะนำแยกตามตำแหน่ง (Role-based Guide)",
      icon: <TeamOutlined style={{ color: token.colorSuccess }} />,
      links: [
        {
          label: "สำหรับตำแหน่ง SA / BA / PM",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.zebafthx8gwb",
        },
        {
          label: "สำหรับตำแหน่ง UX / UI",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.qxwspf2j73ob",
        },
        {
          label: "สำหรับตำแหน่ง Developer",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.nuub3l30rdiw",
        },
        {
          label: "สำหรับตำแหน่ง QA",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.3r566mmsriej",
        },
      ],
    },
    {
      title: "เอกสารเพิ่มเติม",
      icon: <SafetyCertificateFilled style={{ color: token.colorWarning }} />,
      links: [
        {
          label: "เอกสารการยินยอมทำระบบทามชีท",
          url: "https://docs.google.com/document/d/1OkUIocbdpi0_T41WhHQsQmsbVrGzJ-bvYmnOLar-utg/edit?tab=t.be5eobh0l5dp",
        },
      ],
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          key="close"
          onClick={onCancel}
          type="primary"
          size="large"
          style={{ borderRadius: 8 }}
        >
          เข้าใจแล้ว
        </Button>,
      ]}
      width={700}
      centered
      title={
        <Space size={12}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: token.colorPrimaryBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOutlined style={{ fontSize: 22, color: token.colorPrimary }} />
          </div>
          <Flex vertical gap={0}>
            <Title level={4} style={{ margin: 0 }}>
              คู่มือการลงเวลาทำงาน (Timesheet Guide)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              กรุณาศึกษาข้อมูลเพื่อให้การลงเวลาถูกต้องตามนโยบายบริษัท
            </Text>
          </Flex>
        </Space>
      }
    >
      <div style={{ marginTop: 24 }}>
        <Flex vertical gap={24}>
          {sections.map((section, idx) => (
            <div key={idx}>
              <Space style={{ marginBottom: 12 }}>
                {section.icon}
                <Text strong style={{ fontSize: 16 }}>
                  {section.title}
                </Text>
              </Space>
              <Flex vertical gap={10}>
                {section.links.map((link, lIdx) => (
                  <Card
                    key={lIdx}
                    size="small"
                    hoverable
                    styles={{ body: { padding: "12px 16px" } }}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      background: token.colorFillAlter,
                    }}
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    <Flex justify="space-between" align="center">
                      <Space size={12}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: token.colorBgContainer,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `1px solid ${token.colorBorderSecondary}`,
                          }}
                        >
                          <BookOutlined
                            style={{
                              fontSize: 14,
                              color: token.colorTextSecondary,
                            }}
                          />
                        </div>
                        <Text style={{ fontWeight: 500 }}>{link.label}</Text>
                      </Space>
                      <Space>
                        {link.tag && (
                          <Tag
                            color="blue"
                            bordered={false}
                            style={{ margin: 0 }}
                          >
                            {link.tag}
                          </Tag>
                        )}
                        <RightOutlined
                          style={{
                            color: token.colorTextQuaternary,
                            fontSize: 12,
                          }}
                        />
                      </Space>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            </div>
          ))}
        </Flex>
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
  on_guide_click: () => void;
  token: Record<string, any>;
}
const PageHeader: React.FC<PageHeaderProps> = ({
  admin_name,
  admin_id,
  on_add_click,
  on_add_multi_click,
  on_bulk_all_click,
  on_my_work_click,
  on_guide_click,
  token,
}) => {
  const { t } = useTranslation();
  const { Text, Title } = Typography;

  const greeting = useMemo(() => {
    const hour = dayjs().hour();
    if (hour < 12)
      return t("timesheet_entry_page.good_morning", "สวัสดีตอนเช้า");
    if (hour < 17)
      return t("timesheet_entry_page.good_afternoon", "สวัสดีตอนบ่าย");
    return t("timesheet_entry_page.good_evening", "สวัสดีตอนเย็น");
  }, [t]);

  const timeIcon = useMemo(() => {
    const hour = dayjs().hour();
    if (hour < 12) return <SunOutlined style={{ color: token.colorWarning }} />;
    if (hour < 18) return <CloudOutlined style={{ color: token.colorInfo }} />;
    return <MoonOutlined style={{ color: token.colorInfo }} />;
  }, [token]);

  return (
    <Card
      styles={{ body: { padding: token.paddingLG } }}
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: `0 4px 12px ${token.colorShadowQuaternary}`,
      }}
    >
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={token.paddingLG}
      >
        <Flex vertical gap={token.marginXS} style={{ flex: 1 }}>
          <Space align="center" size={token.marginSM}>
            <Flex align="center" justify="center" style={{ fontSize: 32 }}>
              {timeIcon}
            </Flex>
            <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
              {greeting}, คุณ{admin_name}
            </Title>
          </Space>

          <Space split={<Text type="secondary">-</Text>} wrap>
            <Text type="secondary" style={{ fontSize: token.fontSizeLG }}>
              {t(
                "timesheet_entry_page.manage_your_work_time_here",
                "จัดการเวลาทำงานของคุณได้ที่นี่",
              )}
            </Text>
            <Text type="success" style={{ fontSize: token.fontSizeLG }}>
              {t(
                "timesheet_entry_page.ready_to_work",
                "พร้อมลุยงานวันนี้หรือยัง?",
              )}{" "}
              <RocketOutlined />
            </Text>
          </Space>

          {admin_id && (
            <Flex
              align="center"
              gap={token.marginSM}
              style={{
                width: "fit-content",
                background: token.colorFillAlter,
                padding: `${token.paddingXXS}px ${token.paddingSM}px`,
                borderRadius: token.borderRadiusSM,
                border: `1px dashed ${token.colorBorder}`,
                marginTop: token.marginXS,
              }}
            >
              <Space split={<Divider type="vertical" />}>
                <Space size={token.paddingXXS}>
                  <SafetyCertificateFilled
                    style={{ color: token.colorSuccess, fontSize: 14 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    admin_id: <Text strong>{admin_id}</Text>
                  </Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t(
                    "timesheet_entry_page.connected_from_profile",
                    "ข้อมูลเชื่อมต่อจาก Profile ของคุณ",
                  )}
                </Text>
              </Space>
            </Flex>
          )}
        </Flex>

        <Space size={token.marginMD} wrap>
          <Button
            size="large"
            icon={<BookOutlined />}
            onClick={on_guide_click}
            style={{
              height: 48,
              borderRadius: token.borderRadiusLG,
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${token.colorBorder}`,
              background: token.colorBgContainer,
            }}
          >
            {t("timesheet_entry_page.guide", "คู่มือการลงเวลา")}
          </Button>

          <Tooltip title={t("timesheet_entry_page.my_work", "งานของฉัน")}>
            <Badge
              count={t("timesheet_entry_page.new", "ใหม่")}
              color={token.colorInfo}
              offset={[-5, 5]}
            >
              <Button
                size="large"
                shape="circle"
                icon={<UserOutlined />}
                onClick={on_my_work_click}
                style={{
                  height: 48,
                  width: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </Badge>
          </Tooltip>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={on_add_click}
            style={{
              height: 48,
              borderRadius: token.borderRadiusLG * 2,
              fontWeight: 600,
              paddingInline: token.paddingLG * 1.5,
              boxShadow: `0 4px 10px ${token.colorPrimary}40`,
            }}
          >
            {t("timesheet_entry_page.log_time", "ลงเวลาทำงาน")}
          </Button>

          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: "bulk",
                  label: (
                    <Space>
                      {t(
                        "timesheet_entry_page.bulk_entry",
                        "ลงแบบทุกคน (Bulk)",
                      )}
                      <Badge status="error" />
                    </Space>
                  ),
                  icon: <TeamOutlined />,
                  onClick: on_bulk_all_click,
                },
                {
                  key: "multi",
                  label: (
                    <Space>
                      {t(
                        "timesheet_entry_page.multi_entry",
                        "ลงเวลาหลายรายการ",
                      )}
                      <Text type="secondary" disabled>
                        ({t("timesheet_entry_page.coming_soon", "เร็วๆนี้")})
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
                  label: t(
                    "timesheet_entry_page.view_guide_modal",
                    "คู่มือและข้อควรปฏิบัติ",
                  ),
                  icon: <ReadOutlined />,
                  onClick: on_guide_click,
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Dropdown>
        </Space>
      </Flex>
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
        // ใช้ endpoint ใหม่ที่รับ user_id เพื่อลดขนาด response (Optimization)
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
    void fetchData();
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
  ({ currentAdminId, variant = "wide" }, ref) => {
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
    const [viewMode] = useState<MonthlyRankVariant>(variant);

    useImperativeHandle(ref, () => ({ refetch }));

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

    return (
      <Card
        hoverable
        style={{
          height: "100%",
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorderSecondary}`,
          overflow: "hidden",
        }}
        styles={{
          body: {
            padding: 0,
            height: "100%",
          },
        }}
      >
        <Flex vertical style={{ height: "100%" }}>
          {/* Header Section */}
          <Flex vertical gap={16} style={{ padding: 24, paddingBottom: 16 }}>
            <Flex justify="space-between" align="start" wrap="wrap" gap={16}>
              <Flex vertical gap={4}>
                <Typography.Title
                  level={4}
                  style={{
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontWeight: 800,
                  }}
                >
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: token.colorWarningBg,
                      boxShadow: `0 4px 12px ${token.colorWarning}20`,
                    }}
                  >
                    <TrophyFilled
                      style={{ color: token.colorWarning, fontSize: 18 }}
                    />
                  </Flex>
                  <span style={{ color: token.colorTextHeading }}>
                    {currentAdminId
                      ? t("timesheet_entry_page.your_rank", "อันดับของคุณ")
                      : t(
                          "timesheet_entry_page.employee_of_the_month",
                          "พนักงานดีเด่น",
                        )}
                  </span>
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  <Space size={4}>
                    <FireOutlined style={{ color: token.colorError }} />
                    {t(
                      "timesheet_entry_page.who_is_most_diligent",
                      "ใครขยันที่สุดในเดือนนี้?",
                    )}
                  </Space>
                </Typography.Text>
              </Flex>
            </Flex>

            <RankBoardHeader
              monthLabel={monthLabel}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              loading={loading}
              isCompact={isCompact}
              generatedAt={null}
              onRefresh={() => {}}
            />
          </Flex>

          {/* Content Section (Scrollable) */}
          <Flex
            vertical
            flex={1}
            style={{
              padding: "0 24px 24px",
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
                  <Space
                    direction="vertical"
                    size={12}
                    style={{ width: "100%" }}
                  >
                    {Array.from({ length: currentAdminId ? 1 : 4 }).map(
                      (_, index) => (
                        <Flex
                          key={index}
                          align="center"
                          gap={16}
                          style={{
                            padding: 12,
                            borderRadius: 16,
                            background: token.colorFillAlter,
                          }}
                        >
                          <Skeleton.Avatar active size={40} shape="circle" />
                          <Flex vertical flex={1} gap={4}>
                            <Skeleton.Input
                              active
                              size="small"
                              style={{ width: "40%", height: 16 }}
                            />
                            <Skeleton.Input
                              active
                              size="small"
                              style={{ width: "70%", height: 12 }}
                            />
                          </Flex>
                        </Flex>
                      ),
                    )}
                  </Space>
                </motion.div>
              ) : visibleRecords.length === 0 ? (
                <Flex
                  flex={1}
                  vertical
                  justify="center"
                  align="center"
                  style={{ minHeight: 180 }}
                >
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <Flex vertical gap={4}>
                        <Typography.Text strong>ไม่พบข้อมูล</Typography.Text>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {currentAdminId
                            ? "คุณไม่มีบันทึกเวลาในเดือนนี้"
                            : "ยังไม่มีการจัดอันดับในเดือนนี้"}
                        </Typography.Text>
                      </Flex>
                    }
                  />
                </Flex>
              ) : (
                <motion.div
                  key="list"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { staggerChildren: 0.05 },
                    },
                  }}
                >
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ width: "100%" }}
                  >
                    {visibleRecords.map((record, index) => (
                      <motion.div
                        key={record.admin_id}
                        variants={{
                          hidden: { opacity: 0, x: -10 },
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
          </Flex>

          {/* Footer Section */}
          <Flex
            justify="center"
            align="center"
            style={{
              padding: "12px 24px",
              borderTop: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                refetch();
              }}
              style={{ color: token.colorTextSecondary }}
            >
              {t("timesheet_entry_page.update_data", "อัปเดตข้อมูล")}
            </Button>
          </Flex>
        </Flex>
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
  monthly_summary_loading = false,
  monthly_stats = null,
  selected_date,
  on_date_change,
}) => {
  const { token } = theme.useToken();

  return (
    <Row gutter={[24, 24]} style={{ alignItems: "stretch" }}>
      {/* Rank Board Column */}
      <Col xs={24} lg={12} style={{ display: "flex", flexDirection: "column" }}>
        <MonthlyRankBoard
          ref={rank_board_ref}
          currentAdminId={admin_id}
          variant="compact"
        />
      </Col>

      {/* Stats Right Column */}
      <Col xs={24} lg={12}>
        <Flex vertical gap={24} style={{ height: "100%" }}>
          {/* Weekly Chart */}
          <div style={{ height: "100%", display: "flex" }}>
            <WeeklySummary
              monthly_summary={monthly_summary}
              targetHours={DAILY_TARGET_HOURS}
              loading={monthly_summary_loading}
              stats={monthly_stats}
              selected_date={selected_date}
              on_date_change={on_date_change}
            />
          </div>
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
  actionLoading: boolean;
  onPageChange: (page: number, size?: number) => void;
  onRowClick: (record: TimesheetEntry) => void;
  onEdit: (record: TimesheetEntry) => void;
  onCopy: (record: TimesheetEntry) => void;
  onDeleteSingle: (record: TimesheetEntry) => void;
  onRefresh: () => void;
  onAdd: () => void;
}
const TimesheetTable: React.FC<TimesheetTableProps> = ({
  entries,
  loading,
  currentPage,
  pageSize,
  totalItems,
  actionLoading,
  onPageChange,
  onRowClick,
  onEdit,
  onCopy,
  onDeleteSingle,
  onRefresh,
  onAdd,
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
    [token.colorPrimary, t],
  );

  const columns = useMemo<any>(
    () => [
      {
        title: (
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("timesheet_entry_page.table_date", "วันที่")}
          </Typography.Text>
        ),
        dataIndex: "date",
        width: 120,
        align: "center",
        responsive: ["md"],
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (value: string) => (
          <Typography.Text style={{ fontSize: 13 }}>
            {dayjs(value).format("DD/MM/YYYY")}
          </Typography.Text>
        ),
      },
      {
        title: (
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("timesheet_entry_page.project_and_task", "โครงการ / งาน")}
          </Typography.Text>
        ),
        dataIndex: "project_name",
        width: 350,
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          a.project_name.localeCompare(b.project_name),
        ...getColumnSearchProps(
          "project_name",
          t("timesheet_entry_page.table_project", "โครงการ"),
        ),
        render: (value: string, record: TimesheetEntry) => (
          <Flex vertical gap={4} style={{ padding: "4px 0" }}>
            <Flex align="center" gap={8} wrap="wrap">
              <Typography.Text strong style={{ fontSize: 15 }}>
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
                  style={{ fontSize: 10, margin: 0, borderRadius: 4 }}
                >
                  {record.category_type}
                </Tag>
              )}
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <Space size={4}>
                <ApartmentOutlined />
                {record.feature_name || "General Task"}
              </Space>
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: (
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("timesheet_entry_page.table_status", "สถานะ")}
          </Typography.Text>
        ),
        dataIndex: "status",
        width: 150,
        align: "center",
        render: (value: string) => {
          const label =
            STATUS_OPTIONS.find((s) => s.value === value)?.label_th || value;

          const statusMap: Record<string, string> = {
            IN_PROGRESS: "processing",
            DONE: "success",
            APPROVED: "cyan",
            REJECTED: "error",
            DRAFT: "default",
          };

          return (
            <Tag
              bordered={false}
              color={statusMap[value] || "warning"}
              style={{
                borderRadius: 12,
                paddingInline: 12,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {label}
            </Tag>
          );
        },
      },
      {
        title: (
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("timesheet_entry_page.table_description", "รายละเอียด")}
          </Typography.Text>
        ),
        dataIndex: "description",
        width: 300,
        render: (value: string) => (
          <Tooltip title={value} placement="topLeft">
            <Typography.Text
              type="secondary"
              italic
              ellipsis
              style={{ fontSize: 13, display: "block", maxWidth: "100%" }}
            >
              {value ||
                t(
                  "timesheet_entry_page.no_description",
                  "ไม่มีรายละเอียดระบุไว้",
                )}
            </Typography.Text>
          </Tooltip>
        ),
      },
      {
        title: (
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("timesheet_entry_page.table_hours", "เวลา")}
          </Typography.Text>
        ),
        dataIndex: "hours",
        width: 120,
        align: "right",
        sorter: (a: TimesheetEntry, b: TimesheetEntry) =>
          Number(a.hours || 0) - Number(b.hours || 0),
        render: (value: number) => {
          const hours = Number(value) || 0;
          return (
            <Space align="baseline" size={4}>
              <Typography.Text
                strong
                style={{
                  fontSize: 20,
                  color:
                    hours >= 8
                      ? (token as any).colorSuccess
                      : (token as any).colorTextHeading,
                }}
              >
                {hours.toFixed(1)}
              </Typography.Text>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 10, fontWeight: 700 }}
              >
                {t("timesheet_entry_page.hrs", "ชม.")}
              </Typography.Text>
            </Space>
          );
        },
      },
      {
        key: "actions",
        fixed: "right",
        width: 100,
        align: "center",
        render: (_text: string, r: TimesheetEntry) => {
          const entryDate = dayjs(r.date);
          const diffDays = dayjs().diff(entryDate, "day");
          const canEdit = diffDays <= 7;

          return (
            <Space>
              <Tooltip
                title={
                  canEdit
                    ? t("edit", "แก้ไข")
                    : t(
                        "cannot_edit_policy",
                        "ไม่สามารถแก้ไขได้เนื่องจากรายลงเวลา เกิน 7 วัน",
                      )
                }
              >
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  disabled={!canEdit}
                  icon={
                    <EditOutlined
                      style={{
                        color: canEdit
                          ? (token as any).colorWarning
                          : (token as any).colorTextDisabled,
                      }}
                    />
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canEdit) onEdit(r);
                  }}
                />
              </Tooltip>
              <Tooltip title={t("copy", "คัดลอก")}>
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  icon={
                    <CopyOutlined
                      style={{ color: (token as any).colorSuccess }}
                    />
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(r);
                  }}
                />
              </Tooltip>
              <Tooltip
                title={
                  canEdit
                    ? t("delete", "ลบ")
                    : t(
                        "cannot_delete_policy",
                        "ไม่สามารถลบได้เนื่องจากรายลงเวลา เกิน 7 วัน",
                      )
                }
              >
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  disabled={!canEdit}
                  icon={
                    <DeleteOutlined
                      style={{
                        color: canEdit
                          ? (token as any).colorError
                          : (token as any).colorTextDisabled,
                      }}
                    />
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canEdit) onDeleteSingle(r);
                  }}
                />
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [onEdit, onCopy, getColumnSearchProps, token, t],
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
        <Flex align="center" gap={20} style={{ padding: "12px 0" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: token.colorPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 6px 16px ${token.colorPrimary}40`,
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 28, color: "#fff" }} />
          </div>
          <Flex vertical gap={4}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {t("timesheet_entry_page.timesheet_log")}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {t("timesheet_entry_page.manage_and_check_timesheet")}
            </Typography.Text>
          </Flex>
        </Flex>
      }
      extra={
        <Space size={24}>
          <Popover
            content={
              <Flex vertical gap={12} style={{ minWidth: 200, padding: 4 }}>
                <Flex
                  justify="space-between"
                  align="center"
                  style={{
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    paddingBottom: 8,
                  }}
                >
                  <Typography.Text strong>
                    {t("columnSetting", "ตั้งค่าคอลัมน์")}
                  </Typography.Text>
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined style={{ fontSize: 12 }} />}
                    onClick={() => {
                      setVisibleColumns(
                        ALL_TIMESHEET_COLUMNS.map((c) => c.key),
                      );
                    }}
                  />
                </Flex>
                <Checkbox.Group
                  value={visibleColumns}
                  onChange={(checkedValues) => {
                    setVisibleColumns(checkedValues);
                  }}
                  style={{ width: "100%" }}
                >
                  <Flex vertical gap={10}>
                    {ALL_TIMESHEET_COLUMNS.map((col) => (
                      <Checkbox key={col.key} value={col.key}>
                        <Typography.Text style={{ fontSize: 13 }}>
                          {col.label}
                        </Typography.Text>
                      </Checkbox>
                    ))}
                  </Flex>
                </Checkbox.Group>
              </Flex>
            }
            trigger="click"
            placement="bottomRight"
          >
            <Tooltip title={t("columnSetting", "ตั้งค่าคอลัมน์")}>
              <Button
                icon={<SettingOutlined />}
                size="large"
                style={{
                  borderRadius: 12,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              />
            </Tooltip>
          </Popover>
          <TimesheetActions
            loading={actionLoading}
            refreshLoading={loading}
            onRefresh={onRefresh}
            onAdd={onAdd}
          />
        </Space>
      }
      style={{
        margin: "24px 0",
        borderRadius: 24,
        overflow: "hidden",
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ padding: token.paddingLG }}>
        <Table<TimesheetEntry>
          rowKey={(r) => String(r.id)}
          columns={filteredColumns}
          dataSource={entries}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalItems,
            onChange: onPageChange,
            showSizeChanger: true,
            position: ["bottomCenter"],
          }}
          onRow={(r) => ({
            onClick: () => {
              onRowClick(r);
            },
            style: { cursor: "pointer" },
          })}
        />
      </div>
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
  const { Text, Title } = Typography;
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
      // Use a consistent delay to ensure the form instance is fully connected
      // to the DOM element, especially in fast environments like Turbopack.
      // Increased to 100ms for extra safety.
      const timer = setTimeout(() => {
        if (formMode === "create") {
          form.resetFields();
          form.setFieldsValue({
            status: "DONE",
            date: dayjs(),
            work_hour: 2.0,
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
      }, 100);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [open, formMode, form, record]);

  useEffect(() => {
    if (!open) return;

    // Similarly delay this update to ensure connection
    const timer = setTimeout(() => {
      // Only set values if the form instance is likely connected
      if (searchMode === "hierarchy") {
        form.setFieldsValue({ sub_project_search: undefined });
      } else {
        form.setFieldsValue({
          project_id: undefined,
          sub_project_id: undefined,
        });
      }
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, [searchMode, form, open]);

  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: (
          <Space>
            <ProjectOutlined style={{ color: token.colorPrimary }} />
            {p.name}
            <Text type="secondary" style={{ fontSize: 12 }}>
              (ID: {p.id})
            </Text>
          </Space>
        ),
        value: Number(p.id),
        labelString: p.name,
      })),
    [projects, token, Text],
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
            <Text type="secondary" style={{ fontSize: 12 }}>
              (ID: {s.id})
            </Text>
          </Space>
        ),
        value: Number(s.id),
        labelString: s.name,
      })),
    [subProject, token, Text],
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
        <Space size={12}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: token.colorPrimaryBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ThunderboltOutlined
              style={{ color: token.colorPrimary, fontSize: 18 }}
            />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              {t("logWorkTime", "ลงเวลาทำงาน")}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              บันทึกรายละเอียดการปฏิบัติงานประจำวันเข้าสู่ระบบ
            </Text>
          </div>
        </Space>
      }
      onCancel={onCancel}
      width={1200}
      centered
      footer={null}
      forceRender
      afterClose={afterClose}
      styles={{
        body: { padding: "8px 0" },
      }}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Flex vertical gap={24}>
          {/* ส่วนที่ 1: ข้อมูลโครงการ (Project Selection) */}
          <Card
            variant="borderless"
            styles={{ body: { padding: 24 } }}
            style={{
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 16,
              background: token.colorBgContainer,
            }}
          >
            <Flex
              justify="space-between"
              align="center"
              style={{ marginBottom: 20 }}
            >
              <Space>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    background: token.colorInfoBg,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ProjectOutlined style={{ color: token.colorInfo }} />
                </div>
                <Text strong style={{ fontSize: 16 }}>
                  {t("responsibleProject", "โครงการที่รับผิดชอบ")}
                </Text>
              </Space>
              <Radio.Group
                value={searchMode}
                onChange={(e) => {
                  setSearchMode(e.target.value);
                }}
                buttonStyle="solid"
                size="middle"
              >
                <Radio.Button value="hierarchy">
                  {t("selectByProject", "เลือกตามโครงการ")}
                </Radio.Button>
                <Radio.Button value="direct">
                  {t("searchSubTask", "ค้นหางานย่อย")}
                </Radio.Button>
              </Radio.Group>
            </Flex>

            {searchMode === "hierarchy" ? (
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        <span style={{ fontWeight: 500 }}>
                          {t("mainProject", "โครงการหลัก")}
                        </span>
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
                    rules={[{ required: true }]}
                  >
                    <Select
                      size="large"
                      placeholder="เลือกโครงการ..."
                      options={projectOptions}
                      onChange={(v) => {
                        form.setFieldsValue({ sub_project_id: undefined });
                        if (v) fetchSubProjects(String(v));
                      }}
                      showSearch
                      filterOption={(input, option) => {
                        const labelStr = (
                          option?.labelString ?? ""
                        ).toLowerCase();
                        const inputStr = input.toLowerCase();
                        const valueStr = String(option?.value).toLowerCase();
                        return (
                          labelStr.includes(inputStr) ||
                          valueStr.includes(inputStr)
                        );
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        <span style={{ fontWeight: 500 }}>
                          {t("subTaskFeature", "งานย่อย / ฟีเจอร์")}
                        </span>
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
                    rules={[{ required: true }]}
                    dependencies={["project_id"]}
                  >
                    <Select
                      size="large"
                      placeholder="เลือกงานย่อย..."
                      options={subProjectOptions}
                      disabled={!form.getFieldValue("project_id")}
                      showSearch
                      filterOption={(input, option) => {
                        const labelStr = (
                          option?.labelString ?? ""
                        ).toLowerCase();
                        const inputStr = input.toLowerCase();
                        const valueStr = String(option?.value).toLowerCase();
                        return (
                          labelStr.includes(inputStr) ||
                          valueStr.includes(inputStr)
                        );
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            ) : (
              <Form.Item
                label={
                  <span style={{ fontWeight: 500 }}>
                    {t("searchSubTask", "ค้นหางานย่อย")}
                  </span>
                }
                name="sub_project_search"
                rules={[
                  {
                    required: true,
                    message: t(
                      "pleaseSelectSubTask",
                      "กรุณาค้นหาและเลือกงานย่อย",
                    ),
                  },
                  {
                    validator: async (_, value) => {
                      const projectId = form.getFieldValue("project_id");
                      const subProjectId = form.getFieldValue("sub_project_id");
                      if (!projectId || !subProjectId) {
                        return Promise.reject(
                          new Error(
                            t("selectFromList", "กรุณาเลือกงานย่อยจากรายการ"),
                          ),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Select
                  size="large"
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
            )}
          </Card>

          {/* ส่วนที่ 2: รายละเอียดการทำงาน (Work Details) */}
          <Card
            variant="borderless"
            styles={{ body: { padding: 24 } }}
            style={{
              borderRadius: 16,
              background: token.colorFillAlter,
              border: "none",
            }}
          >
            <Flex vertical gap={20}>
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={
                      <span style={{ fontWeight: 500 }}>
                        <CalendarOutlined /> {t("date", "วันที่")}
                      </span>
                    }
                    name="date"
                    rules={[{ required: true }]}
                  >
                    <DatePicker
                      size="large"
                      format="DD/MM/BBBB"
                      style={{ width: "100%" }}
                      disabledDate={(current) =>
                        current && current > dayjs().endOf("day")
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={
                      <span style={{ fontWeight: 500 }}>
                        <ClockCircleOutlined />{" "}
                        {t("durationHours", "ระยะเวลา (ชม.)")}
                      </span>
                    }
                    name="work_hour"
                    rules={[
                      { required: true },
                      { type: "number", min: 0.1, max: 24 },
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
                            <Text type="warning" style={{ fontSize: 12 }}>
                              <ExclamationCircleOutlined />{" "}
                              {t(
                                "over8HoursWarning",
                                "คุณกำลังกรอกเวลาเกิน 8 ชั่วโมง",
                              )}
                            </Text>
                          ) : null;
                        }}
                      </Form.Item>
                    }
                  >
                    <InputNumber
                      size="large"
                      style={{ width: "100%" }}
                      min={0}
                      step={0.5}
                      placeholder="0.0"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={
                      <span style={{ fontWeight: 500 }}>
                        <TagOutlined /> {t("status", "สถานะ")}
                      </span>
                    }
                    name="status"
                  >
                    <Select size="large" options={statusOptions} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={
                  <span style={{ fontWeight: 500 }}>
                    <FileTextOutlined />{" "}
                    {t("workDescription", "รายละเอียดการทำงาน")}
                  </span>
                }
                name="description"
                style={{ marginBottom: 0 }}
                rules={[
                  {
                    required: true,
                    message: t(
                      "timesheet_entry_page.description_required",
                      "กรุณาระบุรายละเอียดการทำงาน",
                    ),
                  },
                ]}
              >
                <Input.TextArea
                  rows={5}
                  showCount
                  maxLength={500}
                  style={{ borderRadius: 12 }}
                  placeholder={t(
                    "timesheet_entry_page.description_placeholder",
                    "อธิบายรายละเอียดตัวอย่างงาน เช่น SBAPP-1927 Grade (A+) 215 โรงเรียนเทศบาล ๒ (บ้านมลายูบางกอก) ลิงค์ยืนยันอุปกรณ์ของคุณครูไม่สามารถกดได้",
                  )}
                />
              </Form.Item>
            </Flex>
          </Card>

          {/* ส่วนที่ 3: ปุ่มควบคุม (Action Buttons) */}
          <Flex justify="end" gap={12} style={{ padding: "8px 0" }}>
            <Button
              onClick={onCancel}
              disabled={disabled}
              size="large"
              style={{ minWidth: 100, borderRadius: 10 }}
            >
              {t("cancel", "ยกเลิก")}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={disabled}
              icon={<SaveOutlined />}
              size="large"
              style={{ minWidth: 160, borderRadius: 10, fontWeight: 600 }}
            >
              {t("saveData", "บันทึกข้อมูล")}
            </Button>
          </Flex>
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
  const { t } = useTranslation("translate");
  const { Title, Text } = Typography;
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

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { id: `entry-${Date.now()}`, status: "IN_PROGRESS", date: dayjs() },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, field: string, value: any) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

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
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        label: (
          <Space>
            <ProjectOutlined style={{ color: token.colorPrimary }} />
            {p.name}
          </Space>
        ),
        value: p.id,
        labelString: p.name,
      })),
    [projects, token],
  );

  const getSubProjectOptions = (pid?: number) =>
    pid && subProjects[String(pid)]
      ? subProjects[String(pid)].map((s) => ({
          label: (
            <Space>
              <ApartmentOutlined style={{ color: token.colorWarning }} />
              {s.name}
            </Space>
          ),
          value: Number(s.id),
          labelString: s.name,
        }))
      : [];

  return (
    <Modal
      open={open}
      title={
        <Space size={12}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: token.colorInfoBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppstoreAddOutlined style={{ color: token.colorInfo }} />
          </div>
          <Title level={4} style={{ margin: 0 }}>
            {t("multiEntry", "ลงเวลาหลายรายการ")}
          </Title>
        </Space>
      }
      onCancel={onCancel}
      width={1000}
      footer={null}
      centered
      forceRender
    >
      <Form form={form} layout="vertical">
        <Alert
          message={
            <Space>
              <InfoCircleOutlined />
              <span>
                {t(
                  "multiEntryTip",
                  "คุณสามารถเพิ่มรายการการลงเวลาได้ทีละหลายรายการ",
                )}
              </span>
            </Space>
          }
          type="info"
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
          <Flex vertical gap={16}>
            {entries.map((entry, idx) => (
              <Card
                key={entry.id}
                size="small"
                title={
                  <Space>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: token.colorFillSecondary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <Text strong>
                      {t("entryItem", "รายการที่")} {idx + 1}
                    </Text>
                  </Space>
                }
                extra={
                  entries.length > 1 && (
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        removeEntry(entry.id);
                      }}
                    />
                  )
                }
                styles={{ body: { padding: 16 } }}
                style={{ border: `1px solid ${token.colorBorderSecondary}` }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={t("project", "โครงการ")}
                      name={`project_id_${entry.id}`}
                      rules={[{ required: true, message: "" }]}
                    >
                      <Select
                        options={projectOptions}
                        showSearch
                        onChange={(v) => handleProjectChange(entry.id, v)}
                        optionFilterProp="labelString"
                        placeholder={t("selectProject", "เลือกโครงการ")}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={t("subTask", "งานย่อย")}
                      name={`sub_project_id_${entry.id}`}
                      rules={[{ required: true, message: "" }]}
                    >
                      <Select
                        options={getSubProjectOptions(entry.project_id as any)}
                        showSearch
                        disabled={!entry.project_id}
                        onChange={(v) => {
                          updateEntry(entry.id, "sub_project_id", v);
                        }}
                        optionFilterProp="labelString"
                        placeholder={t("selectSubTask", "เลือกงานย่อย")}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label={t("date", "วันที่")}
                      name={`date_${entry.id}`}
                      rules={[{ required: true, message: "" }]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        onChange={(v) => {
                          updateEntry(entry.id, "date", v);
                        }}
                        placeholder={t("selectDate", "เลือกวันที่")}
                        format="DD/MM/BBBB"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label={t("hoursShort", "ชม.")}
                      name={`work_hour_${entry.id}`}
                      rules={[{ required: true, message: "" }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0.1}
                        max={24}
                        step={0.5}
                        onChange={(v) => {
                          updateEntry(entry.id, "work_hour", v);
                        }}
                        placeholder="0.0"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label={t("status", "สถานะ")}
                      name={`status_${entry.id}`}
                    >
                      <Select
                        options={STATUS_OPTIONS.map((s) => ({
                          label: s.label_th,
                          value: s.value,
                        }))}
                        onChange={(v) => {
                          updateEntry(entry.id, "status", v);
                        }}
                        placeholder={t("selectStatus", "เลือกสถานะ")}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      label={t("description", "รายละเอียด")}
                      name={`description_${entry.id}`}
                      style={{ marginBottom: 0 }}
                    >
                      <Input.TextArea
                        rows={2}
                        onChange={(e) => {
                          updateEntry(entry.id, "description", e.target.value);
                        }}
                        placeholder={t(
                          "descriptionPlaceholder",
                          "ระบุรายละเอียดงาน...",
                        )}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
          </Flex>
        </div>
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={addEntry}
          style={{ marginTop: 16, height: 40 }}
        >
          {t("addMoreEntry", "เพิ่มรายการต่อ")}
        </Button>
        <Divider />
        <Flex justify="end" gap={12}>
          <Button onClick={onCancel} disabled={disabled}>
            {t("cancel", "ยกเลิก")}
          </Button>
          <Button
            type="primary"
            onClick={handleFormSubmit}
            loading={disabled}
            size="large"
            style={{ minWidth: 150 }}
          >
            {t("saveAll", "บันทึกทั้งหมด")} ({entries.length}{" "}
            {t("items", "รายการ")})
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
  const { Text, Title } = Typography;
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
      // Reset password form when modal opens with a slight delay
      // to ensure the form instance is connected to the DOM
      setTimeout(() => {
        passwordForm.resetFields();
      }, 50);
    }
  }, [open, passwordForm]);

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
      // Wait for the next tick to ensure the Form is rendered before resetting
      // Increased delay to 50ms for better stability in Turbopack environments
      setTimeout(() => {
        form.resetFields();
        form.setFieldsValue({ status: "IN_PROGRESS", date: dayjs() });
      }, 50);
      toast.success("ปลดล็อคสำเร็จ! สามารถลงเวลาได้ทุกคนแล้ว", {
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
            <Text type="secondary" style={{ fontSize: 12 }}>
              (ID: {p.id})
            </Text>
          </Space>
        ),
        value: Number(p.id),
        labelString: p.name,
      })),
    [projects, token, Text],
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

      const initialProgress: BulkProgressItem[] = users.map((user) => ({
        admin_id: user.admin_id,
        name: `${user.firstname} ${user.lastname}`,
        employee_code: user.employee_code,
        status: "pending",
      }));
      setProgressList(initialProgress);

      for (let i = 0; i < users.length; i++) {
        const user = users[i];

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

          setProgressList((prev) =>
            prev.map((item) =>
              item.admin_id === user.admin_id
                ? { ...item, status: "success", message: "สำเร็จ" }
                : item,
            ),
          );
        } catch (error: any) {
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
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

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
        <Space size={12}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: !isUnlocked
                ? token.colorWarningBg
                : token.colorSuccessBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!isUnlocked ? (
              <LockOutlined
                style={{ fontSize: 20, color: token.colorWarning }}
              />
            ) : (
              <TeamOutlined
                style={{ fontSize: 20, color: token.colorSuccess }}
              />
            )}
          </div>
          <Flex vertical gap={0}>
            <Title level={4} style={{ margin: 0 }}>
              ลงเวลาทำงานให้ทุกคน
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {!isUnlocked
                ? "ต้องใช้รหัสผ่านเพื่อเข้าถึงฟีเจอร์นี้"
                : `พร้อมส่งข้อมูลให้เพื่อนร่วมงานทั้ง ${users.length} คน`}
            </Text>
          </Flex>
        </Space>
      }
      onCancel={onCancel}
      width={isUnlocked ? 900 : 500}
      centered
      footer={null}
      maskClosable={!isProcessing}
      closable={!isProcessing}
      forceRender
    >
      <div style={{ display: !isUnlocked ? "block" : "none" }}>
        <Flex vertical align="center" style={{ padding: "40px 24px" }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: token.colorWarningBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <LockOutlined style={{ fontSize: 40, color: token.colorWarning }} />
          </div>
          <Title level={5}>ฟีเจอร์นี้ต้องใช้รหัสผ่านเพิ่มเติม</Title>
          <Text type="secondary" style={{ marginBottom: 24 }}>
            เพื่อป้องกันการใช้งานโดยไม่ได้ตั้งใจ กรุณาใส่รหัสผ่าน
          </Text>
          <Form
            form={passwordForm}
            onFinish={handlePasswordSubmit}
            style={{ width: "100%" }}
          >
            <Form.Item
              name="password"
              rules={[{ required: true, message: "กรุณาใส่รหัสผ่าน" }]}
            >
              <Input.Password
                size="large"
                placeholder="ใส่รหัสผ่าน..."
                prefix={<LockOutlined />}
              />
            </Form.Item>
            <Button
              type="primary"
              size="large"
              block
              icon={<UnlockOutlined />}
              onClick={handlePasswordSubmit}
              style={{
                background: token.colorWarning,
                border: "none",
                height: 48,
              }}
            >
              ปลดล็อค
            </Button>
          </Form>
        </Flex>
      </div>

      <div style={{ display: isUnlocked ? "block" : "none" }}>
        <Flex vertical gap={24}>
          <div style={{ display: isProcessing ? "block" : "none" }}>
            <Flex vertical gap={16}>
              <Card
                styles={{ body: { padding: 24 } }}
                style={{ background: token.colorFillAlter, border: "none" }}
              >
                <Flex vertical align="center" gap={16}>
                  <Progress
                    type="circle"
                    percent={progressPercent}
                    format={() => (
                      <Flex vertical align="center">
                        <Text strong style={{ fontSize: 20 }}>
                          {completedCount}/{users.length}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          คน
                        </Text>
                      </Flex>
                    )}
                  />
                  <Text strong>กำลังดำเนินการ...</Text>
                </Flex>
              </Card>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                <Flex vertical gap={8}>
                  {progressList.map((item) => {
                    let statusColor = token.colorTextSecondary;
                    let statusIcon = <ClockCircleOutlined />;
                    let itemBg = token.colorFillQuaternary;
                    let itemBorder = token.colorBorder;

                    if (item.status === "processing") {
                      statusColor = token.colorPrimary;
                      statusIcon = <SyncOutlined spin />;
                      itemBg = token.colorPrimaryBg;
                      itemBorder = token.colorPrimary;
                    } else if (item.status === "success") {
                      statusColor = token.colorSuccess;
                      statusIcon = <CheckCircleFilled />;
                      itemBg = token.colorSuccessBg;
                      itemBorder = token.colorSuccess;
                    } else if (item.status === "error") {
                      statusColor = token.colorError;
                      statusIcon = <CloseCircleFilled />;
                      itemBg = token.colorErrorBg;
                      itemBorder = token.colorError;
                    }

                    return (
                      <Card
                        key={item.admin_id}
                        size="small"
                        style={{ background: itemBg, borderColor: itemBorder }}
                        styles={{ body: { padding: "12px 16px" } }}
                      >
                        <Flex justify="space-between" align="center">
                          <Space>
                            <span style={{ color: statusColor }}>
                              {statusIcon}
                            </span>
                            <Text strong>{item.name}</Text>
                            {item.employee_code && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                ({item.employee_code})
                              </Text>
                            )}
                          </Space>
                          <Text style={{ color: statusColor, fontSize: 12 }}>
                            {item.message ||
                              (item.status === "pending" ? "รอดำเนินการ" : "")}
                          </Text>
                        </Flex>
                      </Card>
                    );
                  })}
                </Flex>
              </div>
            </Flex>
          </div>

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
                style={{ marginBottom: 24, borderRadius: 8 }}
              />

              <Card size="small" style={{ marginBottom: 24 }}>
                <Title
                  level={5}
                  style={{ color: token.colorPrimary, marginBottom: 16 }}
                >
                  <ProjectOutlined /> โครงการที่รับผิดชอบ
                </Title>
                <Row gutter={16}>
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
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card
                size="small"
                style={{ background: token.colorFillAlter, border: "none" }}
              >
                <Row gutter={16}>
                  <Col xs={12} sm={8}>
                    <Form.Item
                      label="วันที่"
                      name="date"
                      rules={[{ required: true, message: "กรุณาเลือกวันที่" }]}
                    >
                      <DatePicker
                        format="DD/MM/BBBB"
                        style={{ width: "100%" }}
                      />
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
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        step={0.5}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item label="สถานะ" name="status">
                      <Select options={statusOptions} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="รายละเอียดการทำงาน" name="description">
                  <Input.TextArea
                    rows={3}
                    showCount
                    maxLength={500}
                    placeholder="ระบุรายละเอียดงานที่ทำ (จะใช้กับทุกคน)..."
                  />
                </Form.Item>
              </Card>

              <Flex
                justify="space-between"
                align="center"
                style={{ marginTop: 24 }}
              >
                <Text type="secondary">
                  <TeamOutlined /> จะส่งให้ทั้งหมด {users.length} คน
                </Text>
                <Space>
                  <Button onClick={onCancel}>ยกเลิก</Button>
                  <Button
                    type="primary"
                    icon={<TeamOutlined />}
                    onClick={handleSubmit}
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
          </div>

          {!isProcessing && completedCount > 0 && (
            <Flex justify="center">
              <Button onClick={onCancel} type="primary" size="large">
                ปิด
              </Button>
            </Flex>
          )}
        </Flex>
      </div>
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
  const [guideModalOpen, setGuideModalOpen] = useState(false);
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
  const openDeleteModal = useCallback(
    (record: TimesheetEntry) => {
      dispatch(setActiveRecord(record));
      dispatch(setModalType("delete"));
    },
    [dispatch],
  );

  const handleSubmitTimesheet = useCallback(
    async (values: any) => {
      try {
        // Use values from onFinish if available, otherwise validate
        const finalValues =
          values && typeof values === "object" && !values.nativeEvent
            ? values
            : await form.validateFields();

        const success = await submitTimesheet(
          finalValues,
          timesheetState.formMode,
          timesheetState.activeRecord?.id,
        );
        if (success && isMountedRef.current) closeModal();
      } catch (error) {
        console.error("Form validation failed:", error);
      }
    },
    [form, submitTimesheet, timesheetState, closeModal],
  );

  const handleDeleteTimesheet = useCallback(async () => {
    if (!timesheetState.activeRecord?.id) return;
    const success = await deleteTimesheet([
      String(timesheetState.activeRecord.id),
    ]);
    if (success && isMountedRef.current) {
      closeModal();
    }
  }, [deleteTimesheet, timesheetState.activeRecord, closeModal]);

  const handlePageChange = useCallback(
    (page: number, size?: number) => {
      setCurrentPage(page);
      if (size && size !== pageSize) setPageSize(size);
    },
    [pageSize, setCurrentPage, setPageSize],
  );

  // Multi Entry Logic
  const openMultiEntryForm = useCallback(() => {
    setMultiEntryModalOpen(true);
  }, []);
  const closeMultiEntryModal = useCallback(() => {
    setMultiEntryModalOpen(false);
    setSubProjectsCache({});
  }, []);

  // Bulk All Users Entry Logic
  const openBulkAllUsersModal = useCallback(() => {
    setBulkAllUsersModalOpen(true);
  }, []);
  const closeBulkAllUsersModal = useCallback(() => {
    setBulkAllUsersModalOpen(false);
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
          <Space direction="vertical" size={32} style={{ width: "100%" }}>
            <PageHeader
              admin_name={admin_name}
              admin_id={admin_id}
              on_add_click={openCreateForm}
              on_add_multi_click={openMultiEntryForm}
              on_bulk_all_click={openBulkAllUsersModal}
              on_guide_click={() => {
                setGuideModalOpen(true);
              }}
              on_my_work_click={() => {
                setMyWorkModalOpen(true);
              }}
              token={token}
            />
            <StatsGrid
              admin_id={admin_id}
              rank_board_ref={rankBoardRef}
              monthly_summary={monthly_summary as any}
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
                actionLoading={actionLoading}
                onPageChange={handlePageChange}
                onRowClick={openDetailModal}
                onEdit={openEditForm}
                onCopy={openCopyForm}
                onDeleteSingle={openDeleteModal}
                onRefresh={refetch_entries}
                onAdd={openCreateForm}
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
            selectedCount={1}
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
            onCancel={() => {
              setMyWorkModalOpen(false);
            }}
            userId={admin_id}
          />
          <GuideModal
            open={guideModalOpen}
            onCancel={() => {
              setGuideModalOpen(false);
            }}
          />

          <StatusModal
            open={statusModal.open}
            type={statusModal.type}
            title={statusModal.title}
            message={statusModal.message}
            onClose={() => {
              setStatusModal((prev) => ({ ...prev, open: false }));
            }}
          />
        </motion.div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
