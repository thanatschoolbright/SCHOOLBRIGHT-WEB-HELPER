"use client";
import React, { useState, useEffect } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import dayjs from "dayjs";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Spin,
  Typography,
  DatePicker,
  Row,
  Col,
  Skeleton,
} from "antd";
import {
  FiPlus,
  FiCheckCircle,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiArrowRight,
} from "react-icons/fi";
import { useAppSelector } from "@stores/store";
import { toast } from "sonner";
import { convertToThaiDateDDMMYYY } from "@/helpers/convert-time-zone-to-thai";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Project, SubProject, SubProjectForm } from "@stores/type";

export default function Page() {
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);

  const { project_id } = useParams() as { project_id: string };

  const router = useRouter();
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<
    SubProjectForm & { confirmText?: string; backlogDescription?: any }
  >({
    name: "",
    by: AUTHENTICATION.response.data.user_data.admin_id,
    confirmText: "",
    project_id: Number(project_id),
    backlogDescription: null,
    dateRange: [],
  });
  const [antdForm] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading , setActionLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<string>(""); // replaced modalOpen and deleteModalOpen
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailProject, setDetailProject] = useState<SubProject | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [total_pages, settotal_pages] = useState<number>(1);
  const limit = 10;

  // Fetch project detail for projectName

  const fetchSubProjects = async () => {
    setLoading(true);
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
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      console.log("Fetched projects:", data);
      setSubProjects(data?.data?.items || []);
      settotal_pages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setSubProjects([]);
      toast.error("โหลดโปรเจคล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsById = async (project_id: string | number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timesheet/project/read/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 10,
          page: 1,
          id: Number(project_id),
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      setProjects(data.data.items || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      toast.error("โหลดโปรเจคล้มเหลว", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateProject = async (project: SubProjectForm) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/v1/timesheet/project/sub-project/insert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });
      if (!res.ok) {
        throw new Error("Failed to create or update project");
      }
      toast.success("สร้าง/อัปเดตฟีเจอร์สำเร็จ", { duration: 5000 });
    } catch (error) {
      console.error("Error creating or updating project:", error);
      toast.error("สร้าง/อัปเดตโปรเจคล้มเหลว", { duration: 5000 });
    } finally {
      setActionLoading(false);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/timesheet/project/sub-project/delete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          by: AUTHENTICATION.response.data.user_data.admin_id,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete project");
      }
      toast.success("ลบข้อมูลสำเร็จ", { duration: 5000 });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("ลบข้อมูลล้มเหลว", { duration: 5000 });
    }
  };

  useEffect(() => {
    fetchSubProjects();
  }, [currentPage]);

  useEffect(() => {
    fetchProjectsById(project_id);
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    
    await createOrUpdateProject(form);
    setForm({
      name: "",
      project_id: Number(project_id),
      by: AUTHENTICATION.response.data.user_data.admin_id,
      backlogDescription: null,
      dateRange: [],
    });
    setModal("");
    setCurrentPage(1);
    await fetchSubProjects();
  };

  const openCreateModal = () => {
    setForm({
      name: "",
      project_id: Number(project_id),
      by: AUTHENTICATION.response.data.user_data.admin_id,
      backlogDescription: null,
      dateRange: [],
    });
    setModal("create");
  };

  const openEditModal = (project: SubProject) => {
    setForm({
      id: project.id,
      name: project.name,
      project_id: project.project_id,
      by: AUTHENTICATION.response.data.user_data.admin_id,
      backlogDescription: project.backlogDescription ?? null,
      dateRange:
        project.startDate && project.endDate
          ? [dayjs(project.startDate), dayjs(project.endDate)] // ✅ ใช้ dayjs ตรง ๆ
          : [],
    });
    setModal("edit");
  };

  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setModal("delete");
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    await deleteProject(deleteId);
    setModal("");
    setDeleteId(null);
    setCurrentPage(1);
    await fetchSubProjects();
  };

  const columns = [
    {
      title: "ลำดับ",
      dataIndex: "index",
      key: "index",
      align: "center" as const,
      width: 80,
      render: (_: any, __: any, idx: number) =>
        idx + 1 + (currentPage - 1) * limit,
    },
    {
      title: "ชื่อโปรเจค",
      dataIndex: "name",
      key: "name",
      align: "left" as const,
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: "วันเริ่มต้น",
      dataIndex: "startDate",
      key: "startDate",
      align: "left" as const,
      render: (text: string) => (
        <span>
          {text
            ? dayjs(text).format("DD/MM/YYYY")
            : "ยังไม่ได้เลือกวันที่เริ่มต้น"}
        </span>
      ),
    },
    {
      title: "วันสิ้นสุด",
      dataIndex: "endDate",
      key: "endDate",
      align: "left" as const,
      render: (text: string) => (
        <span>
          {text
            ? dayjs(text).format("DD/MM/YYYY")
            : "ยังไม่ได้เลือกวันที่สิ้นสุด"}
        </span>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center" as const,
      width: 200,
      render: (_: any, record: SubProject) => (
        <Space>
          <Button
            type="text"
            icon={<FiInfo className="w-5 h-5" />}
            onClick={() => {
              setDetailProject(record);
              setModal("detail");
            }}
            aria-label="View Details"
          />
          <Button
            type="text"
            icon={<FiEdit2 className="w-5 h-5" />}
            onClick={() => openEditModal(record)}
            aria-label="Edit Project"
          />
          <Button
            type="text"
            danger
            icon={<FiTrash2 className="w-5 h-5" />}
            onClick={() => openDeleteModal(record.id)}
            aria-label="Delete Project"
          />
        </Space>
      ),
    },
  ];

  const renderPagination = () => {
    if (total_pages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(total_pages, currentPage + 3);

    if (endPage - startPage < maxPagesToShow - 1) {
      if (startPage === 1) {
        endPage = Math.min(total_pages, startPage + maxPagesToShow - 1);
      } else if (endPage === total_pages) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < total_pages) {
      if (endPage < total_pages - 1) {
        pages.push("...");
      }
      pages.push(total_pages);
    }

    return (
      <nav className="flex justify-center mt-4" aria-label="Pagination">
        <ul className="inline-flex items-center -space-x-px text-sm font-medium">
          <li>
            <button
              className={`px-3 py-1 rounded-l-md border border-gray-300 bg-white hover:bg-gray-100 ${
                currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
              }`}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="ก่อนหน้า"
            >
              ก่อนหน้า
            </button>
          </li>
          {pages.map((page, idx) =>
            page === "..." ? (
              <li key={`ellipsis-${idx}`}>
                <span className="px-3 py-1 border border-gray-300 bg-white cursor-default">
                  ...
                </span>
              </li>
            ) : (
              <li key={page}>
                <button
                  className={`px-3 py-1 border border-gray-300 hover:bg-gray-100 ${
                    page === currentPage
                      ? "bg-blue-500 text-white cursor-default"
                      : "bg-white"
                  }`}
                  onClick={() =>
                    page !== currentPage && setCurrentPage(Number(page))
                  }
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </button>
              </li>
            )
          )}
          <li>
            <button
              className={`px-3 py-1 rounded-r-md border border-gray-300 bg-white hover:bg-gray-100 ${
                currentPage === total_pages
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
              onClick={() =>
                currentPage < total_pages && setCurrentPage(currentPage + 1)
              }
              disabled={currentPage === total_pages}
              aria-label="ถัดไป"
            >
              ถัดไป
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        <div className="w-full flex justify-start">
          <Button
            type="default"
            icon={<FiArrowRight className="w-5 h-5 rotate-180" />}
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center" }}
          >
            ย้อนกลับ
          </Button>
        </div>
        {/* Project Name Header */}
        <Card title="โครงการ" className="w-1/2 mb-2">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {projects[0]?.name}
          </Typography.Title>
        </Card>
        {/* Add Project Button */}
        <div className="w-full flex justify-end">
          <Button
            type="primary"
            icon={<FiPlus className="w-6 h-6" />}
            size="large"
            onClick={openCreateModal}
            style={{ display: "flex", alignItems: "center" }}
          >
            <span className="text-lg font-semibold">เพิ่มโครงการย่อย</span>
          </Button>
        </div>

        <Card title="รายการโครงการย่อย" className="w-full">
          {loading ? (
            <div>
              {/* Skeleton to simulate loading table rows */}
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <Table
                    columns={columns}
                    dataSource={[]}
                    pagination={false}
                    style={{ display: "none" }}
                  />
                  <div style={{ width: "100%" }}>
                    {/* Use Skeleton.Button to fill the width of the table */}
                    <Row gutter={0}>
                      <Col span={3}>
                        <Skeleton.Button
                          active
                          style={{ width: "100%", height: 32 }}
                        />
                      </Col>
                      <Col span={5}>
                        <Skeleton.Button
                          active
                          style={{ width: "100%", height: 32 }}
                        />
                      </Col>
                      <Col span={4}>
                        <Skeleton.Button
                          active
                          style={{ width: "100%", height: 32 }}
                        />
                      </Col>
                      <Col span={4}>
                        <Skeleton.Button
                          active
                          style={{ width: "100%", height: 32 }}
                        />
                      </Col>
                      <Col span={8}>
                        <Skeleton.Button
                          active
                          style={{ width: "100%", height: 32 }}
                        />
                      </Col>
                    </Row>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={subProjects}
                rowKey="id"
                pagination={false}
              />
              {renderPagination()}
            </>
          )}
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          open={modal === "create" || modal === "edit"}
          onCancel={() => setModal("")}
          title={form.id ? "แก้ไขโครงการย่อย" : "เพิ่มโครงการย่อย"}
          footer={null}
          destroyOnHidden
        >
          <Form
            form={antdForm}
            layout="vertical"
            initialValues={{
              name: form.name,
              backlogDescription: form.backlogDescription,
              dateRange: form.dateRange,
            }}
            onValuesChange={(_, allValues) =>
              setForm({ ...form, ...allValues })
            }
            onFinish={async () => {
              await handleSubmit();
              antdForm.resetFields();
            }}
          >
            <Form.Item
              name="project_id"
              initialValue={Number(project_id)}
              hidden
            >
              <Input type="hidden" />
            </Form.Item>
            <Form.Item
              label="ชื่อโครงการย่อย"
              name="name"
              rules={[{ required: true, message: "กรุณากรอกชื่อโปรเจค" }]}
            >
              <Input placeholder="กรอกชื่อโปรเจค" />
            </Form.Item>
            {/* Start Date & End Date */}
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="วันที่เริ่มต้น - วันที่สิ้นสุด"
                  name="dateRange"
                  rules={[{ required: true, message: "กรุณาเลือกช่วงวันที่" }]}
                >
                  <DatePicker.RangePicker
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                    placeholder={["กรอกวันที่เริ่มต้น", "กรอกวันที่สิ้นสุด"]}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Backlog Description: note and backlogs */}
            <Form.Item label="โน้ต" name={["backlogDescription", "note"]}>
              <Input placeholder="กรอก Note" />
            </Form.Item>
            <Form.List name={["backlogDescription", "backlogs"]}>
              {(fields, { add, remove }) => (
                <>
                  <label
                    style={{
                      fontWeight: 500,
                      marginBottom: 4,
                      display: "block",
                    }}
                  >
                    Backlogs
                  </label>
                  {fields.map((field, idx) => (
                    <Space
                      key={field.key}
                      align="start"
                      style={{ display: "flex", marginBottom: 8 }}
                    >
                      <Form.Item
                        name={[field.name, "title"]}
                        rules={[{ required: true, message: "กรอกชื่อเรื่อง" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="Title" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "link"]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="Link" />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(field.name)}
                        disabled={fields.length <= 0}
                        aria-label="ลบ"
                      >
                        ลบ
                      </Button>
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<FiPlus />}
                      disabled={fields.length >= 5}
                    >
                      เพิ่ม Backlog
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <Button onClick={() => setModal("")}>ยกเลิก</Button>
              {actionLoading ? (
                <Skeleton.Button active style={{ width: 100, height: 32 }} />
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<FiCheckCircle className="w-5 h-5" />}
                  disabled={actionLoading}
                >
                  บันทึก
                </Button>
              )}
              
            </div>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={modal === "delete"}
          onCancel={() => setModal("")}
          title="ยืนยันการลบ"
          footer={null}
          destroyOnHidden
        >
          <div className="space-y-4 mt-2">
            <Typography.Text type="danger" strong>
              คุณต้องการยืนยันที่จะลบโปรเจคนี้จริงหรือไม่
            </Typography.Text>
            <Typography.Text>
              โปรดพิมพ์{" "}
              <span style={{ fontWeight: "bold", color: "#f5222d" }}>
                Delete
              </span>{" "}
              เพื่อยืนยัน
            </Typography.Text>
            <Input
              placeholder="พิมพ์ Delete เพื่อยืนยัน"
              value={form.confirmText}
              onChange={(e) =>
                setForm({ ...form, confirmText: e.target.value })
              }
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button onClick={() => setModal("")}>ยกเลิก</Button>
            <Button
              type="primary"
              danger
              icon={<FiTrash2 className="w-5 h-5" />}
              onClick={confirmDelete}
              disabled={form.confirmText !== "Delete"}
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
          title="รายละเอียดโปรเจค"
          footer={[
            <Button
              key="close"
              onClick={() => {
                setModal("");
                setDetailProject(null);
              }}
            >
              ปิด
            </Button>,
          ]}
          destroyOnHidden
        >
          {detailProject && (
            <>
              <Card size="small" title="ข้อมูลทั่วไป" style={{ padding: 8 }}>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Typography.Paragraph>
                    <Typography.Text strong>ชื่อโปรเจค: </Typography.Text>
                    {detailProject.name}
                  </Typography.Paragraph>
                  <Typography.Paragraph>
                    <Typography.Text strong>โปรเจ็คหลัก: </Typography.Text>
                    {projects[0]?.name}
                  </Typography.Paragraph>
                  <Typography.Paragraph>
                    <Typography.Text strong>สร้างโดย (id): </Typography.Text>
                    {detailProject.createdBy}
                  </Typography.Paragraph>
                  <Typography.Paragraph>
                    <Typography.Text strong>สร้างเมื่อ: </Typography.Text>
                    {convertToThaiDateDDMMYYY(detailProject.createdAt)}
                  </Typography.Paragraph>
                  <Typography.Paragraph>
                    <Typography.Text strong>แก้ไขล่าสุด: </Typography.Text>
                    {convertToThaiDateDDMMYYY(detailProject.updatedAt)}
                  </Typography.Paragraph>
                  <Typography.Paragraph>
                    <Typography.Text strong>วันเริ่มต้น: </Typography.Text>
                    {detailProject.startDate
                      ? dayjs(detailProject.startDate).format("DD/MM/YYYY")
                      : "ยังไม่ได้เลือกวันที่เริ่มต้น"}
                  </Typography.Paragraph>
                  <Typography.Paragraph>
                    <Typography.Text strong>วันสิ้นสุด: </Typography.Text>
                    {detailProject.endDate
                      ? dayjs(detailProject.endDate).format("DD/MM/YYYY")
                      : "ยังไม่ได้เลือกวันที่สิ้นสุด"}
                  </Typography.Paragraph>
                </Space>
              </Card>
              <Card
                size="small"
                title="Backlogs"
                style={{ marginTop: 16, padding: 0 }}
                bodyStyle={{ padding: 16 }}
              >
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  {detailProject.backlogDescription ? (
                    <>
                      {/* If backlogDescription is an array (legacy) */}
                      {Array.isArray(detailProject.backlogDescription) &&
                        detailProject.backlogDescription.length > 0 && (
                          <Space
                            direction="vertical"
                            size={8}
                            style={{ width: "100%" }}
                          >
                            {detailProject.backlogDescription.map(
                              (item: any, idx: number) => (
                                <Card
                                  key={idx}
                                  size="small"
                                  styles={{ body: { padding: 12 } }}
                                  style={{ marginBottom: 8 }}
                                >
                                  <Typography.Text
                                    strong
                                    style={{ fontSize: 15 }}
                                  >
                                    {item.title}
                                  </Typography.Text>
                                  {item.link && (
                                    <div style={{ marginTop: 4 }}>
                                      <Typography.Link
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {item.link}
                                      </Typography.Link>
                                    </div>
                                  )}
                                  {item.description && (
                                    <div style={{ marginTop: 4 }}>
                                      <Typography.Text>
                                        {item.description}
                                      </Typography.Text>
                                    </div>
                                  )}
                                </Card>
                              )
                            )}
                          </Space>
                        )}
                      {/* If backlogDescription is an object with note/backlogs */}
                      {!Array.isArray(detailProject.backlogDescription) &&
                        typeof detailProject.backlogDescription === "object" &&
                        detailProject.backlogDescription !== null && (
                          <Space
                            direction="vertical"
                            size={8}
                            style={{ width: "100%" }}
                          >
                            {"note" in detailProject.backlogDescription &&
                              detailProject.backlogDescription.note && (
                                <Typography.Paragraph
                                  type="secondary"
                                  italic
                                  style={{ marginBottom: 2 }}
                                >
                                  {detailProject.backlogDescription.note}
                                </Typography.Paragraph>
                              )}
                            {"backlogs" in detailProject.backlogDescription &&
                              Array.isArray(
                                detailProject.backlogDescription.backlogs
                              ) &&
                              detailProject.backlogDescription.backlogs.map(
                                (item: any, idx: number) => (
                                  <Card
                                    key={idx}
                                    size="small"
                                    styles={{ body: { padding: 12 } }}
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Typography.Text
                                      strong
                                      style={{ fontSize: 15 }}
                                    >
                                      {item.title}
                                    </Typography.Text>
                                    {item.link && (
                                      <div style={{ marginTop: 4 }}>
                                        <Typography.Link
                                          href={item.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          {item.link}
                                        </Typography.Link>
                                      </div>
                                    )}
                                    {item.description && (
                                      <div style={{ marginTop: 4 }}>
                                        <Typography.Text>
                                          {item.description}
                                        </Typography.Text>
                                      </div>
                                    )}
                                  </Card>
                                )
                              )}
                            {/* Fallback if no note or backlogs */}
                            {!detailProject.backlogDescription.note &&
                              !(
                                Array.isArray(
                                  detailProject.backlogDescription.backlogs
                                ) &&
                                detailProject.backlogDescription.backlogs
                                  .length > 0
                              ) && (
                                <Typography.Text>
                                  {String(detailProject.backlogDescription)}
                                </Typography.Text>
                              )}
                          </Space>
                        )}
                      {/* If backlogDescription is a primitive */}
                      {!Array.isArray(detailProject.backlogDescription) &&
                        (typeof detailProject.backlogDescription !== "object" ||
                          detailProject.backlogDescription === null) && (
                          <Typography.Text>
                            {String(detailProject.backlogDescription)}
                          </Typography.Text>
                        )}
                    </>
                  ) : (
                    <Typography.Text type="secondary">
                      ไม่มีข้อมูล Backlogs
                    </Typography.Text>
                  )}
                </Space>
              </Card>
            </>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
