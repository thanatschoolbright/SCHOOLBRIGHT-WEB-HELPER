"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PermissionLayout from "@/components/layouts/permission-layout";
import DashboardLayout from "@components/layouts/backend-layout";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@stores/store";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { InputRef } from "antd";
import type { TableProps } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { toast } from "sonner";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import type { Project, SubProject } from "@stores/type";
import { CreateModalForm } from "./create";

interface TimesheetEntry {
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

type FormMode = "create" | "edit" | "copy";

type ModalType = "form" | "detail" | "delete" | null;

type DailySummaryItem = {
  dateKey: string;
  displayDate: string;
  totalHours: number;
  percent: number;
  isCompleted: boolean;
};

type WeeklySummaryItem = DailySummaryItem & { label: string };

const DATE_FORMAT = "DD/MM/YYYY";
const PAGE_SIZE = 30;
const DAILY_TARGET_HOURS = 8;
const WEEKDAY_LABELS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"];

interface RankProfile {
  rank: "A" | "B" | "C" | "D" | "E" | "F";
  completedDays: number;
  title: string;
  description: string;
  gradient: string;
  textColor: string;
  borderColor: string;
}

//** รวมชั่วโมงของแต่ละวันจากรายการทั้งหมด
const buildDailySummary = (entries: TimesheetEntry[]): DailySummaryItem[] => {
  if (!entries.length) return [];

  const summaryMap = new Map<string, { totalHours: number; rawDate: string }>();

  entries.forEach((entry) => {
    const dateKey = dayjs(entry.date).format("YYYY-MM-DD");
    const numericHours = Number(entry.hours) || 0;
    if (summaryMap.has(dateKey)) {
      summaryMap.get(dateKey)!.totalHours += numericHours;
    } else {
      summaryMap.set(dateKey, {
        totalHours: numericHours,
        rawDate: entry.date,
      });
    }
  });

  return Array.from(summaryMap.entries())
    .map(([dateKey, payload]) => {
      const totalHours = Number(payload.totalHours.toFixed(2));
      const percent = Math.min(
        Number(((totalHours / DAILY_TARGET_HOURS) * 100).toFixed(2)),
        200
      );
      return {
        dateKey,
        displayDate: dayjs(payload.rawDate).format(DATE_FORMAT),
        totalHours,
        percent,
        isCompleted: totalHours >= DAILY_TARGET_HOURS,
      };
    })
    .sort((a, b) => dayjs(b.dateKey).valueOf() - dayjs(a.dateKey).valueOf());
};

//** สร้างข้อมูลสรุปรายสัปดาห์ (จันทร์-ศุกร์)
const buildWeeklySummary = (
  dailySummary: DailySummaryItem[]
): WeeklySummaryItem[] => {
  if (!dailySummary.length) return [];

  const summaryLookup = new Map(
    dailySummary.map((item) => [item.dateKey, item])
  );
  const latestDate = dailySummary.reduce((latest, item) => {
    const current = dayjs(item.dateKey);
    return current.isAfter(latest) ? current : latest;
  }, dayjs(dailySummary[0].dateKey));

  const offsetToMonday = (latestDate.day() + 6) % 7;
  const monday = latestDate
    .clone()
    .startOf("day")
    .subtract(offsetToMonday, "day");

  return WEEKDAY_LABELS.map((label, index) => {
    const day = monday.clone().add(index, "day");
    const key = day.format("YYYY-MM-DD");
    const summary = summaryLookup.get(key);

    return {
      label,
      dateKey: key,
      displayDate: day.format(DATE_FORMAT),
      totalHours: summary?.totalHours ?? 0,
      percent: summary?.percent ?? 0,
      isCompleted: summary?.isCompleted ?? false,
    };
  });
};

//** คำนวณ Rank ตามจำนวนวันที่ครบเป้าหมาย
const deriveRankProfile = (
  weeklySummary: WeeklySummaryItem[]
): RankProfile | null => {
  if (!weeklySummary.length) return null;

  const completedDays = weeklySummary.filter((day) => day.isCompleted).length;

  const rankMap: Record<number, RankProfile> = {
    5: {
      rank: "A",
      completedDays,
      title: "MAX STREAK",
      description: "ลงครบทุกวันในสัปดาห์นี้",
      gradient: "linear-gradient(135deg, #ffd700, #ff9f1a)",
      textColor: "#3b2000",
      borderColor: "#ffb347",
    },
    4: {
      rank: "B",
      completedDays,
      title: "PROGRESSIVE",
      description: "เหลืออีกเพียง 1 วันเท่านั้น",
      gradient: "linear-gradient(135deg, #bae0ff, #69b1ff)",
      textColor: "#002766",
      borderColor: "#69b1ff",
    },
    3: {
      rank: "C",
      completedDays,
      title: "STABLE",
      description: "รักษาเสถียรภาพได้ดี",
      gradient: "linear-gradient(135deg, #d9f7be, #73d13d)",
      textColor: "#092b00",
      borderColor: "#73d13d",
    },
    2: {
      rank: "D",
      completedDays,
      title: "ON TRACK",
      description: "พยายามต่ออีกหน่อย",
      gradient: "linear-gradient(135deg, #fff1b8, #fadb14)",
      textColor: "#613400",
      borderColor: "#fadb14",
    },
    1: {
      rank: "E",
      completedDays,
      title: "WARM UP",
      description: "เริ่มต้นได้แล้ว เดินหน้าต่อ",
      gradient: "linear-gradient(135deg, #ffe7ba, #ffa940)",
      textColor: "#613b11",
      borderColor: "#ffa940",
    },
    0: {
      rank: "F",
      completedDays,
      title: "CRITICAL",
      description: "ยังไม่ครบวันใดเลย ต้องเร่งด่วน",
      gradient: "linear-gradient(135deg, #ff4d4f, #a8071a)",
      textColor: "#fff",
      borderColor: "#a8071a",
    },
  };

  return rankMap[completedDays] ?? rankMap[0];
};

//** แสดงการ์ด Rank เท่ๆ มุมขวา
const RankBadge: React.FC<{ profile: RankProfile }> = ({ profile }) => (
  <div style={{ display: "flex", justifyContent: "flex-end" }}>
    <div
      style={{
        minWidth: 220,
        padding: "16px 22px",
        borderRadius: 18,
        background: profile.gradient,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        boxShadow: "0 20px 38px rgba(0,0,0,0.18)",
        border: `1px solid ${profile.borderColor}`,
      }}
    >
      <Typography.Text
        style={{
          color: profile.textColor,
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: 3,
        }}
      >
        RANK {profile.rank}
      </Typography.Text>
      <Typography.Text
        style={{
          color: profile.textColor,
          fontSize: 12,
          opacity: 0.85,
          textTransform: "uppercase",
        }}
      >
        {profile.title}
      </Typography.Text>
      <Typography.Text
        style={{ color: profile.textColor, fontSize: 11, opacity: 0.75 }}
      >
        {profile.description}
      </Typography.Text>
      <Typography.Text
        style={{
          color: profile.textColor,
          fontSize: 10,
          opacity: 0.7,
          marginTop: 8,
        }}
      >
        ครบ {profile.completedDays} / 5 วัน
      </Typography.Text>
    </div>
  </div>
);

const statusColorMap: Record<string, string> = {
  DONE: "green",
  IN_PROGRESS: "orange",
  REVIEW: "blue",
  CANCELLED: "red",
  DRAFT: "default",
};

export default function Page() {
  const { i18n } = useTranslation("mock");
  const [form] = Form.useForm();

  const authState = useAppSelector((state) => state.callAdminLogin);
  const adminId = useMemo(
    () => Number(authState?.response?.data?.user_data?.admin_id) || undefined,
    [authState?.response?.data?.user_data?.admin_id]
  );

  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [activeRecord, setActiveRecord] = useState<TimesheetEntry | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [confirmText, setConfirmText] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});

  //** ปิด modal และรีเซ็ตค่าที่เกี่ยวข้อง
  const closeModal = useCallback(() => {
    setModalType(null);
    setActiveRecord(null);
    setFormMode("create");
    setConfirmText("");
    form.resetFields();
  }, [form]);

  //** โหลดรายการโปรเจ็กต์หลัก
  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.post("/api/v1/timesheet/project/read/", {
        limit: 100,
        page: 1,
      });
      setProjects(response.data?.data ?? []);
    } catch (error: any) {
      console.error("fetchProjects", error);
      toast.error("โหลดรายการโปรเจคไม่สำเร็จ", {
        duration: 3000,
        position: "top-right",
      });
    }
  }, []);

  //** โหลดรายการโปรเจ็กต์ย่อยตามโปรเจ็กต์ที่เลือก
  const fetchSubProjectOptions = useCallback(async (projectId: number) => {
    if (!projectId) {
      setSubProjects([]);
      return [];
    }

    try {
      const response = await axios.post(
        "/api/v1/timesheet/project/sub-project/read/",
        {
          limit: 100,
          page: 1,
          project_id: Number(projectId),
        }
      );
      const items = response.data?.data?.items ?? [];
      setSubProjects(items);
      return items;
    } catch (error: any) {
      console.error("fetchSubProjectOptions", error);
      toast.error("โหลดรายการโปรเจคย่อยไม่สำเร็จ", {
        duration: 3000,
        position: "top-right",
      });
      setSubProjects([]);
      return [];
    }
  }, []);

  //** โหลดรายการลงเวลาพร้อมแบ่งหน้า
  const fetchEntries = useCallback(async () => {
    setTableLoading(true);
    try {
      const response = await axios.post("/api/v1/timesheet/entry/read/", {
        limit: pageSize,
        page: currentPage,
        user_id: adminId,
      });

      const rawList = response.data?.data ?? [];
      const list = (rawList as TimesheetEntry[]).map((item) => ({
        ...item,
        hours: Number((item as TimesheetEntry).hours ?? 0),
      }));
      setEntries(list);

      const totalPages = response.data?.pagination?.total_pages ?? 1;
      const totalCount = response.data?.pagination?.total_items;
      setTotalItems(totalCount ?? totalPages * PAGE_SIZE);
    } catch (error: any) {
      console.error("fetchEntries", error);
      setEntries([]);
      toast.error("โหลดข้อมูลรายการลงเวลาล้มเหลว", {
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setTableLoading(false);
    }
  }, [adminId, currentPage, pageSize]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  //** เปิดฟอร์มโหมดสร้างใหม่
  const openCreateForm = useCallback(() => {
    setFormMode("create");
    setActiveRecord(null);
    setSubProjects([]);
    form.setFieldsValue({
      project_id: undefined,
      sub_project_id: undefined,
      description: "",
      work_hour: undefined,
      status: undefined,
      date: dayjs(),
    });
    setModalType("form");
  }, [form]);

  //** เปิดฟอร์มโหมดแก้ไข
  const openEditForm = useCallback(
    async (record: TimesheetEntry) => {
      setFormMode("edit");
      setActiveRecord(record);
      await fetchSubProjectOptions(Number(record.project_id));
      form.setFieldsValue({
        project_id: Number(record.project_id),
        sub_project_id: record.feature_id
          ? String(record.feature_id)
          : undefined,
        description: record.description ?? "",
        work_hour: Number(record.hours) || undefined,
        status: record.status,
        date: dayjs(record.date),
      });
      setModalType("form");
    },
    [fetchSubProjectOptions, form]
  );

  //** เปิดฟอร์มโหมดคัดลอกข้อมูล
  const openCopyForm = useCallback(
    async (record: TimesheetEntry) => {
      setFormMode("copy");
      setActiveRecord(null);
      await fetchSubProjectOptions(Number(record.project_id));
      form.setFieldsValue({
        project_id: Number(record.project_id),
        sub_project_id: record.feature_id
          ? String(record.feature_id)
          : undefined,
        description: record.description ?? "",
        work_hour: Number(record.hours) || undefined,
        status: record.status,
        date: dayjs(),
      });
      setModalType("form");
    },
    [fetchSubProjectOptions, form]
  );

  //** แสดงรายละเอียดรายการ
  const openDetailModal = useCallback((record: TimesheetEntry) => {
    setActiveRecord(record);
    setModalType("detail");
  }, []);

  //** แสดง modal ยืนยันการลบ
  const openDeleteModal = useCallback(() => {
    setConfirmText("");
    setModalType("delete");
  }, []);

  //** บันทึกข้อมูลฟอร์มสร้าง/แก้ไข
  const handleSubmitForm = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setActionLoading(true);

      const payload = {
        id: formMode === "edit" ? activeRecord?.id : undefined,
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

      toast.success("บันทึกข้อมูลสำเร็จ", {
        duration: 3000,
        position: "top-right",
      });

      closeModal();
      fetchEntries();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error("handleSubmitForm", error);
      toast.error("บันทึกข้อมูลล้มเหลว", {
        description: error?.message ?? "Unexpected error",
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setActionLoading(false);
    }
  }, [activeRecord?.id, adminId, closeModal, fetchEntries, form, formMode]);

  //** ลบหลายรายการพร้อมกัน
  const handleBulkDelete = useCallback(async () => {
    if (!selectedRowKeys.length) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(
        "/api/v1/timesheet/entry/delete/",
        {
          ids: selectedRowKeys.map((key) => Number(key)),
          by: adminId,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success("ลบรายการสำเร็จ", {
        duration: 3000,
        position: "top-right",
      });

      setSelectedRowKeys([]);
      closeModal();
      fetchEntries();
    } catch (error: any) {
      console.error("handleBulkDelete", error);
      toast.error("ลบรายการล้มเหลว", {
        description: error?.message ?? "Unexpected error",
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setActionLoading(false);
    }
  }, [adminId, closeModal, fetchEntries, selectedRowKeys]);

  //** ตั้งค่าการค้นหาในแต่ละคอลัมน์ของตาราง
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
          <div
            style={{ padding: 12 }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Input
              ref={(node) => {
                searchInputRefs.current[dataIndex] = node;
              }}
              placeholder={`ค้นหา ${title}`}
              value={value}
              onChange={(event) => {
                const { value: inputValue } = event.target;
                setSelectedKeys(inputValue ? [inputValue] : []);
              }}
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="small"
                onClick={() => confirm()}
              >
                ค้นหา
              </Button>
              <Button
                size="small"
                onClick={() => {
                  clearFilters?.();
                  confirm({ closeDropdown: true });
                }}
              >
                รีเซ็ต
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        const raw = record[dataIndex];
        if (raw === undefined || raw === null) {
          return false;
        }

        if (dataIndex === "date") {
          return dayjs(raw).format(DATE_FORMAT).includes(String(value));
        }

        return String(raw).toLowerCase().includes(String(value).toLowerCase());
      },
      filterDropdownProps: {
        onOpenChange: (visible) => {
          if (visible) {
            setTimeout(() => searchInputRefs.current[dataIndex]?.select(), 100);
          }
        },
      },
    }),
    []
  );

  //** สรุปข้อมูลรายวันและรายสัปดาห์ พร้อม Rank
  const dailySummary = useMemo(() => buildDailySummary(entries), [entries]);
  const weeklySummary = useMemo(
    () => buildWeeklySummary(dailySummary),
    [dailySummary]
  );
  const rankProfile = useMemo(
    () => deriveRankProfile(weeklySummary),
    [weeklySummary]
  );

  const columns = useMemo<ColumnsType<TimesheetEntry>>(
    () => [
      {
        title: "วันที่",
        dataIndex: "date",
        width: 140,
        defaultSortOrder: "descend",
        sorter: (a, b) =>
          dayjs(a.date).startOf("day").valueOf() -
          dayjs(b.date).startOf("day").valueOf(),
        render: (value: string) => dayjs(value).format(DATE_FORMAT),
        ...getColumnSearchProps("date", "วันที่"),
      },
      {
        title: "ชื่อโปรเจ็ค",
        dataIndex: "project_name",
        sorter: (a, b) => a.project_name.localeCompare(b.project_name),
        render: (value: string) => value ?? "-",
        ...getColumnSearchProps("project_name", "ชื่อโปรเจ็ค"),
      },
      {
        title: "ชื่อฟีเจอร์",
        dataIndex: "feature_name",
        sorter: (a, b) =>
          (a.feature_name ?? "").localeCompare(b.feature_name ?? ""),
        render: (value: string | null) => value || "-",
        ...getColumnSearchProps("feature_name", "ชื่อฟีเจอร์"),
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        sorter: (a, b) => (a.status ?? "").localeCompare(b.status ?? ""),
        render: (value: string) => {
          const option = STATUS_OPTIONS.find((item) => item.value === value);
          const label = option
            ? i18n.language === "th"
              ? option.label_th
              : option.label_en
            : value;
          const color = statusColorMap[value] ?? "default";
          return <Tag color={color}>{label}</Tag>;
        },
        ...getColumnSearchProps("status", "สถานะ"),
      },
      {
        title: "ชั่วโมง",
        dataIndex: "hours",
        align: "right",
        sorter: (a, b) => Number(a.hours) - Number(b.hours),
        render: (value: number) => (
          <Typography.Text>{Number(value) || 0}</Typography.Text>
        ),
        ...getColumnSearchProps("hours", "ชั่วโมง"),
      },
      {
        title: "คำอธิบาย",
        dataIndex: "description",
        sorter: (a, b) =>
          (a.description ?? "").localeCompare(b.description ?? ""),
        render: (value: string | null) => value || "-",
        ...getColumnSearchProps("description", "คำอธิบาย"),
      },
      {
        title: "จัดการ",
        key: "actions",
        fixed: "right",
        width: 160,
        render: (_value, record) => (
          <Space size="middle">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openDetailModal(record)}
            />
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditForm(record)}
            />
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => openCopyForm(record)}
            />
          </Space>
        ),
      },
    ],
    [
      getColumnSearchProps,
      i18n.language,
      openCopyForm,
      openDetailModal,
      openEditForm,
    ]
  );

  const rowSelection: TableProps<TimesheetEntry>["rowSelection"] = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* การ์ดแสดง Rank ของสัปดาห์นี้ */}
          {rankProfile && <RankBadge profile={rankProfile} />}
          {/* การ์ดสรุปชั่วโมงรายวัน */}
          {weeklySummary.length > 0 && (
            <Card
              title={`สรุปชั่วโมงรายวัน (เป้าหมาย ${DAILY_TARGET_HOURS} ชม./วัน)`}
            >
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >
                {weeklySummary.map((item) => {
                  const percentForBar = Math.min(item.percent, 100);
                  const remainingHours = Math.max(
                    DAILY_TARGET_HOURS - item.totalHours,
                    0
                  );
                  const surplusHours = Math.max(
                    item.totalHours - DAILY_TARGET_HOURS,
                    0
                  );
                  return (
                    <div
                      key={item.dateKey}
                      style={{
                        flex: "1 1 calc(20% - 16px)",
                        minWidth: 200,
                        background: item.isCompleted
                          ? "linear-gradient(135deg, #f6ffed, #ffffff)"
                          : "linear-gradient(135deg, #fff7e6, #ffffff)",
                        borderRadius: 16,
                        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
                        padding: 16,
                        border: "1px solid rgba(226, 232, 240, 0.6)",
                      }}
                    >
                      <Space
                        direction="vertical"
                        style={{ width: "100%" }}
                        size="small"
                      >
                        <Space
                          align="center"
                          style={{
                            width: "100%",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <Typography.Text strong>
                              {item.label}
                            </Typography.Text>
                            <Typography.Paragraph
                              style={{ margin: 0, color: "#7c8da6" }}
                            >
                              {item.displayDate}
                            </Typography.Paragraph>
                          </div>
                          <Tag color={item.isCompleted ? "green" : "orange"}>
                            {item.isCompleted
                              ? "ครบ 8 ชั่วโมง"
                              : "ยังไม่ครบ 8 ชั่วโมง"}
                          </Tag>
                        </Space>
                        {/* แถบความคืบหน้ารายวัน */}
                        <Progress
                          percent={percentForBar}
                          status={item.isCompleted ? "success" : "active"}
                          strokeColor={item.isCompleted ? "#52c41a" : "#1677ff"}
                          format={() => `${item.totalHours.toFixed(2)} ชม.`}
                        />
                        {item.totalHours === 0 && (
                          <Typography.Text type="secondary">
                            ยังไม่มีข้อมูลการลงเวลา
                          </Typography.Text>
                        )}
                        {!item.isCompleted && item.totalHours > 0 && (
                          <Typography.Text type="secondary">
                            ขาดอีก {remainingHours.toFixed(2)} ชั่วโมง เพื่อครบ
                            8 ชั่วโมง
                          </Typography.Text>
                        )}
                        {item.isCompleted &&
                          item.percent > 100 &&
                          surplusHours > 0 && (
                            <Typography.Text type="secondary">
                              เกินเป้าหมาย {surplusHours.toFixed(2)} ชั่วโมง
                            </Typography.Text>
                          )}
                      </Space>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          {/* การ์ดตารางลงเวลา */}
          <Card
            title="การลงเวลาทำงาน"
            extra={
              <Space>
                {/* ปุ่มรีเฟรชข้อมูล */}
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchEntries()}
                  loading={tableLoading}
                >
                  รีเฟรช
                </Button>
                {/* ปุ่มเพิ่มรายการ */}
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openCreateForm}
                >
                  เพิ่มรายการลงเวลา
                </Button>
              </Space>
            }
          >
            <Space style={{ marginBottom: 16 }}>
              {/* ปุ่มลบหลายรายการ */}
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={!selectedRowKeys.length}
                onClick={openDeleteModal}
              >
                ลบที่เลือก ({selectedRowKeys.length})
              </Button>
            </Space>

            <Table<TimesheetEntry>
              bordered
              rowKey={(record) => String(record.id)}
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
                  if (size && size !== pageSize) {
                    setPageSize(size);
                  }
                },
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100, 500, 1000, 5000, 10000],
                showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </Space>

        <CreateModalForm
          open={modalType === "form"}
          onCancel={closeModal}
          onSubmit={handleSubmitForm}
          form={form}
          projects={projects}
          subProject={subProjects}
          fetchSubProjects={(id) => fetchSubProjectOptions(Number(id))}
          i18n={i18n}
          disabled={actionLoading}
        />

        <Modal
          title="รายละเอียดการลงเวลาทำงาน"
          open={modalType === "detail" && !!activeRecord}
          onCancel={closeModal}
          footer={[
            <Button key="close" onClick={closeModal}>
              ปิด
            </Button>,
          ]}
        >
          {activeRecord && (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Typography.Text strong>โปรเจ็ค</Typography.Text>
              <Typography.Text>{activeRecord.project_name}</Typography.Text>

              <Typography.Text strong>ฟีเจอร์</Typography.Text>
              <Typography.Text>
                {activeRecord.feature_name || "-"}
              </Typography.Text>

              <Typography.Text strong>วันที่</Typography.Text>
              <Typography.Text>
                {dayjs(activeRecord.date).format(DATE_FORMAT)}
              </Typography.Text>

              <Typography.Text strong>ชั่วโมง</Typography.Text>
              <Typography.Text>{activeRecord.hours}</Typography.Text>

              <Typography.Text strong>สถานะ</Typography.Text>
              <Tag color={statusColorMap[activeRecord.status] ?? "default"}>
                {(() => {
                  const option = STATUS_OPTIONS.find(
                    (item) => item.value === activeRecord.status
                  );
                  if (!option) {
                    return activeRecord.status;
                  }
                  return i18n.language === "th"
                    ? option.label_th
                    : option.label_en;
                })()}
              </Tag>

              <Typography.Text strong>คำอธิบาย</Typography.Text>
              <Typography.Paragraph>
                {activeRecord.description || "-"}
              </Typography.Paragraph>

              <Typography.Text strong>สร้างเมื่อ</Typography.Text>
              <Typography.Text>
                {activeRecord.created_at
                  ? dayjs(activeRecord.created_at).format("DD/MM/YYYY HH:mm")
                  : "-"}
              </Typography.Text>

              <Typography.Text strong>แก้ไขล่าสุด</Typography.Text>
              <Typography.Text>
                {activeRecord.updated_at
                  ? dayjs(activeRecord.updated_at).format("DD/MM/YYYY HH:mm")
                  : "-"}
              </Typography.Text>
            </Space>
          )}
        </Modal>

        <Modal
          title="ยืนยันการลบ"
          open={modalType === "delete"}
          onCancel={closeModal}
          footer={[
            <Button key="cancel" onClick={closeModal}>
              ยกเลิก
            </Button>,
            <Button
              key="delete"
              danger
              type="primary"
              icon={<DeleteOutlined />}
              disabled={confirmText !== "Delete" || !selectedRowKeys.length}
              loading={actionLoading}
              onClick={handleBulkDelete}
            >
              ลบ
            </Button>,
          ]}
        >
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Text type="danger" strong>
              พิมพ์คำว่า Delete เพื่อยืนยันการลบ {selectedRowKeys.length} รายการ
            </Typography.Text>
            <Input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="พิมพ์ Delete เพื่อยืนยัน"
            />
          </Space>
        </Modal>
      </DashboardLayout>
    </PermissionLayout>
  );
}
