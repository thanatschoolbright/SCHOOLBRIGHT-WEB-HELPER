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
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Dropdown,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { InputRef } from "antd";
import type { MenuProps, TableProps } from "antd";
import {
  BarChartOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  ApartmentOutlined,
  PieChartOutlined,
  ProjectOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { convertToThaiDateDDMMYYY } from "@helpers/convert-time-zone-to-thai";
import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import { getUserData } from "@/helpers/local_storage/user.storage";
import type {
  Project,
  SubProject,
  WorkEntryForm,
  UserProfile,
} from "@/stores/type";
import { GraphTimesheetModal } from "@/components/modal/graph-timesheet-modal-component";
import { PieTimesheetModal } from "@/components/modal/pie-timesheet-modal-component";
import { utils, writeFile } from "xlsx";
import type { TimesheetMode } from "@/components/modal/graph-timesheet-modal-component";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
type SearchableColumnKey =
  | "date"
  | "project_name"
  | "feature_name"
  | "created_by"
  | "status"
  | "hours"
  | "description";

type TableColumn = ColumnType<any> & { key: string };

const PAGE_SIZE = 10;

const getStatusColor = (status: string) => {
  switch (status) {
    case "DONE":
      return "green";
    case "IN_PROGRESS":
      return "orange";
    case "REVIEW":
      return "blue";
    case "CANCELLED":
      return "red";
    default:
      return "default";
  }
};

const getHourTagColor = (hours: number) => {
  if (hours >= 8) return "red";
  if (hours < 4) return "green";
  return "gold";
};

const formatTimestamp = (value?: string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-";

const useColumnSearch = (
  searchInputRefs: React.MutableRefObject<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >
) =>
  useCallback(
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
        if (!raw) return false;
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
    [searchInputRefs]
  );

export default function Page() {
  const { i18n } = useTranslation("mock");
  const [form] = Form.useForm();
  const router = useRouter();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportingTemplate, setExportingTemplate] = useState(false);
  const [exportForm] = Form.useForm();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [entries, setEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [graphMode, setGraphMode] = useState<TimesheetMode>("week");
  const [pieMode, setPieMode] = useState<TimesheetMode>("week");
  const [modalKey, setModalKey] = useState<"" | "graph" | "pie" | "detail">("");
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const selectedProjectId = Form.useWatch("project_id", exportForm);

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        label: `${project.name ?? "ไม่ระบุ"} (รหัส ${project.id})`,
        value: project.id,
      })),
    [projects]
  );

  const subProjectOptions = useMemo(() => {
    const targetProjectId = selectedProjectId
      ? Number(selectedProjectId)
      : undefined;
    const scopedSubProjects = targetProjectId
      ? subProjects.filter(
          (item) => Number(item.project_id) === Number(targetProjectId)
        )
      : subProjects;

    return scopedSubProjects.map((subProject) => ({
      label: `${subProject.name ?? "ไม่ระบุ"} (รหัส ${subProject.id})`,
      value: String(subProject.id),
    }));
  }, [selectedProjectId, subProjects]);

  const userOptions = useMemo(
    () =>
      users.map((user) => {
        const fullname = `${user.firstname ?? ""} ${
          user.lastname ?? ""
        }`.trim();
        const displayName = fullname || user.name || user.email;
        const code = user.employee_code ? ` • รหัส ${user.employee_code}` : "";
        return {
          label: `${displayName}${code}`,
          value: String(user.admin_id ?? user.id ?? ""),
        };
      }),
    [users]
  );

  const searchInputRefs = useRef<
    Partial<Record<SearchableColumnKey, InputRef | null>>
  >({});
  const getColumnSearchProps = useColumnSearch(searchInputRefs);

  const rowSelection: TableRowSelection<any> = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({ disabled: !!record.children }),
  };

  const statusLabelMap = useMemo(() => {
    return STATUS_OPTIONS.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] =
        i18n.language === "th" ? option.label_th : option.label_en;
      return acc;
    }, {});
  }, [i18n.language]);

  const getUserById = useCallback(
    (id: string | number) =>
      users.find((user) => String(user.admin_id) === String(id)),
    [users]
  );

  const timeModeItems = useMemo<MenuProps["items"]>(
    () => [
      { key: "today", label: "วันนี้" },
      { key: "week", label: "สัปดาห์นี้" },
      { key: "month", label: "เดือนนี้" },
      { key: "year", label: "ปีนี้" },
    ],
    []
  );

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const toastId = toast.loading("กำลังโหลดโปรเจ็กต์...");
    try {
      const response = await axios.post(
        "/api/v1/timesheet/project/read/",
        { limit: 50, page: currentPage },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = response.data;
      setProjects(data.data ?? []);
      toast.success("โหลดโปรเจ็กต์สำเร็จ", { id: toastId });
    } catch (error: any) {
      setProjects([]);
      toast.error(error?.message ?? "ไม่สามารถโหลดโปรเจ็กต์ได้", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const toastId = toast.loading("กำลังโหลดข้อมูลลงเวลา...");
    try {
      const response = await axios.post("/api/v1/timesheet/entry/read/", {
        limit: pageSize,
        page: currentPage,
      });
      const rawEntries = response.data?.data ?? [];
      setEntries(rawEntries);
      setTotalItems(response.data?.pagination?.total ?? 0);
      setPageSize(response.data?.pagination?.page_size ?? pageSize);
      toast.success("โหลดข้อมูลสำเร็จ", { id: toastId });
    } catch (error: any) {
      setEntries([]);
      toast.error(error?.message ?? "ไม่สามารถโหลดข้อมูลลงเวลาได้", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const fetchSubProjectsByProject = useCallback(async (projectId: number) => {
    const toastId = toast.loading("กำลังโหลดโครงการย่อย...");
    try {
      const response = await axios.post(
        "/api/v1/timesheet/project/sub-project/read/",
        {
          limit: 200,
          page: 1,
          project_id: Number(projectId),
        }
      );
      const items = response.data?.data?.items ?? [];
      setSubProjects(items);
      toast.success("โหลดโครงการย่อยสำเร็จ", { id: toastId });
    } catch (error: any) {
      setSubProjects([]);
      toast.error(error?.message ?? "ไม่สามารถโหลดโครงการย่อยได้", {
        id: toastId,
      });
    }
  }, []);

  useEffect(() => {
    const allUsers = getUserData();
    if (allUsers) {
      setUsers(allUsers);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchProjects();
  }, [fetchEntries, fetchProjects]);

  useEffect(() => {
    if (!exportModalVisible) {
      setSubProjects([]);
      return;
    }

    if (selectedProjectId) {
      setSubProjects([]);
      fetchSubProjectsByProject(Number(selectedProjectId));
      return;
    }

    setSubProjects([]);
  }, [exportModalVisible, selectedProjectId, fetchSubProjectsByProject]);

  useEffect(() => {
    if (exportModalVisible) {
      exportForm.setFieldsValue({
        date_range: [dayjs().startOf("month"), dayjs()],
        project_id: undefined,
        sub_project_id: undefined,
        created_by: undefined,
        investment: undefined,
      });
    }
  }, [exportModalVisible, exportForm]);

  const handleExportTemplate = useCallback(async () => {
    const pollIntervalMs = 1500;
    const maxAttempts = 120; // roughly 3 minutes
    let toastId: string | number | undefined;

    try {
      const values = await exportForm.validateFields();
      setExportingTemplate(true);
      const investmentValue = Number(values.investment);
      if (!Number.isFinite(investmentValue) || investmentValue <= 0) {
        throw new Error("งบการลงทุนต้องเป็นตัวเลขมากกว่า 0");
      }

      toastId = toast.loading("กำลังจัดเตรียมคำขอส่งออก...");

      const response = await fetch("/api/v1/timesheet/excel/template_1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: values.date_range[0].format("YYYY-MM-DD"),
          end_date: values.date_range[1].format("YYYY-MM-DD"),
          project_id: values.project_id || "",
          sub_project_id: values.sub_project_id || "",
          created_by: values.created_by || "",
          investment: investmentValue,
        }),
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถส่งออกไฟล์ได้");
      }

      if (response.status === 202) {
        const payload = await response.json();
        const statusUrl = payload.statusUrl as string;
        const downloadUrl = payload.downloadUrl as string;
        if (!statusUrl || !downloadUrl) {
          throw new Error("ระบบไม่ได้ส่งข้อมูลสถานะการดาวน์โหลดกลับมา");
        }

        const seenSteps = new Set<string>();
        let attempts = 0;
        while (attempts < maxAttempts) {
          attempts += 1;
          const statusResponse = await fetch(statusUrl, { cache: "no-store" });
          if (!statusResponse.ok) {
            const statusError = await statusResponse
              .json()
              .catch(() => ({} as any));
            throw new Error(
              statusError?.message_th ||
                statusError?.message_en ||
                "ส่งออกไฟล์ไม่สำเร็จ"
            );
          }

          const statusData = await statusResponse.json();

          const steps = Array.isArray(statusData.steps) ? statusData.steps : [];
          if (steps.length) {
            const latestStep = steps[steps.length - 1];
            if (latestStep?.key && !seenSteps.has(latestStep.key)) {
              seenSteps.add(latestStep.key);
              toast.loading(latestStep.label ?? "กำลังดำเนินการ...", {
                id: toastId,
              });
            }
          }

          if (statusData.status === "ready") {
            toast.loading("ไฟล์พร้อมแล้ว กำลังเตรียมดาวน์โหลด...", {
              id: toastId,
            });

            const downloadResponse = await fetch(downloadUrl, {
              cache: "no-store",
            });

            if (!downloadResponse.ok) {
              const downloadError = await downloadResponse
                .json()
                .catch(() => ({} as any));
              throw new Error(
                downloadError?.message_th ||
                  downloadError?.message_en ||
                  "ไม่สามารถดาวน์โหลดไฟล์ได้"
              );
            }

            const blob = await downloadResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            const start = values.date_range[0].format("YYYYMMDD");
            const end = values.date_range[1].format("YYYYMMDD");
            link.href = url;
            link.download = `timesheet-export_${start}_${end}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("ส่งออกไฟล์เรียบร้อย", { id: toastId });
            setExportModalVisible(false);
            exportForm.resetFields();
            return;
          }

          if (statusData.status === "failed") {
            throw new Error(statusData.error || "ไม่สามารถสร้างไฟล์ได้");
          }

          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }

        throw new Error(
          "ส่งออกไฟล์ใช้เวลานานกว่าที่กำหนด กรุณาลองใหม่อีกครั้ง"
        );
      }

      // Fallback: immediate binary response (legacy behaviour)
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const start = values.date_range[0].format("YYYYMMDD");
      const end = values.date_range[1].format("YYYYMMDD");
      link.href = url;
      link.download = `timesheet-export_${start}_${end}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("ส่งออกไฟล์เรียบร้อย", { id: toastId });
      setExportModalVisible(false);
      exportForm.resetFields();
    } catch (error: any) {
      const message = error?.message || "ส่งออกไฟล์ไม่สำเร็จ";
      if (toastId !== undefined) {
        toast.error(message, { id: toastId });
      } else {
        toast.error(message);
      }
    } finally {
      setExportingTemplate(false);
    }
  }, [exportForm, setExportModalVisible]);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    const toastId = toast.loading("กำลังส่งออกข้อมูล...");
    try {
      const response = await axios.post("/api/v1/timesheet/entry/read/", {
        limit: 10000,
        page: 1,
      });

      const allEntries = response.data?.data ?? [];
      if (!allEntries.length) {
        toast.info("ไม่มีข้อมูลสำหรับส่งออก", { id: toastId });
        return;
      }

      const dataset = allEntries.map((entry: any) => {
        const user = getUserById(entry.created_by);
        return {
          วันที่: entry.date ? dayjs(entry.date).format("DD/MM/YYYY") : "-",
          ชื่อโปรเจ็ค: entry.project_name ?? "-",
          ชื่อฟีเจอร์: entry.feature_name ?? "-",
          ชื่อผู้จัดทำ: user
            ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() || "-"
            : "-",
          สถานะ: statusLabelMap[entry.status] ?? entry.status ?? "-",
          ชั่วโมง: Number(entry.hours ?? 0),
          คำอธิบาย: entry.description ?? "-",
        };
      });

      const worksheet = utils.json_to_sheet(dataset);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Timesheet");
      const filename = `timesheet-report-${dayjs().format(
        "YYYYMMDD-HHmmss"
      )}.xlsx`;
      writeFile(workbook, filename);

      toast.success("ส่งออกข้อมูลสำเร็จ", { id: toastId });
    } catch (error: any) {
      toast.error(error?.message ?? "ส่งออกข้อมูลล้มเหลว", { id: toastId });
    } finally {
      setExporting(false);
    }
  }, [getUserById, statusLabelMap]);

  const columns = useMemo<ColumnsType<any>>(
    () => [
      {
        title: "วันที่",
        dataIndex: "date",
        sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
        ...getColumnSearchProps("date", "วันที่"),
      },
      {
        title: "ชื่อโปรเจ็ค",
        dataIndex: "project_name",
        sorter: (a, b) =>
          String(a.project_name).localeCompare(String(b.project_name)),
        filters: projects.map((project) => ({
          text: project.name,
          value: project.name,
        })),
        onFilter: (value, record) => record.project_name === value,
        ...getColumnSearchProps("project_name", "ชื่อโปรเจ็ค"),
      },
      {
        title: "ชื่อฟีเจอร์",
        dataIndex: "feature_name",
        sorter: (a, b) =>
          String(a.feature_name || "").localeCompare(
            String(b.feature_name || "")
          ),
        ...getColumnSearchProps("feature_name", "ชื่อฟีเจอร์"),
      },
      {
        title: "ชื่อผู้จัดทำ",
        dataIndex: "created_by",
        sorter: (a, b) =>
          String(a.created_by).localeCompare(String(b.created_by)),
        render: (value: string) => {
          const user = getUserById(value);
          return user
            ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim()
            : "-";
        },
        ...getColumnSearchProps("created_by", "ชื่อผู้จัดทำ"),
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        filters: STATUS_OPTIONS.map((option) => ({
          text: i18n.language === "th" ? option.label_th : option.label_en,
          value: option.value,
        })),
        onFilter: (value, record) => record.status === value,
        sorter: (a, b) => String(a.status).localeCompare(String(b.status)),
        render: (status: string) => (
          <Tag color={getStatusColor(status)}>
            {statusLabelMap[status] ?? status}
          </Tag>
        ),
        ...getColumnSearchProps("status", "สถานะ"),
      },
      {
        title: "ชั่วโมง",
        dataIndex: "hours",
        sorter: (a, b) => Number(a.hours) - Number(b.hours),
        render: (hours: number) => (
          <Tag color={getHourTagColor(hours)}>{hours}</Tag>
        ),
        ...getColumnSearchProps("hours", "ชั่วโมง"),
      },
      {
        title: "คำอธิบาย",
        dataIndex: "description",
        sorter: (a, b) =>
          String(a.description || "").localeCompare(
            String(b.description || "")
          ),
        ellipsis: true,
        ...getColumnSearchProps("description", "คำอธิบาย"),
      },
      {
        title: "จัดการ",
        key: "actions",
        fixed: "right",
        render: (_value, record) => (
          <Space>
            <Tooltip title="ดูรายละเอียด">
              <Button
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => {
                  setDetailRecord(record);
                  setModalKey("detail");
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [getColumnSearchProps, getUserById, i18n.language, projects, statusLabelMap]
  );

  const selectedUsersMap = useMemo(() => {
    const map = new Map();
    users.forEach((user) => {
      map.set(String(user.admin_id), user);
    });
    return map;
  }, [users]);

  const detailModalContent = useMemo(() => {
    if (!detailRecord) {
      return null;
    }

    const user = selectedUsersMap.get(String(detailRecord.created_by));
    const userName = user
      ? [user.firstname, user.lastname].filter(Boolean).join(" ") || "-"
      : "-";

    const detailItems = [
      {
        key: "description",
        label: "รายละเอียดคำอธิบาย",
        value: (
          <Typography.Paragraph className="timesheet-detail-description">
            {detailRecord.description ?? "-"}
          </Typography.Paragraph>
        ),
      },
      {
        key: "project",
        label: "โปรเจ็ค",
        value: detailRecord.project_name ?? "-",
      },
      {
        key: "feature",
        label: "ฟีเจอร์",
        value: detailRecord.feature_name ?? "-",
      },
      {
        key: "owner",
        label: "ผู้จัดทำ",
        value: userName,
      },
      {
        key: "status",
        label: "สถานะ",
        value: (
          <Tag color={getStatusColor(detailRecord.status)}>
            {statusLabelMap[detailRecord.status] ?? detailRecord.status}
          </Tag>
        ),
      },
      {
        key: "hours",
        label: "จำนวนชั่วโมง",
        value: (
          <Tag color={getHourTagColor(Number(detailRecord.hours))}>
            {detailRecord.hours}
          </Tag>
        ),
      },
      {
        key: "created",
        label: "สร้างเมื่อ",
        value: formatTimestamp(detailRecord.created_at),
      },
      {
        key: "updated",
        label: "แก้ไขล่าสุด",
        value: formatTimestamp(detailRecord.updated_at),
      },
    ];

    return (
      <>
        <Card variant="borderless" className="timesheet-detail-card">
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Typography.Title level={4} className="timesheet-detail-title">
              สรุปรายการลงเวลา
            </Typography.Title>
            <Typography.Text type="secondary">
              อัปเดตล่าสุด{" "}
              {formatTimestamp(
                detailRecord.updated_at || detailRecord.created_at
              )}
            </Typography.Text>
          </Space>
          <Divider className="timesheet-detail-divider" dashed />
          <Descriptions
            column={1}
            colon={false}
            labelStyle={{ width: 160, fontWeight: 600, color: "#0f172a" }}
            contentStyle={{ color: "#1d2939" }}
          >
            {detailItems.map(({ key, label, value }) => (
              <Descriptions.Item key={key} label={label}>
                {value}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Card>
        <style jsx>{`
          .timesheet-detail-card {
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 16px;
            box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
            position: relative;
            overflow: hidden;
          }

          .timesheet-detail-card::before {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 0;
            background: repeating-linear-gradient(
              0deg,
              rgba(15, 23, 42, 0.04) 0,
              rgba(15, 23, 42, 0.04) 1px,
              transparent 1px,
              transparent 32px
            );
            pointer-events: none;
          }

          .timesheet-detail-card .ant-card-body {
            position: relative;
            z-index: 1;
          }

          .timesheet-detail-title {
            margin-bottom: 0;
            letter-spacing: 0.5px;
          }

          .timesheet-detail-divider {
            margin: 12px 0 24px;
          }

          .timesheet-detail-description {
            margin-bottom: 0;
            white-space: pre-line;
          }
        `}</style>
      </>
    );
  }, [detailRecord, selectedUsersMap, statusLabelMap]);

  const handleTimeModeSelect =
    (setter: (mode: TimesheetMode) => void): MenuProps["onClick"] =>
    ({ key }) => {
      setter(key as TimesheetMode);
      setModalKey(setter === setGraphMode ? "graph" : "pie");
    };

  return (
    <PermissionLayout role={["ADMIN"]}>
      <DashboardLayout>
        <GraphTimesheetModal
          open={modalKey === "graph"}
          onClose={() => setModalKey("")}
          data={entries}
          mode={graphMode}
        />
        <PieTimesheetModal
          open={modalKey === "pie"}
          onClose={() => setModalKey("")}
          data={entries}
          mode={pieMode}
        />

        <Modal
          title={null}
          open={modalKey === "detail"}
          onCancel={() => setModalKey("")}
          footer={null}
          width={680}
          centered
          className="timesheet-detail-modal"
        >
          {detailModalContent}
        </Modal>

        <style jsx global>{`
          .timesheet-detail-modal .ant-modal-content {
            border-radius: 20px;
            padding: 24px;
            background: #f5f7fa;
            box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
          }

          .timesheet-detail-modal .ant-modal-body {
            padding: 0;
          }
        `}</style>

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Card
              bordered
              size="small"
              style={{
                borderRadius: 12,
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              }}
              bodyStyle={{
                padding: "12px 16px",
                display: "inline-flex",
              }}
            >
              <Space size="small" wrap>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "report-who-not-entry",
                        label: "รายงานการไม่กรอกไทม์ชีทวันนี้",
                        onClick: () =>
                          router.push("/timesheet/all/who-not-entry"),
                      },
                      {
                        key: "report-summary",
                        label: "รายงานการกรอกไทม์ชีท ทั้งอาทิตย์",
                        onClick: () => router.push("/timesheet/all/summary"),
                      },
                      {
                        key: "report-summary",
                        label: "รายงานการกรอกไทม์ชีท ทั้งเดือน (จัดแรงก์)",
                        onClick: () =>
                          router.push("/timesheet/all/summary-month"),
                      },
                    ],
                  }}
                >
                  <Button type="default" size="middle">
                    เลือกดูรายงาน Timesheet
                  </Button>
                </Dropdown>
                <Dropdown
                  menu={{
                    items: timeModeItems,
                    onClick: handleTimeModeSelect(setGraphMode),
                  }}
                >
                  <Button
                    type="default"
                    size="middle"
                    icon={<BarChartOutlined />}
                  >
                    กราฟแท่ง
                  </Button>
                </Dropdown>
                <Dropdown
                  menu={{
                    items: timeModeItems,
                    onClick: handleTimeModeSelect(setPieMode),
                  }}
                >
                  <Button
                    type="default"
                    size="middle"
                    icon={<PieChartOutlined />}
                  >
                    กราฟวงกลม
                  </Button>
                </Dropdown>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "export-template",
                        label: "Template Timesheet",
                        onClick: () => setExportModalVisible(true),
                      },
                    ],
                  }}
                >
                  <Button
                    type="primary"
                    size="middle"
                    icon={<ExportOutlined />}
                    loading={exporting || exportingTemplate}
                  >
                    ส่งออกข้อมูล
                  </Button>
                </Dropdown>
              </Space>
            </Card>
          </div>

          <Card title="การจัดการลงเวลาทำงาน">
            <Table
              bordered
              dataSource={entries}
              loading={loading}
              columns={columns}
              rowSelection={rowSelection}
              rowKey={(record) => record.id ?? record.date}
              pagination={{
                current: currentPage,
                pageSize,
                total: totalItems,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],
                onChange: (page, size) => {
                  setCurrentPage(page);
                  if (size) {
                    setPageSize(size);
                  }
                },
              }}
              scroll={{ x: 1400 }}
            />
          </Card>
          <Modal
            open={exportModalVisible}
            onCancel={() => setExportModalVisible(false)}
            title="ส่งออก Timesheet (Template)"
            footer={null}
          >
            <Form form={exportForm} layout="vertical">
              <Form.Item
                label="ช่วงวันที่"
                name="date_range"
                rules={[{ required: true, message: "กรุณาเลือกช่วงวันที่" }]}
              >
                <DatePicker.RangePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                />
              </Form.Item>
              <Form.Item
                label="งบการลงทุนรวม (บาท)"
                name="investment"
                rules={[
                  { required: true, message: "กรุณาระบุงบการลงทุน" },
                  {
                    validator: (_rule, value) => {
                      if (value === undefined || value === null) {
                        return Promise.reject("กรุณาระบุงบการลงทุน");
                      }
                      if (value <= 0) {
                        return Promise.reject("งบการลงทุนต้องมากกว่า 0");
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0.01}
                  step={0.01}
                  precision={2}
                  placeholder="ระบุจำนวนเงินรวมที่ต้องการจัดสรร"
                />
              </Form.Item>
              <Form.Item label="โครงการหลัก" name="project_id">
                <Select
                  allowClear
                  showSearch
                  placeholder="เลือกโครงการหลัก (ไม่บังคับ)"
                  options={projectOptions}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={() =>
                    exportForm.setFieldsValue({ sub_project_id: undefined })
                  }
                  suffixIcon={<ProjectOutlined />}
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>
              <Form.Item label="โครงการย่อย" name="sub_project_id">
                <Select
                  allowClear
                  showSearch
                  placeholder="เลือกโครงการย่อย (ไม่บังคับ)"
                  options={subProjectOptions}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  suffixIcon={<ApartmentOutlined />}
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>
              <Form.Item label="ผู้จัดทำ" name="created_by">
                <Select
                  allowClear
                  showSearch
                  placeholder="เลือกผู้จัดทำ (ไม่บังคับ)"
                  options={userOptions}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  suffixIcon={<UserOutlined />}
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button onClick={() => setExportModalVisible(false)}>
                  ยกเลิก
                </Button>
                <Button
                  type="primary"
                  loading={exportingTemplate}
                  onClick={handleExportTemplate}
                >
                  ส่งออก
                </Button>
              </Space>
            </Form>
          </Modal>
        </Space>
      </DashboardLayout>
    </PermissionLayout>
  );
}
