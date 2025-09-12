"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
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
import { Project, SubProject } from "@stores/type";
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
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
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
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);
  const AUTH_USER = AUTHENTICATION?.response?.data?.user_data;

  const limit = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [total_pages, settotal_pages] = useState<number>(1);

  const [entries, setEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subProject, setSubProjects] = useState<SubProject[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<string>(""); // replaced modalOpen and deleteModalOpen
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
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
      setEntries(data.data || []);
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
    setEditingEntryId(null);
    setModal("");
    await fetchTimesheetEntry();
  };

  const openCreateModal = () => {
    antdForm.resetFields();
    antdForm.setFieldsValue({
      project_id: "",
      sub_project_id: "",
      description: "",
      work_hour: "",
      date: dayjs(),
      status: undefined,
    });
    setEditingEntryId(null);
    setModal("create");
  };

  const openEditModal = async (entry: any) => {
    setModalLoading(true);
    setEditingEntryId(entry.id ?? null);
    // Ensure subprojects are loaded before setting form values
    await fetchSubProjects(entry.project_id);
    console.info("PRIMARY ID", entry.id);
    antdForm.setFieldsValue({
      id: entry.id,
      project_id: entry.project_id ? String(entry.project_id) : "",
      sub_project_id: entry.feature_id ? String(entry.feature_id) : "",
      work_hour: entry.hours ? String(entry.hours) : "",
      description: entry.description || "",
      date: entry.date ? dayjs(entry.date) : dayjs(),
      status: entry.status,
    });
    setModalLoading(false);
    setModal("edit");
  };

  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setConfirmText("");
    setModal("delete");
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
  const columns = [
    {
      title: "ลำดับ",
      dataIndex: "index",
      key: "index",
      align: "center" as const,
      render: (_: any, __: any, idx: number) =>
        idx + 1 + (currentPage - 1) * limit,
    },
    {
      title: "รหัส",
      dataIndex: "id",
      key: "id",
      align: "center" as const,
    },
    {
      title: "ชื่อโปรเจ็ค",
      dataIndex: "project_name",
      key: "project_name",
      align: "center" as const,
    },
    {
      title: "ชื่อฟีเจอร์",
      dataIndex: "feature_name",
      key: "feature_name",
      align: "center" as const,
      // fallback to featureId if feature_id is missing
      render: (_: any, record: any) =>
        record.feature_name || record.feature_name,
    },
    {
      title: "วันที่",
      dataIndex: "date",
      key: "date",
      align: "center" as const,
      render: (date: string) => (date ? convertToThaiDateDDMMYYY(date) : ""),
    },
    {
      title: "ชั่วโมง",
      dataIndex: "hours",
      key: "hours",
      align: "center" as const,
    },
    {
      title: "คำอธิบาย",
      dataIndex: "description",
      key: "description",
      align: "left" as const,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>{status}</Tag>
      ),
    },
    {
      title: "สร้างเมื่อ",
      dataIndex: "createdAt",
      key: "createdAt",
      align: "center" as const,
      render: (createdAt: string) =>
        createdAt ? convertToThaiDateDDMMYYY(createdAt) : "",
    },
    {
      title: "แก้ไขเมื่อ",
      dataIndex: "updatedAt",
      key: "updatedAt",
      align: "center" as const,
      render: (updatedAt: string) =>
        updatedAt ? convertToThaiDateDDMMYYY(updatedAt) : "",
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center" as const,
      render: (_: any, record: any) => (
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
            onClick={() => openEditModal(record)}
            aria-label="Edit Entry"
          />
        </Space>
      ),
    },
  ];

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
          <Table
            columns={columns}
            dataSource={entries}
            rowSelection={rowSelection}
            rowKey="id"
            pagination={{
              current: currentPage,
              total: total_pages * limit,
              pageSize: limit,
              onChange: setCurrentPage,
              showSizeChanger: false,
            }}
            scroll={{ x: "max-content" }}
            style={{ overflowX: "auto" }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          open={modal === "create" || modal === "edit"}
          onCancel={() => setModal("")}
          title={editingEntryId ? "แก้ไขเวลาการทำงาน" : "เพิ่มเวลาการทำงาน"}
          footer={null}
          width={700}
          style={{ top: 40 }}
        >
          <div style={{ paddingTop: 16 }}>
            {modalLoading ? (
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
            ) : (
              <Form
                layout="vertical"
                className="mt-0"
                onFinish={handleSubmit}
                form={antdForm}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="เลือกโปรเจ็ค"
                      name="project_id"
                      rules={[{ required: true, message: "กรุณาเลือกโปรเจ็ค" }]}
                    >
                      <Select
                        showSearch
                        placeholder="เลือกโปรเจ็ค"
                        onChange={(value) => {
                          fetchSubProjects(String(value));
                        }}
                        options={[
                          { label: "เลือกรายการ", value: "" },
                          ...projects.map((s) => ({
                            label: s.name + " (" + "รหัสโปรเจ็ค" + +s.id + ")",
                            value: String(s.id),
                          })),
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="เลือกโปรคเจ็คย่อย"
                      name="sub_project_id"
                      rules={[
                        { required: true, message: "กรุณาเลือกโปรเจ็คย่อย" },
                      ]}
                    >
                      <Select
                        showSearch
                        placeholder="เลือกโปรเจ็ค"
                        options={[
                          { label: "เลือกรายการ", value: "" },
                          ...subProject.map((s) => ({
                            label: s.name + " (" + "รหัสโปรเจ็ค" + +s.id + ")",
                            value: String(s.id),
                          })),
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="วันที่ทำงาน"
                      name="date"
                      rules={[
                        { required: true, message: "กรุณาเลือกวันที่ทำงาน" },
                      ]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        placeholder="เลือกวันที่"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="สถานะ"
                      name="status"
                      initialValue={"DRAFT"}
                      rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
                    >
                      <Select
                        placeholder="เลือกสถานะ"
                        options={STATUS_OPTIONS.map((data) => ({
                          label:
                            i18n.language === "th"
                              ? data.label_th
                              : data.label_en,
                          value: data.value,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label="ชั่วโมงทำงาน"
                      name="work_hour"
                      rules={[
                        { required: true, message: "กรุณากรอกชั่วโมงทำงาน" },
                      ]}
                    >
                      <Input
                        prefix={<FiClock className="w-5 h-5 text-gray-400" />}
                        suffix={
                          <span className="text-gray-500 text-sm font-medium">
                            ชั่วโมง
                          </span>
                        }
                        placeholder="กรอกจำนวนชั่วโมงที่ทำงาน"
                        type="text"
                        style={{ textAlign: "right" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="คำอธิบายโปรเจค" name="description">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <Input.TextArea
                      placeholder="กรอกคำอธิบายโปรเจค"
                      autoSize={{ minRows: 2, maxRows: 5 }}
                    />
                  </div>
                </Form.Item>
                <Row justify="end" gutter={8}>
                  <Col>
                    <Button
                      type="default"
                      className="w-full sm:w-auto px-6 py-3 rounded"
                      onClick={() => setModal("")}
                    >
                      ยกเลิก
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      className="w-full sm:w-auto px-6 py-3 flex items-center space-x-2"
                      htmlType="submit"
                      icon={<FiCheckCircle className="w-5 h-5" />}
                    >
                      <span>บันทึก</span>
                    </Button>
                  </Col>
                </Row>
              </Form>
            )}
          </div>
        </Modal>

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
            setDetailProject(null);
          }}
          title="รายละเอียดการลงเวลาทำงาน"
          footer={[
            <Button
              key="close"
              type="default"
              className="w-full sm:w-auto px-6 py-3 rounded"
              onClick={() => {
                setModal("");
                setDetailProject(null);
              }}
            >
              ปิด
            </Button>,
          ]}
        >
          {detailProject && (
            <div className="space-y-3 mt-5">
              <p>
                <strong>รหัส:</strong> {detailProject.id}
              </p>
              <p>
                <strong>รหัสโปรเจค:</strong> {detailProject.id}
              </p>

              <p>
                <strong>คำอธิบาย:</strong> {detailProject.description}
              </p>

              <p>
                <strong>สร้างเมื่อ:</strong>{" "}
                {convertToThaiDateDDMMYYY(detailProject.createdAt)}
              </p>
              <p>
                <strong>แก้ไขล่าสุด:</strong>{" "}
                {convertToThaiDateDDMMYYY(detailProject.updatedAt)}
              </p>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
