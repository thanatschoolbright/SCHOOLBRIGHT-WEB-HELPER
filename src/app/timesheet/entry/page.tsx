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
  Avatar,
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
  theme,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { InputRef } from "antd";
import type { TableProps } from "antd";
import {
  ArrowUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import axios from "axios";
import { toast } from "sonner";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import type { Project, SubProject } from "@stores/type";
import { CreateModalForm } from "./create";
import { MonthlyRankBoard } from "./monthly-rank-board";

dayjs.extend(isBetween);

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

type TopUsage = {
  name: string;
  hours: number;
};

const DATE_FORMAT = "DD/MM/YYYY";
const PAGE_SIZE = 30;
const DAILY_TARGET_HOURS = 8;
const WEEKDAY_LABELS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"];

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

//** คำนวณโปรเจ็ค/ฟีเจอร์ที่ใช้เวลามากที่สุดในสัปดาห์ปัจจุบัน
const aggregateTopUsage = (
  entries: TimesheetEntry[],
  key: "project_name" | "feature_name"
): TopUsage | null => {
  if (!entries.length) return null;

  const totals = entries.reduce<Map<string, number>>((map, entry) => {
    const label = (entry[key] ?? "ไม่ระบุ") as string;
    const hours = Number(entry.hours ?? 0);
    if (!hours) return map;
    map.set(label, (map.get(label) ?? 0) + hours);
    return map;
  }, new Map());

  if (!totals.size) return null;

  const [name, hours] = Array.from(totals.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return { name, hours: Number(hours.toFixed(2)) };
};

//** การ์ดสรุปการใช้งานสูงสุดประจำสัปดาห์ (Minimal / Ant Design theme)
const MiniUsageCard: React.FC<{
  title: string;
  highlight: string;
  hours: number;
  accent: string;
}> = ({ title, highlight, hours, accent }) => {
  const { token } = theme.useToken();

  return (
    <Card
      variant="outlined"
      style={{
        minWidth: 240,
        borderRadius: 12,
        borderColor: token.colorBorderSecondary,
        background: token.colorBgContainer,
        boxShadow: 'none',
        borderLeft: `4px solid ${accent}`,
      }}
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: 16,
        },
      }}
    >
      <Space
        align="start"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Typography.Text
          style={{
            fontSize: 12,
            letterSpacing: 0.5,
            fontWeight: 600,
            color: token.colorTextSecondary,
            textTransform: "uppercase",
          }}
        >
          {title}
        </Typography.Text>
        <Avatar
          size={36}
          style={{
            background: token.colorFillTertiary,
            color: token.colorTextSecondary,
            fontWeight: 700,
          }}
        >
          {highlight?.charAt(0)?.toUpperCase() || "∞"}
        </Avatar>
      </Space>

      <Typography.Title
        level={4}
        style={{
          margin: 0,
          fontWeight: 700,
          color: token.colorText,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={highlight}
      >
        {highlight || "-"}
      </Typography.Title>

      <Space size={6} align="center">
        <ArrowUpOutlined style={{ color: accent }} />
        <Typography.Text style={{ color: token.colorText, fontWeight: 600 }}>
          {hours.toFixed(2)} ชม.
        </Typography.Text>
        <Typography.Text style={{ color: token.colorTextSecondary }}>
          ในสัปดาห์นี้
        </Typography.Text>
      </Space>
    </Card>
  );
};

const addAlpha = (color: string, alpha: number) => {
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const num = Number.parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (color.startsWith("rgb")) {
    const values = color
      .replace(/rgba?\(|\)|\s/g, "")
      .split(",")
      .slice(0, 3)
      .join(",");
    return `rgba(${values}, ${alpha})`;
  }

  return color;
};

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
  const { token } = theme.useToken();
  const isMountedRef = useRef(true);

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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      if (!isMountedRef.current) return;
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
      if (isMountedRef.current) {
        setSubProjects(items);
      }
      return items;
    } catch (error: any) {
      console.error("fetchSubProjectOptions", error);
      toast.error("โหลดรายการโปรเจคย่อยไม่สำเร็จ", {
        duration: 3000,
        position: "top-right",
      });
      if (isMountedRef.current) {
        setSubProjects([]);
      }
      return [];
    }
  }, []);

  //** โหลดรายการลงเวลาพร้อมแบ่งหน้า
  const fetchEntries = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }
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
      if (!isMountedRef.current) {
        return;
      }

      setEntries(list);

      const totalPages = response.data?.pagination?.total_pages ?? 1;
      const totalCount = response.data?.pagination?.total_items;
      setTotalItems(totalCount ?? totalPages * PAGE_SIZE);
    } catch (error: any) {
      console.error("fetchEntries", error);
      if (isMountedRef.current) {
        setEntries([]);
      }
      toast.error("โหลดข้อมูลรายการลงเวลาล้มเหลว", {
        duration: 3000,
        position: "top-right",
      });
    } finally {
      if (isMountedRef.current) {
        setTableLoading(false);
      }
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
      if (!isMountedRef.current) {
        return;
      }
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
      if (!isMountedRef.current) {
        return;
      }
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

      if (!isMountedRef.current) {
        return;
      }
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
      if (isMountedRef.current) {
        setActionLoading(false);
      }
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

      if (isMountedRef.current) {
        setSelectedRowKeys([]);
        closeModal();
        fetchEntries();
      }
    } catch (error: any) {
      console.error("handleBulkDelete", error);
      toast.error("ลบรายการล้มเหลว", {
        description: error?.message ?? "Unexpected error",
        duration: 3000,
        position: "top-right",
      });
    } finally {
      if (isMountedRef.current) {
        setActionLoading(false);
      }
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
  const weeklyFocusEntries = useMemo(() => {
    const start = dayjs().startOf("week");
    const end = dayjs().endOf("week");
    return entries.filter((entry) => {
      const entryDate = dayjs(entry.date);
      return entryDate.isBetween(start, end, "day", "[]");
    });
  }, [entries]);

  const topProjectUsage = useMemo(
    () => aggregateTopUsage(weeklyFocusEntries, "project_name"),
    [weeklyFocusEntries]
  );

  const topFeatureUsage = useMemo(
    () => aggregateTopUsage(weeklyFocusEntries, "feature_name"),
    [weeklyFocusEntries]
  );

  const today = dayjs();

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
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <MonthlyRankBoard currentAdminId={adminId} variant="wide" />
            {topProjectUsage && (
              <MiniUsageCard
                title="โปรเจ็คที่ใช้เวลามากที่สุด"
                highlight={topProjectUsage.name}
                hours={topProjectUsage.hours}
                accent="#38bdf8"
              />
            )}
            {topFeatureUsage && (
              <MiniUsageCard
                title="ฟีเจอร์ที่ใช้เวลามากที่สุด"
                highlight={topFeatureUsage.name}
                hours={topFeatureUsage.hours}
                accent="#fb7185"
              />
            )}
          </div>
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

                  const dayDate = dayjs(item.dateKey);
                  const isFutureDay = dayDate.isAfter(today, "day");
                  const isCompleteDay = item.isCompleted;
                  const neutralAccent = token.colorBorderSecondary ?? "#94a3b8";
                  const successAccent = token.colorSuccess ?? "#22c55e";
                  const errorAccent = token.colorError ?? "#ef4444";
                  const accentBase = isFutureDay
                    ? neutralAccent
                    : isCompleteDay
                    ? successAccent
                    : errorAccent;
                  const containerBg =
                    token.colorBgElevated ?? token.colorBgContainer;
                  const cardBackground = `linear-gradient(135deg, ${addAlpha(
                    accentBase,
                    isFutureDay ? 0.06 : 0.12
                  )}, ${containerBg})`;
                  const cardBorder = `1px solid ${addAlpha(accentBase, 0.35)}`;
                  const tagColor = isFutureDay
                    ? undefined
                    : isCompleteDay
                    ? "success"
                    : "error";
                  const tagLabel = isFutureDay
                    ? "ยังไม่ถึงกำหนด"
                    : isCompleteDay
                    ? "ครบ 8 ชั่วโมง"
                    : "ยังไม่ครบ 8 ชั่วโมง";
                  const progressStatus = isFutureDay
                    ? "normal"
                    : isCompleteDay
                    ? "success"
                    : "exception";
                  const progressColor = accentBase;
                  const subtitleColor = token.colorTextSecondary;

                  return (
                    <div
                      key={item.dateKey}
                      style={{
                        flex: "1 1 calc(20% - 16px)",
                        minWidth: 200,
                        background: cardBackground,
                        borderRadius: 16,
                        boxShadow: `0 12px 24px ${addAlpha(accentBase, 0.12)}`,
                        padding: 16,
                        border: cardBorder,
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
                              style={{ margin: 0, color: subtitleColor }}
                            >
                              {item.displayDate}
                            </Typography.Paragraph>
                          </div>
                          {tagColor ? (
                            <Tag color={tagColor}>{tagLabel}</Tag>
                          ) : (
                            <Tag>{tagLabel}</Tag>
                          )}
                        </Space>
                        {/* แถบความคืบหน้ารายวัน */}
                        <Progress
                          percent={percentForBar}
                          status={progressStatus}
                          strokeColor={progressColor}
                          trailColor={addAlpha(neutralAccent, 0.2)}
                          format={() => `${item.totalHours.toFixed(2)} ชม.`}
                        />
                        {item.totalHours === 0 && !isFutureDay && (
                          <Typography.Text type="secondary">
                            ยังไม่มีข้อมูลการลงเวลา
                          </Typography.Text>
                        )}
                        {!isFutureDay &&
                          !isCompleteDay &&
                          item.totalHours > 0 && (
                            <Typography.Text type="secondary">
                              ขาดอีก {remainingHours.toFixed(2)} ชั่วโมง
                              เพื่อครบ 8 ชั่วโมง
                            </Typography.Text>
                          )}
                        {isFutureDay && (
                          <Typography.Text type="secondary">
                            วันทำงานนี้ยังไม่ถึงกำหนด
                          </Typography.Text>
                        )}
                        {isCompleteDay &&
                          item.percent > 100 &&
                          surplusHours > 0 && (
                            <Typography.Text type="secondary">
                              <span
                                role="img"
                                aria-label="over-achieved"
                                style={{ marginRight: 4 }}
                              >
                                🔥
                              </span>
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
