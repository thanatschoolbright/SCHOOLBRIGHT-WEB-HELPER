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

const DATE_FORMAT = "DD/MM/YYYY";
const PAGE_SIZE = 30;

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

  const closeModal = useCallback(() => {
    setModalType(null);
    setActiveRecord(null);
    setFormMode("create");
    setConfirmText("");
    form.resetFields();
  }, [form]);

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

  const openDetailModal = useCallback((record: TimesheetEntry) => {
    setActiveRecord(record);
    setModalType("detail");
  }, []);

  const openDeleteModal = useCallback(() => {
    setConfirmText("");
    setModalType("delete");
  }, []);

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
      onFilterDropdownOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInputRefs.current[dataIndex]?.select(), 100);
        }
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
          <Card
            bordered={false}
            title="การลงเวลาทำงาน"
            extra={
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchEntries()}
                  loading={tableLoading}
                >
                  รีเฟรช
                </Button>
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
