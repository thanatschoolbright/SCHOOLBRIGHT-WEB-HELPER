"use client";
import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import type { Key } from "react";
import {
  FiPlus,
  FiCheckCircle,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiClock,
} from "react-icons/fi";
import dayjs from "dayjs";
import { useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { convertToThaiDateDDMMYYY } from "@helpers/convert-time-zone-to-thai";
import { Project, SubProject, WorkEntryForm } from "@stores/type";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Spin,
  Typography,
  Row,
  Col,
  DatePicker,
  TableProps,
  Descriptions,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import PermissionLayout from "@/components/layouts/permission-layout";
import { useTranslation } from "react-i18next";

const STATUS_OPTIONS = [
  {
    label_th: "ร่าง",
    label_en: "Draft",
    value: "DRAFT",
  },
  {
    label_th: "กำลังดำเนินการ",
    label_en: "In Progress",
    value: "IN_PROGRESS",
  },
  {
    label_th: "รอตรวจสอบ",
    label_en: "Review",
    value: "REVIEW",
  },
  {
    label_th: "เสร็จสิ้น",
    label_en: "Done",
    value: "DONE",
  },
  {
    label_th: "ยกเลิก",
    label_en: "Cancelled",
    value: "CANCELLED",
  },
];
type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

export default function Page() {
  const { t, i18n } = useTranslation("mock");

  const [antdForm] = Form.useForm();
  // Track work_hour value for warning tooltip
  const [workHours, setWorkHours] = useState<number | null>(null);
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const AUTH_USER = AUTHENTICATION?.response?.data?.user_data;

  const limit = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [total_pages, settotal_pages] = useState<number>(1);

  const [entries, setEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subProject, setSubProjects] = useState<SubProject[]>([]);
  // Inline editing state
  const [editingKey, setEditingKey] = useState<string | number>("");
  const [confirmText, setConfirmText] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<string>(""); // replaced modalOpen and deleteModalOpen
  const [detailProject, setDetailProject] = useState<WorkEntryForm>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const hasSelected = selectedRowKeys.length > 0;

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<any> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit, page: currentPage }),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      setProjects(data.data || []);
      settotal_pages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      toast.error("โหลดข้อมูลล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchTimesheetEntry = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/entry/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit,
          page: currentPage,
          user_id: Number(AUTH_USER?.admin_id) ?? null,
        }),
      });

      const data = await res.json();
      // Group entries by date using dayjs(item.date).format("YYYY-MM-DD")
      const rawEntries = data.data || [];
      const groupedObj: { [date: string]: any[] } = rawEntries.reduce(
        (acc: any, item: any) => {
          const dateKey = dayjs(item.date).format("YYYY-MM-DD");
          if (!acc[dateKey]) acc[dateKey] = [];
          acc[dateKey].push(item);
          return acc;
        },
        {}
      );
      const groupedData = Object.entries(groupedObj).map(
        ([date, children]) => ({
          key: date,
          date,
          children,
        })
      );
      setEntries(groupedData);
      settotal_pages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Error fetching timesheet entries:", error);
      setEntries([]);
      toast.error("โหลดข้อมูลล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubProjects = async (project_id: string) => {
    try {
      const res = await fetch("/api/v1/timesheet/project/sub-project/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit,
          page: currentPage,
          project_id: Number(project_id),
        }),
      });
      const data = await res.json();
      setSubProjects(data?.data?.items || []);
      settotal_pages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setSubProjects([]);
      toast.error("โหลดข้อมูลล้มเหลว", { duration: 5000 });
    }
  };

  const createOrUpdateEntry = async () => {
    console.log("Form Values at submission:", antdForm.getFieldsValue());
    const raw = antdForm.getFieldsValue();
    const payload = {
      ...raw,
      id: raw.id,
      date: raw.date ? dayjs(raw.date).toDate() : undefined,
      by: AUTH_USER?.admin_id,
    };
    try {
      const res = await fetch(`/api/v1/timesheet/entry/insert/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to create or update entry");
      }
      toast.success("สร้าง/อัปเดต ข้อมูลสำเร็จ", { duration: 5000 });
      fetchTimesheetEntry();
    } catch (error) {
      console.error("Error creating or updating entry:", error);
      toast.error("สร้าง/อัปเดต ข้อมูลล้มเหลว", { duration: 5000 });
    }
  };

  const deleteEntry = async (ids: number[]) => {
    try {
      const res = await fetch(`/api/v1/timesheet/entry/delete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids,
          by: AUTH_USER?.admin_id,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete entry");
      }
      toast.success("ลบข้อมูลสำเร็จ", { duration: 5000 });
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("ลบข้อมูลล้มเหลว", { duration: 5000 });
    }
  };

  useEffect(() => {
    fetchTimesheetEntry();
    fetchProjects();
  }, [currentPage]);

  const handleSubmit = async () => {
    await createOrUpdateEntry();
    antdForm.resetFields();
    setEditingKey("");
    setModal("");
    await fetchTimesheetEntry();
  };

  const openCreateModal = () => {
    antdForm.resetFields();
    setWorkHours(null);
    antdForm.setFieldsValue({
      project_id: "",
      sub_project_id: "",
      description: "",
      work_hour: "",
      date: dayjs(),
      status: undefined,
    });
    setEditingKey("");
    setModal("create");
  };

  // Inline editing helpers
  const isEditing = (record: any) => record.id === editingKey;
  const edit = async (record: any) => {
    // Ensure subprojects are loaded before setting form values
    await fetchSubProjects(record.project_id);
    antdForm.setFieldsValue({
      id: record.id,
      project_id: record.project_id ? String(record.project_id) : "",
      sub_project_id: record.feature_id ? String(record.feature_id) : "",
      work_hour: record.hours ? String(record.hours) : "",
      description: record?.description ?? "",
      date: record.date ? dayjs(record.date) : dayjs(),
      status: record.status,
    });
    setEditingKey(record.id);
    setWorkHours(
      record.hours !== undefined && record.hours !== null && record.hours !== ""
        ? Number(record.hours)
        : null
    );
  };
  const cancel = () => {
    setEditingKey("");
    setWorkHours(null);
  };
  const save = async (key: string | number) => {
    try {
      const row = await antdForm.validateFields();
      // Compose payload for update
      const payload = {
        ...row,
        id: key,
        date: row.date ? dayjs(row.date).toDate() : undefined,
        by: AUTH_USER?.admin_id,
      };
      await fetch(`/api/v1/timesheet/entry/insert/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      toast.success("สร้าง/อัปเดต ข้อมูลสำเร็จ", { duration: 5000 });
      setEditingKey("");
      setWorkHours(null);
      await fetchTimesheetEntry();
    } catch (errInfo) {
      console.error("Validate Failed:", errInfo);
    }
  };

  // Batch delete function
  const confirmBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    await deleteEntry(selectedRowKeys.map((id) => Number(id)));
    setSelectedRowKeys([]);
    setConfirmText("");
    setModal("");
    await fetchTimesheetEntry();
  };

  // AntD Table columns
  // Editable cell for Ant Design Table
  const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }: any) => {
    let inputNode = null;
    switch (dataIndex) {
      case "project_name":
        inputNode = (
          <Select
            showSearch
            placeholder="เลือกโปรเจ็ค"
            onChange={(value) => {
              fetchSubProjects(String(value));
              antdForm.setFieldsValue({ sub_project_id: "" });
            }}
            options={[
              ...projects.map((s) => ({
                label: s.name + " (" + "รหัสโปรเจ็ค" + +s.id + ")",
                value: String(s.id),
              })),
            ]}
          />
        );
        break;
      case "feature_name":
        inputNode = (
          <Select
            showSearch
            placeholder="เลือกโปรเจ็คย่อย"
            options={[
              ...subProject.map((s) => ({
                label: s.name + " (" + "รหัสโปรเจ็ค" + +s.id + ")",
                value: String(s.id),
              })),
            ]}
          />
        );
        break;
      case "date":
        inputNode = (
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        );
        break;
      case "status":
        inputNode = (
          <Select
            placeholder="เลือกสถานะ"
            options={STATUS_OPTIONS.map((data) => ({
              label: i18n.language === "th" ? data.label_th : data.label_en,
              value: data.value,
            }))}
          />
        );
        break;
      case "hours":
        inputNode = (
          <Input
            type="number"
            min={0}
            onChange={(e) => {
              const val = e.target.value;
              setWorkHours(val === "" ? null : Number(val));
            }}
            suffix={
              <>
                {workHours !== null && workHours >= 8 ? (
                  <Tooltip title="คุณต้องการใส่เกิน 8 ชั่วโมงจริงๆหรือ?">
                    <ExclamationCircleOutlined
                      style={{ color: "red", marginRight: 8 }}
                    />
                  </Tooltip>
                ) : null}
                <span className="text-gray-500 text-sm font-medium">
                  ชั่วโมง
                </span>
              </>
            }
            style={{ textAlign: "right" }}
          />
        );
        break;
      case "description":
        inputNode = (
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 3 }}
            placeholder="กรอกคำอธิบายโปรเจค"
          />
        );
        break;
      default:
        inputNode = <Input />;
    }
    let name;
    // Map table columns to form field names
    switch (dataIndex) {
      case "project_name":
        name = "project_id";
        break;
      case "feature_name":
        name = "sub_project_id";
        break;
      case "hours":
        name = "work_hour";
        break;
      default:
        name = dataIndex;
    }
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={name}
            style={{ margin: 0 }}
            rules={
              name === "project_id"
                ? [{ required: true, message: "กรุณาเลือกโปรเจ็ค" }]
                : name === "sub_project_id"
                ? [{ required: true, message: "กรุณาเลือกโปรเจ็คย่อย" }]
                : name === "date"
                ? [{ required: true, message: "กรุณาเลือกวันที่ทำงาน" }]
                : name === "status"
                ? [{ required: true, message: "กรุณาเลือกสถานะ" }]
                : name === "work_hour"
                ? [{ required: true, message: "กรุณากรอกชั่วโมงทำงาน" }]
                : []
            }
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  // Table columns with inline editing
  const columns = [
    {
      title: "วันที่",
      dataIndex: "date",
      key: "date",
      align: "left" as const,
      editable: true,
      render: (date: string, record: any) => {
        if (record.children) {
          return (
            <Typography.Text strong>
              {dayjs(date).format("DD/MM/YYYY")}
            </Typography.Text>
          );
        }
        return date ? convertToThaiDateDDMMYYY(date) : "";
      },
      sorter: (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: "ชื่อโปรเจ็ค",
      dataIndex: "project_name",
      key: "project_name",
      align: "left" as const,
      editable: true,
      sorter: (a: any, b: any) => a.project_name.localeCompare(b.project_name),
      filters: projects
        .map((p) => ({ text: p.name, value: p.name }))
        .filter((v, i, arr) => arr.findIndex((x) => x.value === v.value) === i),
      onFilter: (value: boolean | Key, record: any) =>
        record.project_name === value,
    },
    {
      title: "ชื่อฟีเจอร์",
      dataIndex: "feature_name",
      key: "feature_name",
      align: "left" as const,
      editable: true,
      render: (_: any, record: any) =>
        record.feature_name || record.feature_name,
      sorter: (a: any, b: any) =>
        (a.feature_name || "").localeCompare(b.feature_name || ""),
    },
    {
      title: "คำอธิบาย",
      dataIndex: "description",
      key: "description",
      align: "left" as const,
      editable: true,
      sorter: (a: any, b: any) =>
        (a.description || "").localeCompare(b.description || ""),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      align: "left" as const,
      editable: true,
      render: (status: string) => {
        const option = STATUS_OPTIONS.find((opt) => opt.value === status);
        const label = option
          ? i18n.language === "th"
            ? option.label_th
            : option.label_en
          : status;
        let color: string = "default";
        switch (status) {
          case "DONE":
            color = "green";
            break;
          case "IN_PROGRESS":
            color = "orange";
            break;
          case "REVIEW":
            color = "blue";
            break;
          case "CANCELLED":
            color = "red";
            break;
          case "DRAFT":
            color = "default";
            break;
        }
        return <Tag color={color}>{label}</Tag>;
      },
      filters: STATUS_OPTIONS.map((opt) => ({
        text: i18n.language === "th" ? opt.label_th : opt.label_en,
        value: opt.value,
      })),
      onFilter: (value: boolean | Key, record: any) => record.status === value,
    },
    {
      title: "ชั่วโมง",
      dataIndex: "hours",
      key: "hours",
      align: "left" as const,
      editable: true,
      sorter: (a: any, b: any) => Number(a.hours) - Number(b.hours),
      render: (hours: string | number) => {
        const value = Number(hours);
        let color = "gold";
        let label = value;
        if (value >= 8) {
          color = "red";
          label = value;
        } else if (value < 4) {
          color = "green";
          label = value;
        } else {
          color = "yellow";
          label = value;
        }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "จัดการ",
      key: "action",
      fixed: "right" as const,
      align: "center" as const,
      render: (_: any, record: any) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Button
              type="link"
              onClick={() => save(record.id)}
              style={{ marginRight: 8 }}
            >
              บันทึก
            </Button>
            <Button type="link" onClick={cancel}>
              ยกเลิก
            </Button>
          </span>
        ) : (
          <Space>
            <Button
              size="small"
              icon={<FiInfo />}
              onClick={() => {
                setDetailProject(record);
                setModal("detail");
              }}
              aria-label="View Details"
            />
            <Button
              size="small"
              icon={<FiEdit2 />}
              disabled={editingKey !== ""}
              onClick={() => edit(record)}
              aria-label="Edit Entry"
            />
          </Space>
        );
      },
    },
  ];

  // Add onCell for editable columns
  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: any) => ({
        record,
        inputType:
          col.dataIndex === "hours"
            ? "number"
            : col.dataIndex === "date"
            ? "date"
            : col.dataIndex === "project_name" ||
              col.dataIndex === "feature_name" ||
              col.dataIndex === "status"
            ? "select"
            : "text",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <Spin />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <PermissionLayout role={["ALL"]}>
      <DashboardLayout>
        <div className="w-full space-y-4">
          {/* Add Project Button */}
          <div className="w-full flex justify-end">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={openCreateModal}
              style={{ minWidth: 160 }}
            >
              เพิ่มโปรเจค
            </Button>
          </div>

          <Card title="รายการลงเวลาทำงาน" className="w-full">
            <div className="flex justify-end mb-3">
              <Button
                type="primary"
                danger
                icon={<FiTrash2 />}
                onClick={() => {
                  setModal("delete");
                  setConfirmText("");
                }}
                disabled={!hasSelected}
              >
                ลบที่เลือก
              </Button>
            </div>
            <Form form={antdForm} component={false}>
              <Table
                components={{
                  body: {
                    cell: EditableCell,
                  },
                }}
                columns={mergedColumns}
                dataSource={entries}
                rowSelection={rowSelection}
                rowKey={(record: any) => record.id ?? record.key}
                pagination={{
                  current: currentPage,
                  total: total_pages * limit,
                  pageSize: limit,
                  onChange: setCurrentPage,
                  showSizeChanger: false,
                }}
                bordered
                scroll={{ x: "max-content" }}
                style={{ overflowX: "auto" }}
              />
            </Form>
          </Card>

          {/* Delete Confirmation Modal */}
          <Modal
            open={modal === "delete"}
            onCancel={() => {
              setConfirmText("");
              setModal("");
            }}
            title="ยืนยันการลบ"
            footer={null}
          >
            <div className="space-y-4 mt-4">
              <Typography.Text type="danger" strong>
                คุณต้องการยืนยันที่จะลบข้อมูลที่เลือกเหล่านี้จริงหรือไม่
              </Typography.Text>
              <Typography.Text>
                โปรดพิมพ์ <span className="font-bold text-red-600">Delete</span>{" "}
                เพื่อยืนยัน
              </Typography.Text>
              <Input
                type="text"
                placeholder="พิมพ์ Delete เพื่อยืนยัน"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <Button
                type="default"
                className="w-full sm:w-auto px-6 py-3 rounded"
                onClick={() => setModal("")}
                icon={<FiCheckCircle className="w-5 h-5" />}
              >
                ยกเลิก
              </Button>
              <Button
                type="primary"
                danger
                className="w-full sm:w-auto px-6 py-3"
                onClick={confirmBatchDelete}
                disabled={confirmText !== "Delete"}
                icon={<FiTrash2 className="w-5 h-5" />}
              >
                ลบ
              </Button>
            </div>
          </Modal>

          {/* Detail Modal */}
          <Modal
            open={modal === "detail" && !!detailProject}
            onCancel={() => {
              setModal("");
            }}
            title="รายละเอียดการลงเวลาทำงาน"
            footer={[
              <Button
                key="close"
                type="default"
                className="w-full sm:w-auto px-6 py-3 rounded"
                onClick={() => {
                  setModal("");
                }}
              >
                ปิด
              </Button>,
            ]}
          >
            {detailProject && (
              <div className="mt-5">
                <Descriptions
                  bordered
                  column={1}
                  size="middle"
                  layout="horizontal"
                  styles={{
                    label: { width: 120, fontWeight: 600 },
                  }}
                >
                  <Descriptions.Item label="รหัส">
                    {detailProject.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="รหัสโปรเจค">
                    {detailProject.project_id ?? detailProject.id}
                  </Descriptions.Item>
                  {detailProject.feature_id !== undefined &&
                    detailProject.feature_id !== null && (
                      <Descriptions.Item label="รหัสฟีเจอร์">
                        {detailProject.feature_id}
                      </Descriptions.Item>
                    )}
                  <Descriptions.Item label="คำอธิบาย">
                    <Typography.Text
                      color="blue"
                      style={{ fontSize: 16, padding: "4px 12px" }}
                    >
                      {detailProject.description || "-"}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="สถานะ">
                    {(() => {
                      const status = detailProject.status;
                      let color = "default";
                      let label = status;
                      const opt = STATUS_OPTIONS.find(
                        (s) => s.value === status
                      );
                      if (opt) {
                        label = opt.label_th;
                      }
                      switch (status) {
                        case "DONE":
                          color = "green";
                          break;
                        case "IN_PROGRESS":
                          color = "orange";
                          break;
                        case "REVIEW":
                          color = "blue";
                          break;
                        case "CANCELLED":
                          color = "red";
                          break;
                        case "DRAFT":
                        default:
                          color = "default";
                          break;
                      }
                      return (
                        <Tag color={color} style={{ fontSize: 15 }}>
                          {label}
                        </Tag>
                      );
                    })()}
                  </Descriptions.Item>
                  <Descriptions.Item label="ชั่วโมง">
                    <Tag
                      color={
                        Number(detailProject.hours) >= 8
                          ? "red"
                          : Number(detailProject.hours) < 4
                          ? "green"
                          : "gold"
                      }
                      style={{ fontSize: 15 }}
                    >
                      {detailProject.hours}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="สร้างเมื่อ">
                    {detailProject.created_at
                      ? dayjs(detailProject.created_at).format(
                          "DD/MM/YYYY HH:mm"
                        )
                      : "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="แก้ไขล่าสุด">
                    {detailProject.updated_at
                      ? dayjs(detailProject.updated_at).format(
                          "DD/MM/YYYY HH:mm"
                        )
                      : "-"}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Modal>
        </div>
      </DashboardLayout>
    </PermissionLayout>
  );
}
