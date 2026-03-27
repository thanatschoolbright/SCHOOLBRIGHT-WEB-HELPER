"use client";

import {
  ApartmentOutlined,
  BookOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  ReloadOutlined,
  RightOutlined,
  SafetyCertificateFilled,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Flex,
  Form,
  InputRef,
  Modal,
  Popover,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import { ColumnType } from "antd/lib/table";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import isBetween from "dayjs/plugin/isBetween";
import { motion } from "framer-motion";
import i18next from "i18next";
import React, {
  useCallback,
  useEffect,
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
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import {
  useProjectData,
  useTimesheetActions,
} from "./hooks/use-timesheet-actions.data";
import {
  SearchableColumnKey,
  TimesheetEntry,
} from "./types/timesheet-entry.types";
import { DATE_FORMAT, getStatusConfig } from "./utils/timesheet-entry.helpers";

import { CreateModalForm } from "./_components/create-modal-form";
import { PageHeader } from "./_components/page-header";
import { StatsGrid } from "./_components/stats-grid";

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

// --- Page Header (Moved to _components/page-header.tsx) ---

// --- Monthly Rank Board Component Imported Above ---

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
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [myWorkModalOpen, setMyWorkModalOpen] = useState(false);

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
            statusOptions={useMemo(
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
            )}
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
