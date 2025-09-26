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
  Form,
  Input,
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
  PieChartOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [entries, setEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [graphMode, setGraphMode] = useState<TimesheetMode>("week");
  const [pieMode, setPieMode] = useState<TimesheetMode>("week");
  const [modalKey, setModalKey] = useState<"" | "graph" | "pie" | "detail">("");
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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
    return (
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Typography.Text strong>รายละเอียดคำอธิบาย</Typography.Text>
        <Typography.Paragraph>
          {detailRecord.description ?? "-"}
        </Typography.Paragraph>
        <Typography.Text strong>โปรเจ็ค</Typography.Text>
        <Typography.Text>{detailRecord.project_name}</Typography.Text>
        <Typography.Text strong>ฟีเจอร์</Typography.Text>
        <Typography.Text>{detailRecord.feature_name ?? "-"}</Typography.Text>
        <Typography.Text strong>ผู้จัดทำ</Typography.Text>
        <Typography.Text>
          {user ? `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() : "-"}
        </Typography.Text>
        <Typography.Text strong>สถานะ</Typography.Text>
        <Tag color={getStatusColor(detailRecord.status)}>
          {statusLabelMap[detailRecord.status] ?? detailRecord.status}
        </Tag>
        <Typography.Text strong>ชั่วโมง</Typography.Text>
        <Tag color={getHourTagColor(Number(detailRecord.hours))}>
          {detailRecord.hours}
        </Tag>
        <Typography.Text strong>สร้างเมื่อ</Typography.Text>
        <Typography.Text>
          {detailRecord.created_at
            ? dayjs(detailRecord.created_at).format("DD/MM/YYYY HH:mm")
            : "-"}
        </Typography.Text>
        <Typography.Text strong>แก้ไขล่าสุด</Typography.Text>
        <Typography.Text>
          {detailRecord.updated_at
            ? dayjs(detailRecord.updated_at).format("DD/MM/YYYY HH:mm")
            : "-"}
        </Typography.Text>
      </Space>
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
          title="รายละเอียดการลงเวลาทำงาน"
          open={modalKey === "detail"}
          onCancel={() => setModalKey("")}
          footer={null}
          width={640}
        >
          {detailModalContent}
        </Modal>

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card
            title="การจัดการลงเวลาทำงาน"
            extra={
              <Space>
                <Dropdown
                  menu={{
                    items: timeModeItems,
                    onClick: handleTimeModeSelect(setGraphMode),
                  }}
                >
                  <Button icon={<BarChartOutlined />}>กราฟแท่ง</Button>
                </Dropdown>
                <Dropdown
                  menu={{
                    items: timeModeItems,
                    onClick: handleTimeModeSelect(setPieMode),
                  }}
                >
                  <Button icon={<PieChartOutlined />}>กราฟวงกลม</Button>
                </Dropdown>
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  loading={exporting}
                  onClick={handleExportAll}
                >
                  ส่งออกทั้งหมด
                </Button>
              </Space>
            }
          >
            <Table
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
        </Space>
      </DashboardLayout>
    </PermissionLayout>
  );
}
